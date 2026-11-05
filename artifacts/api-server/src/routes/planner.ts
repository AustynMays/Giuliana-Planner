import { Router, type IRouter } from "express";
import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../lib/database";

const router: IRouter = Router();
const categories = [
  "School",
  "Clubs",
  "Tutoring",
  "Study",
  "Social",
  "Personal",
] as const;
type Category = (typeof categories)[number];
type Item = Record<string, unknown>;

type TaskRow = QueryResultRow & {
  id: string;
  title: string;
  date: string;
  time: string | null;
  category: Category;
  notes: string | null;
  completed: boolean;
  createdAt: Date;
};
type EventRow = QueryResultRow & {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  category: Category;
  notes: string | null;
  createdAt: Date;
};
type DeadlineRow = QueryResultRow & {
  id: string;
  title: string;
  kind: "assignment" | "test";
  dueAt: Date;
  notes: string | null;
  completed: boolean;
  createdAt: Date;
};

function item(value: unknown): Item | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Item)
    : null;
}

function requiredText(value: unknown, max = 180): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= max ? text : null;
}

function optionalText(value: unknown, max = 4000): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > max) return undefined;
  return value.trim() || null;
}

function validCategory(value: unknown): value is Category {
  return typeof value === "string" && categories.includes(value as Category);
}

function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
  );
}

function validDateTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    !Number.isNaN(Date.parse(value)) &&
    value.length <= 40
  );
}

function taskFields(body: Item) {
  const title = requiredText(body.title);
  const date = body.date;
  const category = body.category;
  const time = optionalText(body.time, 5);
  const notes = optionalText(body.notes);
  if (
    !title ||
    !validDate(date) ||
    !validCategory(category) ||
    time === undefined ||
    (time !== null && !/^\d{2}:\d{2}$/.test(time)) ||
    notes === undefined ||
    (body.completed !== undefined && typeof body.completed !== "boolean")
  ) {
    return null;
  }
  return {
    title,
    date,
    time,
    category,
    notes,
    ...(body.completed === undefined ? {} : { completed: body.completed }),
  };
}

function eventFields(body: Item) {
  const title = requiredText(body.title);
  const startsAt = body.startsAt;
  const endsAt = body.endsAt;
  const category = body.category;
  const notes = optionalText(body.notes);
  if (
    !title ||
    !validDateTime(startsAt) ||
    !validDateTime(endsAt) ||
    Date.parse(endsAt) <= Date.parse(startsAt) ||
    !validCategory(category) ||
    notes === undefined
  ) {
    return null;
  }
  return {
    title,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
    category,
    notes,
  };
}

function deadlineFields(body: Item) {
  const title = requiredText(body.title);
  const kind = body.kind;
  const dueAt = body.dueAt;
  const notes = optionalText(body.notes);
  if (
    !title ||
    (kind !== "assignment" && kind !== "test") ||
    !validDateTime(dueAt) ||
    notes === undefined ||
    (body.completed !== undefined && typeof body.completed !== "boolean")
  ) {
    return null;
  }
  return {
    title,
    kind,
    dueAt: new Date(dueAt).toISOString(),
    notes,
    ...(body.completed === undefined ? {} : { completed: body.completed }),
  };
}

router.use((req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ message: "Sign in to continue." });
    return;
  }
  next();
});

router.get("/tasks", async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  if (!validDate(from) || !validDate(to) || from > to) {
    res.status(400).json({ message: "Choose a valid task date range." });
    return;
  }
  const result = await pool.query<TaskRow>(
    `SELECT id, title, date::text AS date,
            to_char(time, 'HH24:MI') AS time, category, notes, completed,
            created_at AS "createdAt"
       FROM planner_tasks
      WHERE user_id = $1 AND date >= $2 AND date <= $3
      ORDER BY date ASC, time ASC NULLS LAST, created_at ASC`,
    [req.session.userId, from, to],
  );
  res.json(result.rows);
});

router.post("/tasks", async (req, res) => {
  const body = item(req.body);
  const fields = body && taskFields(body);
  if (!fields) {
    res.status(400).json({ message: "Add a title, date, and valid category." });
    return;
  }
  const result = await pool.query<TaskRow>(
    `INSERT INTO planner_tasks
       (user_id, title, date, time, category, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, date::text AS date,
       to_char(time, 'HH24:MI') AS time, category, notes, completed,
       created_at AS "createdAt"`,
    [
      req.session.userId,
      fields.title,
      fields.date,
      fields.time,
      fields.category,
      fields.notes,
    ],
  );
  res.status(201).json(result.rows[0]);
});

