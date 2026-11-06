import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  PLANNER_CATEGORIES,
  usePlanner,
  type DeadlineKind,
  type PlannerCategory,
} from "@/context/PlannerContext";
import { useColors } from "@/hooks/useColors";
import { IconButton } from "@/components/PlannerUI";

type ItemKind = "task" | "event" | "deadline";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function localDateTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
  };
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export default function ItemFormScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{
    kind?: string;
    id?: string;
    title?: string;
    category?: string;
    notes?: string;
    completed?: string;
    date?: string;
    time?: string;
    endTime?: string;
    startsAt?: string;
    endsAt?: string;
    dueAt?: string;
    deadlineKind?: string;
  }>();
  const planner = usePlanner();
  const kind = first(params.kind) as ItemKind | undefined;
  const id = first(params.id);
  const startTime = localDateTime(first(params.startsAt));
  const dueTime = localDateTime(first(params.dueAt));
  const defaultDate = new Date();
  const defaultDateString = `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, "0")}-${String(defaultDate.getDate()).padStart(2, "0")}`;

  const [title, setTitle] = useState(first(params.title) ?? "");
  const [date, setDate] = useState(first(params.date) ?? startTime?.date ?? dueTime?.date ?? defaultDateString);
  const [time, setTime] = useState(first(params.time) ?? startTime?.time ?? dueTime?.time ?? "15:00");
  const [endTime, setEndTime] = useState(first(params.endTime) ?? localDateTime(first(params.endsAt))?.time ?? "16:00");
  const [category, setCategory] = useState<PlannerCategory>(
    PLANNER_CATEGORIES.includes(first(params.category) as PlannerCategory)
      ? (first(params.category) as PlannerCategory)
      : "School",
  );
  const [notes, setNotes] = useState(first(params.notes) ?? "");
  const [deadlineKind, setDeadlineKind] = useState<DeadlineKind>(
    first(params.deadlineKind) === "test" ? "test" : "assignment",
  );
  const [completed, setCompleted] = useState(first(params.completed) === "true");
  const [error, setError] = useState("");

  const heading = useMemo(() => {
    const label = kind === "task" ? "task" : kind === "event" ? "event" : "due date";
    return `${id ? "Edit" : "Add"} ${label}`;
  }, [id, kind]);

  if (kind !== "task" && kind !== "event" && kind !== "deadline") {
    return (
      <View style={[styles.invalid, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Choose a planner item to edit.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const save = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Add a title before saving.");
      return;
    }
    if (!isValidDate(date)) {
      setError("Enter a valid date in YYYY-MM-DD format.");
      return;
    }
    if (notes.length > 4000) {
      setError("Notes must be 4,000 characters or fewer.");
      return;
    }

    if (kind === "task") {
      const task = {
        title: cleanTitle,
        date,
        time: time.trim() || null,
        category,
        notes: notes.trim() || null,
      };
      if (id) planner.updateTask(id, { ...task, completed });
      else planner.addTask(task);
    } else if (kind === "event") {
      if (!/^\d{2}:\d{2}$/.test(time) || !/^\d{2}:\d{2}$/.test(endTime)) {
        setError("Enter valid start and end times in HH:MM format.");
        return;
      }
      const startsAt = new Date(`${date}T${time}:00`);
      const endsAt = new Date(`${date}T${endTime}:00`);
      if (Number.isNaN(startsAt.getTime()) || endsAt <= startsAt) {
        setError("The end time must be later than the start time.");
        return;
      }
      const event = {
        title: cleanTitle,
        category,
        notes: notes.trim() || null,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      };
      if (id) planner.updateEvent(id, event);
      else planner.addEvent(event);
    } else {
      if (!/^\d{2}:\d{2}$/.test(time)) {
        setError("Enter a valid due time in HH:MM format.");
        return;
      }
      const dueAt = new Date(`${date}T${time}:00`);
      if (Number.isNaN(dueAt.getTime())) {
        setError("Enter a valid due date and time.");
        return;
      }
      const deadline = {
        title: cleanTitle,
        kind: deadlineKind,
        dueAt: dueAt.toISOString(),
        notes: notes.trim() || null,
      };
      if (id) planner.updateDeadline(id, { ...deadline, completed });
      else planner.addDeadline(deadline);
    }
    router.back();
  };

  const confirmDelete = () => {
    const remove = () => {
      if (kind === "task") planner.deleteTask(id!);
      if (kind === "event") planner.deleteEvent(id!);
      if (kind === "deadline") planner.deleteDeadline(id!);
      router.back();
    };
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Delete this planner item?")) remove();
      return;
    }
    Alert.alert("Delete item?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: remove },
    ]);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      color: colors.foreground,
      borderRadius: colors.radius.medium,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <IconButton name="x" accessibilityLabel="Close form" onPress={() => router.back()} />
          <Text style={[styles.heading, { color: colors.foreground, fontFamily: colors.fontFamily.bold }]}>{heading}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Title</Text>
          <TextInput
            accessibilityLabel="Title"
            testID="item-title"
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to remember?"
            placeholderTextColor={colors.mutedForeground}
            maxLength={160}
            style={inputStyle}
          />
        </View>

        {kind === "deadline" ? (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Type</Text>
            <View style={styles.options}>
              {(["assignment", "test"] as DeadlineKind[]).map((option) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: deadlineKind === option }}
                  key={option}
                  onPress={() => setDeadlineKind(option)}
                  style={[
                    styles.option,
                    {
                      backgroundColor: deadlineKind === option ? colors.secondary : colors.card,
                      borderColor: deadlineKind === option ? colors.primary : colors.border,
                      borderRadius: colors.radius.medium,
                    },
                  ]}
                >
                  <Text style={{ color: deadlineKind === option ? colors.secondaryForeground : colors.foreground, fontFamily: colors.fontFamily.medium }}>
                    {option === "test" ? "Test" : "Assignment"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>
            {kind === "deadline" ? "Due date" : "Date"}
          </Text>
          <TextInput
            accessibilityLabel={kind === "deadline" ? "Due date" : "Date"}
            testID="item-date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={inputStyle}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>
            {kind === "deadline" ? "Due time" : kind === "event" ? "Start time" : "Time"}
          </Text>
          <TextInput
            accessibilityLabel={kind === "deadline" ? "Due time" : kind === "event" ? "Start time" : "Time"}
            testID="item-time"
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={inputStyle}
          />
        </View>

        {kind === "event" ? (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>End time</Text>
            <TextInput
              accessibilityLabel="End time"
              testID="item-end-time"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={inputStyle}
            />
          </View>
        ) : null}

        {kind !== "deadline" ? (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Category</Text>
            <View style={styles.categoryWrap}>
              {PLANNER_CATEGORIES.map((option) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: category === option }}
                  key={option}
                  onPress={() => setCategory(option)}
                  style={[
                    styles.category,
                    {
                      backgroundColor: category === option ? colors.secondary : colors.card,
                      borderColor: category === option ? colors.primary : colors.border,
                      borderRadius: colors.radius.pill,
                    },
                  ]}
                >
                  <Text style={{ color: category === option ? colors.secondaryForeground : colors.foreground, fontSize: 12, fontFamily: colors.fontFamily.medium }}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Notes (optional)</Text>
          <TextInput
            accessibilityLabel="Notes"
            testID="item-notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a few details"
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={4000}
            textAlignVertical="top"
            style={[inputStyle, styles.notesInput]}
          />
        </View>

        {id && kind !== "event" ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: completed }}
            testID="item-completed"
            onPress={() => setCompleted((value) => !value)}
            style={styles.completedRow}
          >
            <View style={[styles.checkbox, { borderColor: completed ? colors.primary : colors.border, backgroundColor: completed ? colors.primary : "transparent" }]}>
              {completed ? <Feather name="check" size={13} color={colors.primaryForeground} /> : null}
            </View>
            <Text style={{ color: colors.foreground }}>Mark as complete</Text>
          </Pressable>
        ) : null}

        {error ? (
          <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 12 }}>{error}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          testID="save-item"
          onPress={save}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: colors.primary, borderRadius: colors.radius.medium, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={{ color: colors.primaryForeground, fontFamily: colors.fontFamily.semibold }}>Save</Text>
        </Pressable>

        {id ? (
          <Pressable
            accessibilityRole="button"
            testID="delete-item"
            onPress={confirmDelete}
            style={styles.deleteButton}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text style={{ color: colors.destructive, fontFamily: colors.fontFamily.semibold }}>Delete</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 16, width: "100%", maxWidth: 600, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 2 },
  heading: { fontSize: 22, flex: 1 },
  headerSpacer: { width: 40 },
  field: { gap: 7 },
  label: { fontSize: 13 },
  input: { minHeight: 48, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10, fontSize: 14 },
  notesInput: { minHeight: 100, paddingTop: 12 },
  options: { flexDirection: "row", gap: 8 },
  option: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  category: { minHeight: 35, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  completedRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  saveButton: { minHeight: 50, alignItems: "center", justifyContent: "center", marginTop: 4 },
  deleteButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  invalid: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  backButton: { minHeight: 40, justifyContent: "center" },
});
