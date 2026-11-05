import { Router, type IRouter, type Request } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../lib/database";

const router: IRouter = Router();

function emailAddress(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
    ? email
    : null;
}

function passwordValue(value: unknown): string | null {
  return typeof value === "string" && value.length >= 8 && value.length <= 128
    ? value
    : null;
}

function startSession(
  req: Request,
  userId: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.userId = userId;
      req.session.save((saveError) => {
        if (saveError) return reject(saveError);
        resolve();
      });
    });
  });
}

router.post("/auth/register", async (req, res) => {
  const email = emailAddress(req.body?.email);
  const password = passwordValue(req.body?.password);
  if (!email || !password) {
    res.status(400).json({ message: "Enter a valid email and a password of at least 8 characters." });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query<{ id: string; email: string }>(
      `INSERT INTO planner_users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [email, passwordHash],
    );
    const user = result.rows[0];
    if (!user) {
      res.status(500).json({ message: "The account could not be created." });
      return;
    }
    await startSession(req, user.id);
    res.status(201).json({ user });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ message: "An account with this email already exists." });
      return;
    }
    req.log.error({ err: error }, "Account registration failed");
    res.status(500).json({ message: "Unable to create the account right now." });
  }
});

router.post("/auth/login", async (req, res) => {
  const email = emailAddress(req.body?.email);
  const password = passwordValue(req.body?.password);
  if (!email || !password) {
    res.status(400).json({ message: "Enter a valid email and password." });
    return;
  }

  try {
    const result = await pool.query<{
      id: string;
      email: string;
      password_hash: string;
    }>(
      "SELECT id, email, password_hash FROM planner_users WHERE email = $1",
      [email],
    );
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ message: "Email or password is incorrect." });
      return;
    }
    await startSession(req, user.id);
    res.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    req.log.error({ err: error }, "Sign in failed");
    res.status(500).json({ message: "Unable to sign in right now." });
  }
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Sign in to continue." });
    return;
  }

  try {
    const result = await pool.query<{ id: string; email: string }>(
      "SELECT id, email FROM planner_users WHERE id = $1",
      [req.session.userId],
    );
    const user = result.rows[0];
    if (!user) {
      req.session.destroy(() => undefined);
      res.status(401).json({ message: "Your session has expired. Sign in again." });
      return;
    }
    res.json(user);
  } catch (error) {
    req.log.error({ err: error }, "Current-user lookup failed");
    res.status(500).json({ message: "Unable to load the account right now." });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      req.log.error({ err: error }, "Sign out failed");
      res.status(500).json({ message: "Unable to sign out right now." });
      return;
    }
    res.clearCookie("planner.sid", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.status(204).end();
  });
});

export default router;