router.patch("/tasks/:id", async (req, res) => {
  const body = item(req.body);
  if (!body) {
    res.status(400).json({ message: "Provide task changes." });
    return;
  }
  const taskPatchFields = {
    title: "title",
    date: "date",
    time: "time",
    category: "category",
    notes: "notes",
    completed: "completed",
  } as const;
  const values: unknown[] = [req.session.userId, req.params.id];
  const updates: string[] = [];
  for (const [key, column] of Object.entries(taskPatchFields)) {
    if (!Object.hasOwn(body, key)) continue;
    const value = body[key];
    if (key === "title") {
      const parsed = requiredText(value);
      if (!parsed) {
        res.status(400).json({ message: "Enter a task title." });
        return;
      }
      values.push(parsed);
    } else if (key === "date") {
      if (!validDate(value)) {
        res.status(400).json({ message: "Enter a valid task date." });
        return;
      }
      values.push(value);
    } else if (key === "category") {
      if (!validCategory(value)) {
        res.status(400).json({ message: "Choose a valid category." });
        return;
      }
      values.push(value);
    } else if (key === "time") {
      const parsed = optionalText(value, 5);
      if (parsed === undefined || (parsed !== null && !/^\d{2}:\d{2}$/.test(parsed))) {
        res.status(400).json({ message: "Enter a valid task time." });
        return;
      }
      values.push(parsed);
    } else if (key === "notes") {
      const parsed = optionalText(value);
      if (parsed === undefined) {
        res.status(400).json({ message: "Notes are too long." });
        return;
      }
      values.push(parsed);
    } else {
      if (typeof value !== "boolean") {
        res.status(400).json({ message: "Choose a valid task status." });
        return;
      }
      values.push(value);
    }
    updates.push(`${column} = $${values.length}`);
  }
  if (updates.length === 0) {
    res.status(400).json({ message: "Provide at least one task change." });
    return;
  }
  const result = await pool.query<TaskRow>(
    `UPDATE planner_tasks SET ${updates.join(", ")}
      WHERE user_id = $1 AND id = $2
      RETURNING id, title, date::text AS date,
        to_char(time, 'HH24:MI') AS time, category, notes, completed,
        created_at AS "createdAt"`,
    values,
  );
  if (!result.rows[0]) {
    res.status(404).json({ message: "Task not found." });
    return;
  }
   res.json(result.rows[0]);
});

router.delete("/tasks/:id", async (req, res) => {
  const result = await pool.query(
    "DELETE FROM planner_tasks WHERE user_id = $1 AND id = $2",
    [req.session.userId, req.params.id],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Task not found." });
    return;
  }
  res.status(204).end();
});

router.get("/events", async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  if (!validDateTime(from) || !validDateTime(to) || Date.parse(from) >= Date.parse(to)) {
    res.status(400).json({ message: "Choose a valid event date range." });
    return;
  }
  const result = await pool.query<EventRow>(
    `SELECT id, title, starts_at AS "startsAt", ends_at AS "endsAt",
            category, notes, created_at AS "createdAt"
       FROM planner_events
      WHERE user_id = $1 AND starts_at < $3 AND ends_at > $2
      ORDER BY starts_at ASC`,
    [req.session.userId, from, to],
  );
  res.json(result.rows);
});

router.post("/events", async (req, res) => {
  const body = item(req.body);
  const fields = body && eventFields(body);
  if (!fields) {
    res.status(400).json({ message: "Add a title, valid times, and category." });
    return;
  }
  const result = await pool.query<EventRow>(
    `INSERT INTO planner_events (user_id, title, starts_at, ends_at, category, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, title, starts_at AS "startsAt", ends_at AS "endsAt",
       category, notes, created_at AS "createdAt"`,
    [
      req.session.userId,
      fields.title,
      fields.startsAt,
      fields.endsAt,
      fields.category,
      fields.notes,
    ],
  );
  res.status(201).json(result.rows[0]);
});

router.patch("/events/:id", async (req, res) => {
  const body = item(req.body);
  if (!body) {
    res.status(400).json({ message: "Provide event changes." });
    return;
  }
  const existing = await pool.query<EventRow>(
    `SELECT id, title, starts_at AS "startsAt", ends_at AS "endsAt",
            category, notes, created_at AS "createdAt"
       FROM planner_events WHERE user_id = $1 AND id = $2`,
    [req.session.userId, req.params.id],
  );
  const current = existing.rows[0];
  if (!current) {
    res.status(404).json({ message: "Event not found." });
    return;
  }
  const merged = eventFields({
    title: body.title ?? current.title,
    startsAt: body.startsAt ?? current.startsAt.toISOString(),
    endsAt: body.endsAt ?? current.endsAt.toISOString(),
    category: body.category ?? current.category,
    notes: Object.hasOwn(body, "notes") ? body.notes : current.notes,
  });
  if (!merged) {
    res.status(400).json({ message: "Event changes must include valid times and category." });
    return;
  }
  const result = await pool.query<EventRow>(
    `UPDATE planner_events
        SET title = $3, starts_at = $4, ends_at = $5, category = $6, notes = $7
      WHERE user_id = $1 AND id = $2
      RETURNING id, title, starts_at AS "startsAt", ends_at AS "endsAt",
        category, notes, created_at AS "createdAt"`,
    [
      req.session.userId,
      req.params.id,
      merged.title,
      merged.startsAt,
      merged.endsAt,
      merged.category,
      merged.notes,
    ],
  );
  res.json(result.rows[0]);
});

