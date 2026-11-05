CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS planner_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(254) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES planner_users(id) ON DELETE CASCADE,
  title varchar(180) NOT NULL,
  date date NOT NULL,
  time time,
  category varchar(16) NOT NULL CHECK (
    category IN ('School', 'Clubs', 'Tutoring', 'Study', 'Social', 'Personal')
  ),
  notes text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS planner_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES planner_users(id) ON DELETE CASCADE,
  title varchar(180) NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  category varchar(16) NOT NULL CHECK (
    category IN ('School', 'Clubs', 'Tutoring', 'Study', 'Social', 'Personal')
  ),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT planner_events_valid_range CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS planner_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES planner_users(id) ON DELETE CASCADE,
  title varchar(180) NOT NULL,
  kind varchar(12) NOT NULL CHECK (kind IN ('assignment', 'test')),
  due_at timestamptz NOT NULL,
  notes text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS planner_tasks_user_date_idx
  ON planner_tasks (user_id, date, time);
CREATE INDEX IF NOT EXISTS planner_events_user_start_idx
  ON planner_events (user_id, starts_at);
CREATE INDEX IF NOT EXISTS planner_deadlines_user_due_idx
  ON planner_deadlines (user_id, completed, due_at);

CREATE TABLE IF NOT EXISTS planner_sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS planner_sessions_expire_idx
  ON planner_sessions (expire);
