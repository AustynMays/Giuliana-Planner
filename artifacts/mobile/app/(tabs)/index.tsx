import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListTasksQueryKey,
  useListEvents,
  useListTasks,
  useUpdateTask,
} from "@workspace/api-client-react";
import type { Task } from "@workspace/api-client-react";
import {
  CategoryChip,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  PageHeader,
  PlannerPage,
  SectionHeading,
  SmallButton,
  Surface,
  categoryColorFor,
  dateToInput,
  formatClock,
  formatLongDate,
} from "@/components/PlannerUI";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function openForm(params: Record<string, string>) {
  router.push({ pathname: "/item-form", params } as never);
}

export default function TodayScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateKey = dateToInput(selectedDate);
  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const eventQuery = useListEvents(
    {
      from: new Date(`${dateKey}T00:00:00`).toISOString(),
      to: new Date(`${dateToInput(nextDay)}T00:00:00`).toISOString(),
    },
    { query: { enabled: !!user } },
  );
  const taskQuery = useListTasks(
    { from: dateKey, to: dateKey },
    { query: { enabled: !!user } },
  );
  const updateTask = useUpdateTask();
  const events = eventQuery.data ?? [];
  const tasks = taskQuery.data ?? [];
  const completed = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);
  const refreshing = eventQuery.isFetching || taskQuery.isFetching;

  const refresh = () => {
    void Promise.all([eventQuery.refetch(), taskQuery.refetch()]);
  };

  const toggleTask = async (task: Task) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          title: task.title,
          date: task.date,
          time: task.time ?? null,
          category: task.category,
          notes: task.notes ?? null,
          completed: !task.completed,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    } catch (error) {
      Alert.alert(
        "Could not update task",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  };

  if (eventQuery.isLoading || taskQuery.isLoading) {
    return <PlannerPage><PageHeader title="Today" /><LoadingState /></PlannerPage>;
  }
  if (eventQuery.isError || taskQuery.isError) {
    const query = eventQuery.isError ? eventQuery : taskQuery;
    return (
      <PlannerPage>
        <PageHeader title="Today" />
        <ErrorState message={query.error instanceof Error ? query.error.message : "Could not load your day."} onRetry={refresh} />
      </PlannerPage>
    );
  }

  return (
    <PlannerPage
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
    >
      <PageHeader
        title="Today"
        subtitle={formatLongDate(selectedDate)}
        right={
          <IconButton
            name="settings"
            accessibilityLabel="Open settings"
            testID="open-settings"
            onPress={() => router.push("/(tabs)/settings" as never)}
          />
        }
      />

      <Surface style={styles.dateSurface}>
        <View style={styles.dateBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            testID="previous-day"
            onPress={() => setSelectedDate((value) => new Date(value.getFullYear(), value.getMonth(), value.getDate() - 1))}
            style={styles.dateArrow}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.dateLabel}>
            <Text style={[styles.dateNumber, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>
              {selectedDate.toLocaleDateString([], { month: "short", day: "numeric" })}
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: colors.typography.small }}>
              {completed} of {tasks.length} tasks done
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next day"
            testID="next-day"
            onPress={() => setSelectedDate((value) => new Date(value.getFullYear(), value.getMonth(), value.getDate() + 1))}
            style={styles.dateArrow}
          >
            <Feather name="chevron-right" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.addRow}>
          <SmallButton
            label="Add task"
            icon="check-square"
            testID="add-task"
            onPress={() => openForm({ kind: "task", date: dateKey })}
          />
          <SmallButton
            label="Add event"
            icon="plus"
            secondary
            testID="add-event"
            onPress={() =>
              openForm({
                kind: "event",
                date: dateKey,
                time: "15:00",
                endTime: "16:00",
              })
            }
          />
        </View>
      </Surface>

      <View style={styles.sectionBlock}>
        <SectionHeading title="Schedule" trailing={<Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{events.length} planned</Text>} />
        {events.length === 0 ? (
          <Surface>
            <EmptyState
              icon="calendar"
              title="A little open space"
              description="Add an event when something needs a place in your day."
              action={
                <SmallButton
                  label="Add event"
                  icon="plus"
                  onPress={() => openForm({ kind: "event", date: dateKey, time: "15:00", endTime: "16:00" })}
                />
              }
            />
          </Surface>
        ) : (
          <View style={styles.list}>
            {events.map((event) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${event.title}`}
                testID={`event-${event.id}`}
                key={event.id}
                onPress={() =>
                  openForm({
                    kind: "event",
                    id: event.id,
                    title: event.title,
                    category: event.category,
                    notes: event.notes ?? "",
                    startsAt: event.startsAt,
                    endsAt: event.endsAt,
                  })
                }
                style={({ pressed }) => [
                  styles.eventCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius.medium,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <View style={[styles.eventLine, { backgroundColor: categoryColorFor(event.category, colors) }]} />
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTime, { color: colors.primary, fontFamily: colors.fontFamily.semibold }]}>
                    {formatClock(event.startsAt)} – {formatClock(event.endsAt)}
                  </Text>
                  <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>
                    {event.title}
                  </Text>
                  <CategoryChip category={event.category} />
                  {event.notes ? (
                    <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 12 }}>
                      {event.notes}
                    </Text>
                  ) : null}
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.sectionBlock}>
        <SectionHeading
          title="To-do"
          trailing={
            tasks.length > 0 ? (
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
                {tasks.length - completed} left
              </Text>
            ) : null
          }
        />
        {tasks.length === 0 ? (
          <Surface>
            <EmptyState
              icon="check-square"
              title="Nothing on the list"
              description="Capture a task here so it doesn't have to stay in your head."
              action={
                <SmallButton
                  label="Add task"
                  icon="plus"
                  onPress={() => openForm({ kind: "task", date: dateKey })}
                />
              }
            />
          </Surface>
        ) : (
          <Surface style={styles.taskList}>
            {tasks.map((task, index) => (
              <View
                key={task.id}
                style={[
                  styles.taskRow,
                  index < tasks.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.completed }}
                  accessibilityLabel={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
                  testID={`toggle-task-${task.id}`}
                  onPress={() => void toggleTask(task)}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: task.completed ? colors.primary : colors.border,
                      backgroundColor: task.completed ? colors.primary : "transparent",
                    },
                  ]}
                >
                  {task.completed ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${task.title}`}
                  testID={`edit-task-${task.id}`}
                  onPress={() =>
                    openForm({
                      kind: "task",
                      id: task.id,
                      title: task.title,
                      category: task.category,
                      notes: task.notes ?? "",
                      completed: String(task.completed),
                      date: task.date,
                      time: task.time ?? "",
                    })
                  }
                  style={styles.taskTextWrap}
                >
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: task.completed ? colors.mutedForeground : colors.foreground,
                        fontFamily: task.completed ? colors.fontFamily.regular : colors.fontFamily.medium,
                        textDecorationLine: task.completed ? "line-through" : "none",
                      },
                    ]}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    {task.time ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{task.time}</Text> : null}
                    <CategoryChip category={task.category} />
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${task.title}`}
                  onPress={() =>
                    openForm({
                      kind: "task",
                      id: task.id,
                      title: task.title,
                      category: task.category,
                      notes: task.notes ?? "",
                      completed: String(task.completed),
                      date: task.date,
                      time: task.time ?? "",
                    })
                  }
                  style={styles.editTask}
                >
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </Surface>
        )}
      </View>
    </PlannerPage>
  );
}

const styles = StyleSheet.create({
  dateSurface: { gap: 14 },
  dateBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateArrow: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  dateLabel: { alignItems: "center", gap: 2 },
  dateNumber: { fontSize: 18 },
  addRow: { flexDirection: "row", gap: 9 },
  sectionBlock: { gap: 10 },
  list: { gap: 9 },
  eventCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    padding: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eventLine: { width: 3, borderRadius: 3 },
  eventContent: { flex: 1, gap: 6, alignItems: "flex-start" },
  eventTime: { fontSize: 12 },
  eventTitle: { fontSize: 15 },
  taskList: { paddingVertical: 0, paddingHorizontal: 14 },
  taskRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 11 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  taskTextWrap: { flex: 1, gap: 7, paddingVertical: 12 },
  taskTitle: { fontSize: 14, lineHeight: 19 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  editTask: { width: 38, height: 42, alignItems: "center", justifyContent: "center" },
});