router.delete("/events/:id", async (req, res) => {
  const result = await pool.query(
    "DELETE FROM planner_events WHERE user_id = $1 AND id = $2",
    [req.session.userId, req.params.id],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Event not found." });
    return;
  }
  res.status(204).end();
});

router.get("/deadlines", async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  if (!validDateTime(from) || !validDateTime(to) || Date.parse(from) >= Date.parse(to)) {
    res.status(400).json({ message: "Choose a valid due-date range." });
    return;
  }
  const result = await pool.query<DeadlineRow>(
    `SELECT id, title, kind, due_at AS "dueAt", notes, completed,
            created_at AS "createdAt"
       FROM planner_deadlines
      WHERE user_id = $1 AND due_at >= $2 AND due_at < $3
      ORDER BY completed ASC, due_at ASC`,
    [req.session.userId, from, to],
  );
  res.json(result.rows);
});

router.post("/deadlines", async (req, res) => {
  const body = item(req.body);
  const fields = body && deadlineFields(body);
  if (!fields) {
    res.status(400).json({ message: "Add a title, due date, and type." });
    return;
  }
  const result = await pool.query<DeadlineRow>(
    `INSERT INTO planner_deadlines (user_id, title, kind, due_at, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, kind, due_at AS "dueAt", notes, completed,
       created_at AS "createdAt"`,
    [req.session.userId, fields.title, fields.kind, fields.dueAt, fields.notes],
  );
  res.status(201).json(result.rows[0]);
});

router.patch("/deadlines/:id", async (req, res) => {
  const body = item(req.body);
  if (!body) {
    res.status(400).json({ message: "Provide due-date changes." });
    return;
  }
  const deadlinePatchFields = {
    title: "title",
    kind: "kind",
    dueAt: "due_at",
    notes: "notes",
    completed: "completed",
  } as const;
  const values: unknown[] = [req.session.userId, req.params.id];
  const updates: string[] = [];
  for (const [key, column] of Object.entries(deadlinePatchFields)) {
    if (!Object.hasOwn(body, key)) continue;
    const value = body[key];
    if (key === "title") {
      const parsed = requiredText(value);
      if (!parsed) {
        res.status(400).json({ message: "Enter a title." });
        return;
      }
      values.push(parsed);
    } else if (key === "kind") {
      if (value !== "assignment" && value !== "test") {
        res.status(400).json({ message: "Choose assignment or test." });
        return;
      }
      values.push(value);
    } else if (key === "dueAt") {
      if (!validDateTime(value)) {
        res.status(400).json({ message: "Enter a valid due date." });
        return;
      }
      values.push(new Date(value).toISOString());
    } else if (key === "notes") {
      const parsed = optionalText(value);
      if (parsed === undefined) {
        res.status(400).json({ message: "Notes are too long." });
        return;
      }
      values.push(parsed);
    } else {
      if (typeof value !== "boolean") {
        res.status(400).json({ message: "Choose a valid status." });
        return;
      }
      values.push(value);
    }
    updates.push(`${column} = $${values.length}`);
  }
  if (updates.length === 0) {
    res.status(400).json({ message: "Provide at least one change." });
    return;
  }
  const result = await pool.query<DeadlineRow>(
    `UPDATE planner_deadlines SET ${updates.join(", ")}
      WHERE user_id = $1 AND id = $2
      RETURNING id, title, kind, due_at AS "dueAt", notes, completed,
        created_at AS "createdAt"`,
    values,
  );
  if (!result.rows[0]) {
    res.status(404).json({ message: "Due date not found." });
    return;
  }
  res.json(result.rows[0]);
});

router.delete("/deadlines/:id", async (req, res) => {
  const result = await pool.query(
    "DELETE FROM planner_deadlines WHERE user_id = $1 AND id = $2",
    [req.session.userId, req.params.id],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Due date not found." });
    return;
  }
  res.status(204).end();
});

