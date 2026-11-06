import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const PLANNER_CATEGORIES = [
  "School",
  "Clubs",
  "Tutoring",
  "Study",
  "Social",
  "Personal",
] as const;

export type PlannerCategory = (typeof PLANNER_CATEGORIES)[number];
export type DeadlineKind = "assignment" | "test";

export type PlannerTask = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  category: PlannerCategory;
  notes: string | null;
  completed: boolean;
  createdAt: string;
};

export type PlannerEvent = {
  id: string;
  title: string;
  category: PlannerCategory;
  notes: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type PlannerDeadline = {
  id: string;
  title: string;
  kind: DeadlineKind;
  dueAt: string;
  notes: string | null;
  completed: boolean;
  createdAt: string;
};

export type PlannerBackup = {
  formatVersion: 1;
  exportedAt: string;
  tasks: PlannerTask[];
  events: PlannerEvent[];
  deadlines: PlannerDeadline[];
};

type PlannerState = {
  formatVersion: 1;
  createdAt: string;
  lastExportAt: string | null;
  tasks: PlannerTask[];
  events: PlannerEvent[];
  deadlines: PlannerDeadline[];
};

type ImportMode = "replace" | "merge";

type PlannerContextValue = PlannerState & {
  hydrated: boolean;
  storageError: string | null;
  backupDue: boolean;
  addTask: (task: Omit<PlannerTask, "id" | "completed" | "createdAt">) => void;
  updateTask: (id: string, patch: Partial<Omit<PlannerTask, "id" | "createdAt">>) => void;
  deleteTask: (id: string) => void;
  addEvent: (event: Omit<PlannerEvent, "id" | "createdAt">) => void;
  updateEvent: (id: string, patch: Partial<Omit<PlannerEvent, "id" | "createdAt">>) => void;
  deleteEvent: (id: string) => void;
  addDeadline: (deadline: Omit<PlannerDeadline, "id" | "completed" | "createdAt">) => void;
  updateDeadline: (id: string, patch: Partial<Omit<PlannerDeadline, "id" | "createdAt">>) => void;
  deleteDeadline: (id: string) => void;
  makeBackup: () => PlannerBackup;
  markBackupExported: () => void;
  importBackup: (backup: PlannerBackup, mode: ImportMode) => void;
};

const STORAGE_KEY = "senior-planner-data-v1";
const PERSIST_REQUEST_KEY = "senior-planner-persist-requested";
const BACKUP_INTERVAL = 7 * 24 * 60 * 60 * 1000;
const emptyState: PlannerState = {
  formatVersion: 1,
  createdAt: "",
  lastExportAt: null,
  tasks: [],
  events: [],
  deadlines: [],
};

const PlannerContext = createContext<PlannerContextValue | null>(null);

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCategory(value: unknown): value is PlannerCategory {
  return PLANNER_CATEGORIES.includes(value as PlannerCategory);
}

function isTask(value: unknown): value is PlannerTask {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.date === "string" &&
    (typeof value.time === "string" || value.time === null) &&
    isCategory(value.category) &&
    (typeof value.notes === "string" || value.notes === null) &&
    typeof value.completed === "boolean" &&
    typeof value.createdAt === "string"
  );
}

function isEvent(value: unknown): value is PlannerEvent {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isCategory(value.category) &&
    (typeof value.notes === "string" || value.notes === null) &&
    typeof value.startsAt === "string" &&
    typeof value.endsAt === "string" &&
    typeof value.createdAt === "string"
  );
}

function isDeadline(value: unknown): value is PlannerDeadline {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    (value.kind === "assignment" || value.kind === "test") &&
    typeof value.dueAt === "string" &&
    (typeof value.notes === "string" || value.notes === null) &&
    typeof value.completed === "boolean" &&
    typeof value.createdAt === "string"
  );
}

function isPlannerState(value: unknown): value is PlannerState {
  if (!isObject(value)) return false;
  return (
    value.formatVersion === 1 &&
    typeof value.createdAt === "string" &&
    (typeof value.lastExportAt === "string" || value.lastExportAt === null) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask) &&
    Array.isArray(value.events) &&
    value.events.every(isEvent) &&
    Array.isArray(value.deadlines) &&
    value.deadlines.every(isDeadline)
  );
}

function loadStoredState(): { state: PlannerState; error: string | null } {
  if (typeof window === "undefined") {
    return { state: emptyState, error: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        state: { ...emptyState, createdAt: new Date().toISOString() },
        error: null,
      };
    }
    const value: unknown = JSON.parse(raw);
    if (!isPlannerState(value)) {
      return {
        state: { ...emptyState, createdAt: new Date().toISOString() },
        error: "Saved planner data could not be read. Import a backup to restore it.",
      };
    }
    return { state: value, error: null };
  } catch {
    return {
      state: { ...emptyState, createdAt: new Date().toISOString() },
      error: "Browser storage is unavailable or the saved data is damaged.",
    };
  }
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]) {
  const merged = [...current];
  const knownIds = new Set(current.map((item) => item.id));
  for (const item of incoming) {
    if (!knownIds.has(item.id)) {
      merged.push(item);
      knownIds.add(item.id);
    }
  }
  return merged;
}

