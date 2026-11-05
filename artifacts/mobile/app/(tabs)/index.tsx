import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  CategoryChip,
  EmptyState,
  IconButton,
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
import { usePlanner } from "@/context/PlannerContext";
import { useColors } from "@/hooks/useColors";

function openForm(params: Record<string, string>) {
  router.push({ pathname: "/item-form", params } as never);
}

export default function TodayScreen() {
  const colors = useColors();
  const planner = usePlanner();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dateKey = dateToInput(selectedDate);
  const tasks = useMemo(
    () =>
      planner.tasks
        .filter((task) => task.date === dateKey)
        .sort((a, b) => Number(a.completed) - Number(b.completed) || (a.time ?? "").localeCompare(b.time ?? "")),
    [dateKey, planner.tasks],
  );
  const events = useMemo(
    () =>
      planner.events
        .filter((event) => dateToInput(new Date(event.startsAt)) === dateKey)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [dateKey, planner.events],
  );
  const completed = tasks.filter((task) => task.completed).length;

  const moveDate = (delta: number) =>
    setSelectedDate((value) => new Date(value.getFullYear(), value.getMonth(), value.getDate() + delta));

  return (
    <PlannerPage>
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

      {planner.backupDue ? (
        <Pressable
          accessibilityRole="button"
          testID="backup-reminder"
          onPress={() => router.push("/(tabs)/settings" as never)}
          style={[
            styles.reminder,
            { backgroundColor: colors.secondary, borderRadius: colors.radius.medium },
          ]}
        >
          <Feather name="download-cloud" size={17} color={colors.primary} />
          <Text style={[styles.reminderText, { color: colors.secondaryForeground, fontFamily: colors.fontFamily.medium }]}>
            It’s been over a week since your last backup.
          </Text>
          <Feather name="chevron-right" size={17} color={colors.primary} />
        </Pressable>
      ) : null}

      {planner.storageError ? (
        <Surface style={styles.storageWarning}>
          <Feather name="alert-circle" size={17} color={colors.destructive} />
          <Text style={{ color: colors.foreground, flex: 1, fontSize: 12, lineHeight: 18 }}>
            {planner.storageError}
          </Text>
        </Surface>
      ) : null}

      <Surface style={styles.dateSurface}>
        <View style={styles.dateBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            testID="previous-day"
            onPress={() => moveDate(-1)}
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
            onPress={() => moveDate(1)}
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
              openForm({ kind: "event", date: dateKey, time: "15:00", endTime: "16:00" })
            }
          />
        </View>
      </Surface>

      <View style={styles.sectionBlock}>
        <SectionHeading
          title="Schedule"
          trailing={<Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{events.length} planned</Text>}
        />
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
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{tasks.length - completed} left</Text>
            ) : null
          }
        />
        {tasks.length === 0 ? (
          <Surface>
            <EmptyState
              icon="check-square"
              title="Nothing on the list"
              description="Capture a task here so it doesn't have to stay in your head."
              action={<SmallButton label="Add task" icon="plus" onPress={() => openForm({ kind: "task", date: dateKey })} />}
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
                  onPress={() => planner.updateTask(task.id, { completed: !task.completed })}
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
  reminder: { minHeight: 48, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  reminderText: { flex: 1, fontSize: 12 },
  storageWarning: { flexDirection: "row", alignItems: "center", gap: 10 },
  dateSurface: { gap: 14 },
  dateBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dateArrow: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  dateLabel: { alignItems: "center", gap: 2 },
  dateNumber: { fontSize: 18 },
  addRow: { flexDirection: "row", gap: 9 },
  sectionBlock: { gap: 10 },
  list: { gap: 9 },
  eventCard: { flexDirection: "row", alignItems: "stretch", gap: 12, padding: 13, borderWidth: StyleSheet.hairlineWidth },
  eventLine: { width: 3, borderRadius: 3 },
  eventContent: { flex: 1, gap: 6, alignItems: "flex-start" },
  eventTime: { fontSize: 12 },
  eventTitle: { fontSize: 15 },
  taskList: { paddingVertical: 0, paddingHorizontal: 14 },
  taskRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 11 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  taskTextWrap: { flex: 1, gap: 7, paddingVertical: 12 },
  taskTitle: { fontSize: 14, lineHeight: 19 },
  taskMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  editTask: { width: 38, height: 42, alignItems: "center", justifyContent: "center" },
});
