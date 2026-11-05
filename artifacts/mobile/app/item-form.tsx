import React, { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListDeadlinesQueryKey,
  getListEventsQueryKey,
  getListTasksQueryKey,
  useCreateDeadline,
  useCreateEvent,
  useCreateTask,
  useDeleteDeadline,
  useDeleteEvent,
  useDeleteTask,
  useUpdateDeadline,
  useUpdateEvent,
  useUpdateTask,
} from "@workspace/api-client-react";
import type { Category, DeadlineKind } from "@workspace/api-client-react";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { CategoryChip } from "@/components/PlannerUI";
import { useColors } from "@/hooks/useColors";
import { dateToInput, dateTimeInput } from "@/components/PlannerUI";

const categories: Category[] = [
  "School",
  "Clubs",
  "Tutoring",
  "Study",
  "Social",
  "Personal",
];

function localParts(value?: string) {
  if (!value) return { date: dateToInput(new Date()), time: "15:00" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: dateToInput(new Date()), time: "15:00" };
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return { date: dateToInput(parsed), time: `${hours}:${minutes}` };
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
    startsAt?: string;
    endsAt?: string;
    dueAt?: string;
    deadlineKind?: string;
  }>();
  const itemKind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const initialDate = useMemo(
    () => localParts(params.kind === "event" ? params.startsAt : params.dueAt),
    [params.dueAt, params.kind, params.startsAt],
  );
  const [title, setTitle] = useState(params.title ?? "");
  const [date, setDate] = useState(params.date ?? initialDate.date);
  const [time, setTime] = useState(params.time ?? initialDate.time);
  const [endTime, setEndTime] = useState(
    params.endsAt ? localParts(params.endsAt).time : "16:00",
  );
  const [category, setCategory] = useState<Category>(
    categories.includes(params.category as Category)
      ? (params.category as Category)
      : "School",
  );
  const [deadlineKind, setDeadlineKind] = useState<DeadlineKind>(
    params.deadlineKind === "test" ? "test" : "assignment",
  );
  const [notes, setNotes] = useState(params.notes ?? "");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createDeadline = useCreateDeadline();
  const updateDeadline = useUpdateDeadline();
  const deleteDeadline = useDeleteDeadline();
  const isSaving =
    createTask.isPending ||
    updateTask.isPending ||
    createEvent.isPending ||
    updateEvent.isPending ||
    createDeadline.isPending ||
    updateDeadline.isPending;

  const invalidateLists = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() }),
    ]);
  };

  const validate = () => {
    if (!title.trim()) return "Add a title first.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Use a date in YYYY-MM-DD format.";
    if (itemKind !== "deadline" && !/^\d{2}:\d{2}$/.test(time)) {
      return "Use a time in 24-hour format, such as 15:30.";
    }
    if (itemKind === "event" && !/^\d{2}:\d{2}$/.test(endTime)) {
      return "Add a valid end time.";
    }
    if (
      itemKind === "event" &&
      Date.parse(`${date}T${endTime}:00`) <= Date.parse(`${date}T${time}:00`)
    ) {
      return "The end time must be after the start time.";
    }
    return "";
  };

  const save = async () => {
    Keyboard.dismiss();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    try {
      if (itemKind === "task") {
        const data = {
          title: title.trim(),
          date,
          time: time || null,
          category,
          notes: notes.trim() || null,
          ...(params.completed === "true" ? { completed: true } : {}),
        };
        if (id) await updateTask.mutateAsync({ id, data });
        else await createTask.mutateAsync({ data });
      } else if (itemKind === "event") {
        const data = {
          title: title.trim(),
          startsAt: dateTimeInput(date, time),
          endsAt: dateTimeInput(date, endTime),
          category,
          notes: notes.trim() || null,
        };
        if (id) await updateEvent.mutateAsync({ id, data });
        else await createEvent.mutateAsync({ data });
      } else if (itemKind === "deadline") {
        const data = {
          title: title.trim(),
          kind: deadlineKind,
          dueAt: dateTimeInput(date, time),
          notes: notes.trim() || null,
          ...(params.completed === "true" ? { completed: true } : {}),
        };
        if (id) await updateDeadline.mutateAsync({ id, data });
        else await createDeadline.mutateAsync({ data });
      }
      await invalidateLists();
      router.back();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save changes.");
    }
  };

  const remove = () => {
    if (!id) return;
    Alert.alert("Delete this item?", "This cannot be undone.", [
      { text: "Keep it", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (itemKind === "task") await deleteTask.mutateAsync({ id });
            else if (itemKind === "event") await deleteEvent.mutateAsync({ id });
            else await deleteDeadline.mutateAsync({ id });
            await invalidateLists();
            router.back();
          } catch (deleteError) {
            setError(
              deleteError instanceof Error ? deleteError.message : "Unable to delete this item.",
            );
          }
        },
      },
    ]);
  };

  if (itemKind !== "task" && itemKind !== "event" && itemKind !== "deadline") {
    router.back();
    return null;
  }

  const heading =
    itemKind === "task" ? "Task" : itemKind === "event" ? "Event" : "Due date";
  const isEdit = Boolean(id);

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={82}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: colors.spacing.lg, paddingBottom: colors.spacing.xl },
        ]}
      >
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close form"
            testID="close-item-form"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.close, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text
            accessibilityRole="header"
            style={[
              styles.heading,
              { color: colors.foreground, fontFamily: colors.fontFamily.bold },
            ]}
          >
            {isEdit ? `Edit ${heading.toLowerCase()}` : `Add ${heading.toLowerCase()}`}
          </Text>
          <View style={styles.close} />
        </View>

        <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Title</Text>
        <TextInput
          testID="item-title"
          accessibilityLabel="Title"
          autoFocus={!isEdit}
          placeholder={itemKind === "deadline" ? "e.g. History essay" : "What needs a place?"}
          placeholderTextColor={colors.mutedForeground}
          value={title}
          onChangeText={setTitle}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.input,
              color: colors.foreground,
              borderRadius: colors.radius.medium,
              fontFamily: colors.fontFamily.regular,
            },
          ]}
        />

        {itemKind === "deadline" ? (
          <>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Type</Text>
            <View style={styles.pickerRow}>
              {(["assignment", "test"] as DeadlineKind[]).map((kind) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: deadlineKind === kind }}
                  testID={`deadline-kind-${kind}`}
                  key={kind}
                  onPress={() => setDeadlineKind(kind)}
                  style={[
                    styles.choice,
                    {
                      borderColor: deadlineKind === kind ? colors.primary : colors.border,
                      backgroundColor:
                        deadlineKind === kind ? colors.secondary : colors.card,
                      borderRadius: colors.radius.pill,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        deadlineKind === kind
                          ? colors.secondaryForeground
                          : colors.mutedForeground,
                      fontFamily: colors.fontFamily.medium,
                      textTransform: "capitalize",
                    }}
                  >
                    {kind}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>
          {itemKind === "deadline" ? "Due date" : "Date"}
        </Text>
        <TextInput
          testID="item-date"
          accessibilityLabel="Date"
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.mutedForeground}
          value={date}
          onChangeText={setDate}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.input,
              color: colors.foreground,
              borderRadius: colors.radius.medium,
              fontFamily: colors.fontFamily.regular,
            },
          ]}
        />

        <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>
          {itemKind === "event" ? "Start time" : itemKind === "deadline" ? "Due time" : "Time"}
        </Text>
        <TextInput
          testID="item-time"
          accessibilityLabel="Time"
          placeholder="15:30"
          placeholderTextColor={colors.mutedForeground}
          value={time}
          onChangeText={setTime}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.input,
              color: colors.foreground,
              borderRadius: colors.radius.medium,
              fontFamily: colors.fontFamily.regular,
            },
          ]}
        />
        {itemKind === "event" ? (
          <>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>End time</Text>
            <TextInput
              testID="item-end-time"
              accessibilityLabel="End time"
              placeholder="16:30"
              placeholderTextColor={colors.mutedForeground}
              value={endTime}
              onChangeText={setEndTime}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.input,
                  color: colors.foreground,
                  borderRadius: colors.radius.medium,
                  fontFamily: colors.fontFamily.regular,
                },
              ]}
            />
          </>
        ) : null}

        {itemKind !== "deadline" ? (
          <>
            <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((choice) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === choice }}
                  testID={`category-${choice.toLowerCase()}`}
                  key={choice}
                  onPress={() => setCategory(choice)}
                  style={[
                    styles.categoryChoice,
                    {
                      borderColor: category === choice ? colors.primary : colors.border,
                      backgroundColor:
                        category === choice ? colors.secondary : colors.card,
                      borderRadius: colors.radius.pill,
                    },
                  ]}
                >
                  <CategoryChip category={choice} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Notes (optional)</Text>
        <TextInput
          testID="item-notes"
          accessibilityLabel="Notes"
          multiline
          textAlignVertical="top"
          placeholder="Add a little context"
          placeholderTextColor={colors.mutedForeground}
          value={notes}
          onChangeText={setNotes}
          style={[
            styles.notes,
            {
              backgroundColor: colors.card,
              borderColor: colors.input,
              color: colors.foreground,
              borderRadius: colors.radius.medium,
              fontFamily: colors.fontFamily.regular,
            },
          ]}
        />
        {error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          testID="save-item"
          disabled={isSaving}
          onPress={save}
          style={({ pressed }) => [
            styles.save,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius.pill,
              opacity: pressed || isSaving ? 0.7 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: colors.primaryForeground,
              fontFamily: colors.fontFamily.semibold,
              fontSize: colors.typography.body,
            }}
          >
            {isSaving ? "Saving…" : isEdit ? "Save changes" : `Add ${heading.toLowerCase()}`}
          </Text>
        </Pressable>
        {isEdit ? (
          <Pressable
            accessibilityRole="button"
            testID="delete-item"
            onPress={remove}
            style={({ pressed }) => [styles.delete, { opacity: pressed ? 0.65 : 1 }]}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
            <Text
              style={{
                color: colors.destructive,
                fontFamily: colors.fontFamily.semibold,
              }}
            >
              Delete {heading.toLowerCase()}
            </Text>
          </Pressable>
        ) : null}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { gap: 10, paddingTop: 14 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  close: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 21, textAlign: "center", textTransform: "capitalize" },
  label: { fontSize: 13, marginTop: 8 },
  input: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  notes: {
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  pickerRow: { flexDirection: "row", gap: 10 },
  choice: {
    minHeight: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChoice: {
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  error: { fontSize: 13, lineHeight: 18 },
  save: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  delete: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