async function requestPersistentStorage() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(PERSIST_REQUEST_KEY)) return;
    const storage = navigator.storage;
    if (typeof storage?.persist === "function") {
      await storage.persist();
    }
    window.localStorage.setItem(PERSIST_REQUEST_KEY, "requested");
  } catch {
    // Storage persistence is best-effort and depends on browser support.
  }
}

export function PlannerProvider({ children }: React.PropsWithChildren) {
  const [state, setState] = useState<PlannerState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;
    void (async () => {
      await requestPersistentStorage();
      const loaded = loadStoredState();
      if (active) {
        setState(loaded.state);
        setStorageError(loaded.error);
        setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || storageError || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageError("Changes could not be saved in this browser. Export a backup now.");
    }
  }, [hydrated, state, storageError]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const addTask = useCallback((task: Omit<PlannerTask, "id" | "completed" | "createdAt">) => {
    setStorageError(null);
    setState((current) => ({
      ...current,
      tasks: [...current.tasks, { ...task, id: createId(), completed: false, createdAt: new Date().toISOString() }],
    }));
  }, []);
  const updateTask = useCallback((id: string, patch: Partial<Omit<PlannerTask, "id" | "createdAt">>) => {
    setStorageError(null);
    setState((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, ...patch } : task) }));
  }, []);
  const deleteTask = useCallback((id: string) => {
    setStorageError(null);
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  }, []);
  const addEvent = useCallback((event: Omit<PlannerEvent, "id" | "createdAt">) => {
    setStorageError(null);
    setState((current) => ({
      ...current,
      events: [...current.events, { ...event, id: createId(), createdAt: new Date().toISOString() }],
    }));
  }, []);
  const updateEvent = useCallback((id: string, patch: Partial<Omit<PlannerEvent, "id" | "createdAt">>) => {
    setStorageError(null);
    setState((current) => ({ ...current, events: current.events.map((event) => event.id === id ? { ...event, ...patch } : event) }));
  }, []);
  const deleteEvent = useCallback((id: string) => {
    setStorageError(null);
    setState((current) => ({ ...current, events: current.events.filter((event) => event.id !== id) }));
  }, []);
  const addDeadline = useCallback((deadline: Omit<PlannerDeadline, "id" | "completed" | "createdAt">) => {
    setStorageError(null);
    setState((current) => ({
      ...current,
      deadlines: [...current.deadlines, { ...deadline, id: createId(), completed: false, createdAt: new Date().toISOString() }],
    }));
  }, []);
  const updateDeadline = useCallback((id: string, patch: Partial<Omit<PlannerDeadline, "id" | "createdAt">>) => {
    setStorageError(null);
    setState((current) => ({ ...current, deadlines: current.deadlines.map((deadline) => deadline.id === id ? { ...deadline, ...patch } : deadline) }));
  }, []);
  const deleteDeadline = useCallback((id: string) => {
    setStorageError(null);
    setState((current) => ({ ...current, deadlines: current.deadlines.filter((deadline) => deadline.id !== id) }));
  }, []);

  const makeBackup = useCallback((): PlannerBackup => ({
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    tasks: state.tasks,
    events: state.events,
    deadlines: state.deadlines,
  }), [state.deadlines, state.events, state.tasks]);

  const markBackupExported = useCallback(() => {
    const timestamp = new Date().toISOString();
    setStorageError(null);
    setState((current) => ({ ...current, lastExportAt: timestamp }));
  }, []);

  const importBackup = useCallback((backup: PlannerBackup, mode: ImportMode) => {
    setStorageError(null);
    setState((current) => ({
      ...current,
      tasks: mode === "replace" ? backup.tasks : mergeById(current.tasks, backup.tasks),
      events: mode === "replace" ? backup.events : mergeById(current.events, backup.events),
      deadlines: mode === "replace" ? backup.deadlines : mergeById(current.deadlines, backup.deadlines),
    }));
  }, []);

  const lastBackupAt = state.lastExportAt ?? state.createdAt;
  const backupDue = Boolean(
    hydrated &&
      lastBackupAt &&
      now - new Date(lastBackupAt).getTime() > BACKUP_INTERVAL,
  );

  const value = useMemo<PlannerContextValue>(
    () => ({
      ...state,
      hydrated,
      storageError,
      backupDue,
      addTask,
      updateTask,
      deleteTask,
      addEvent,
      updateEvent,
      deleteEvent,
      addDeadline,
      updateDeadline,
      deleteDeadline,
      makeBackup,
      markBackupExported,
      importBackup,
    }),
    [
      state,
      hydrated,
      storageError,
      backupDue,
      addTask,
      updateTask,
      deleteTask,
      addEvent,
      updateEvent,
      deleteEvent,
      addDeadline,
      updateDeadline,
      deleteDeadline,
      makeBackup,
      markBackupExported,
      importBackup,
    ],
  );

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error("usePlanner must be used within PlannerProvider");
  return context;
}

export function isPlannerBackup(value: unknown): value is PlannerBackup {
  if (!isObject(value)) return false;
  return (
    value.formatVersion === 1 &&
    typeof value.exportedAt === "string" &&
    Array.isArray(value.tasks) &&
    value.tasks.length <= 5000 &&
    value.tasks.every(isTask) &&
    Array.isArray(value.events) &&
    value.events.length <= 5000 &&
    value.events.every(isEvent) &&
    Array.isArray(value.deadlines) &&
    value.deadlines.length <= 5000 &&
    value.deadlines.every(isDeadline)
  );
}