router.get("/summary/weekly", async (req, res) => {
  const weekStart = req.query.weekStart;
  if (!validDateTime(weekStart)) {
    res.status(400).json({ message: "Choose a valid week start date." });
    return;
  }
  const start = new Date(weekStart);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const totals = await pool.query<{ category: Category; minutes: number }>(
    `SELECT category,
            SUM(EXTRACT(EPOCH FROM
              (LEAST(ends_at, $3::timestamptz) - GREATEST(starts_at, $2::timestamptz))
            ) / 60)::int AS minutes
       FROM planner_events
      WHERE user_id = $1 AND starts_at < $3 AND ends_at > $2
      GROUP BY category`,
    [req.session.userId, start.toISOString(), end.toISOString()],
  );
  const byCategory = new Map(
    totals.rows.map((entry) => [entry.category, Number(entry.minutes)]),
  );
  const totalMinutes = Array.from(byCategory.values()).reduce(
    (sum, minutes) => sum + minutes,
    0,
  );
  res.json({
    weekStart: start.toISOString(),
    totalMinutes,
    categories: categories.map((category) => {
      const minutes = byCategory.get(category) ?? 0;
      return {
        category,
        minutes,
        percent: totalMinutes ? Math.round((minutes / totalMinutes) * 100) : 0,
      };
    }),
  });
});

router.get("/data/export", async (req, res) => {
  const userId = req.session.userId;
  const [tasks, events, deadlines] = await Promise.all([
    pool.query<TaskRow>(
      `SELECT id, title, date::text AS date,
              to_char(time, 'HH24:MI') AS time, category, notes, completed,
              created_at AS "createdAt"
         FROM planner_tasks WHERE user_id = $1
        ORDER BY date, time NULLS LAST`,
      [userId],
    ),
    pool.query<EventRow>(
      `SELECT id, title, starts_at AS "startsAt", ends_at AS "endsAt",
              category, notes, created_at AS "createdAt"
         FROM planner_events WHERE user_id = $1 ORDER BY starts_at`,
      [userId],
    ),
    pool.query<DeadlineRow>(
      `SELECT id, title, kind, due_at AS "dueAt", notes, completed,
              created_at AS "createdAt"
         FROM planner_deadlines WHERE user_id = $1 ORDER BY due_at`,
      [userId],
    ),
  ]);
  res.json({
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    tasks: tasks.rows,
    events: events.rows,
    deadlines: deadlines.rows,
  });
});

async function insertBackupRows(
  client: PoolClient,
  userId: string,
  backup: { tasks: Item[]; events: Item[]; deadlines: Item[] },
) {
  for (const source of backup.tasks) {
    const fields = taskFields(source);
    if (!fields) throw new Error("Backup contains an invalid task.");
    const completed = typeof source.completed === "boolean" ? source.completed : false;
    await client.query(
      `INSERT INTO planner_tasks
         (user_id, title, date, time, category, notes, completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        fields.title,
        fields.date,
        fields.time,
        fields.category,
        fields.notes,
        completed,
      ],
    );
  }
  for (const source of backup.events) {
    const fields = eventFields(source);
    if (!fields) throw new Error("Backup contains an invalid event.");
    await client.query(
      `INSERT INTO planner_events
         (user_id, title, starts_at, ends_at, category, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        fields.title,
        fields.startsAt,
        fields.endsAt,
        fields.category,
        fields.notes,
      ],
    );
  }
  for (const source of backup.deadlines) {
    const fields = deadlineFields(source);
    if (!fields) throw new Error("Backup contains an invalid assignment or test.");
    await client.query(
      `INSERT INTO planner_deadlines
         (user_id, title, kind, due_at, notes, completed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        fields.title,
        fields.kind,
        fields.dueAt,
        fields.notes,
        fields.completed ?? false,
      ],
    );
  }
}

router.post("/data/import", async (req, res) => {
  const backup = item(req.body);
  if (
    !backup ||
    backup.formatVersion !== 1 ||
    !Array.isArray(backup.tasks) ||
    !Array.isArray(backup.events) ||
    !Array.isArray(backup.deadlines) ||
    backup.tasks.length + backup.events.length + backup.deadlines.length > 5000
  ) {
    res.status(400).json({ message: "Choose a valid Senior Planner backup file." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM planner_tasks WHERE user_id = $1", [
      req.session.userId,
    ]);
    await client.query("DELETE FROM planner_events WHERE user_id = $1", [
      req.session.userId,
    ]);
    await client.query("DELETE FROM planner_deadlines WHERE user_id = $1", [
      req.session.userId,
    ]);
    await insertBackupRows(client, req.session.userId!, {
      tasks: backup.tasks as Item[],
      events: backup.events as Item[],
      deadlines: backup.deadlines as Item[],
    });
    await client.query("COMMIT");
    res.json({
      imported: backup.tasks.length + backup.events.length + backup.deadlines.length,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    const message =
      error instanceof Error ? error.message : "The backup could not be imported.";
    res.status(400).json({ message });
  } finally {
    client.release();
  }
});

export default router;
