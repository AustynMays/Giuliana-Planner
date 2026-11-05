import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  EmptyState,
  PageHeader,
  PlannerPage,
  SectionHeading,
  SmallButton,
  Surface,
  dateToInput,
  formatClock,
} from "@/components/PlannerUI";
import { usePlanner, type PlannerDeadline } from "@/context/PlannerContext";
import { useColors } from "@/hooks/useColors";

function openDeadline(item?: PlannerDeadline) {
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 3);
  const due = item ? new Date(item.dueAt) : defaultDue;
  const params: Record<string, string> = {
    kind: "deadline",
    date: dateToInput(due),
    time: `${String(due.getHours()).padStart(2, "0")}:${String(due.getMinutes()).padStart(2, "0")}`,
    deadlineKind: item?.kind ?? "assignment",
  };
  if (item) {
    Object.assign(params, {
      id: item.id,
      title: item.title,
      dueAt: item.dueAt,
      notes: item.notes ?? "",
      completed: String(item.completed),
    });
  }
  router.push({ pathname: "/item-form", params } as never);
}

function dueLabel(value: string) {
  const date = new Date(value);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"}`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due ${date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}`;
}

export default function DueScreen() {
  const colors = useColors();
  const { deadlines, updateDeadline } = usePlanner();
  const items = useMemo(
    () => [...deadlines].sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueAt.localeCompare(b.dueAt)),
    [deadlines],
  );
  const remaining = items.filter((item) => !item.completed).length;

  return (
    <PlannerPage>
      <PageHeader title="Coming up" subtitle="Assignments and tests, in due-date order." />
      <Surface style={styles.summary}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="book-open" size={19} color={colors.primary} />
        </View>
        <View style={styles.summaryText}>
          <Text style={[styles.count, { color: colors.foreground, fontFamily: colors.fontFamily.bold }]}>{remaining}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>still to do</Text>
        </View>
        <SmallButton label="Add due date" icon="plus" testID="add-deadline" onPress={() => openDeadline()} />
      </Surface>
      <View style={styles.sectionBlock}>
        <SectionHeading title="Your list" trailing={<Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{items.length} total</Text>} />
        {items.length === 0 ? (
          <Surface>
            <EmptyState
              icon="bookmark"
              title="No due dates yet"
              description="Keep assignments and tests here, sorted by when they’re due."
              action={<SmallButton label="Add due date" icon="plus" onPress={() => openDeadline()} />}
            />
          </Surface>
        ) : (
          <Surface style={styles.list}>
            {items.map((item, index) => {
              const due = dueLabel(item.dueAt);
              const isOverdue = due.startsWith("Overdue");
              return (
                <View
                  key={item.id}
                  style={[
                    styles.row,
                    index < items.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.completed }}
                    accessibilityLabel={`Mark ${item.title} ${item.completed ? "incomplete" : "complete"}`}
                    testID={`toggle-deadline-${item.id}`}
                    onPress={() => updateDeadline(item.id, { completed: !item.completed })}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: item.completed ? colors.primary : colors.border,
                        backgroundColor: item.completed ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    {item.completed ? <Feather name="check" size={14} color={colors.primaryForeground} /> : null}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.title}`}
                    testID={`edit-deadline-${item.id}`}
                    onPress={() => openDeadline(item)}
                    style={styles.itemText}
                  >
                    <View style={styles.titleLine}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.itemTitle,
                          {
                            color: item.completed ? colors.mutedForeground : colors.foreground,
                            fontFamily: colors.fontFamily.semibold,
                            textDecorationLine: item.completed ? "line-through" : "none",
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text style={[styles.type, { color: colors.mutedForeground }]}>
                        {item.kind === "test" ? "TEST" : "ASSIGNMENT"}
                      </Text>
                    </View>
                    <View style={styles.metaLine}>
                      <Feather name="clock" size={12} color={isOverdue ? colors.destructive : colors.mutedForeground} />
                      <Text style={[styles.due, { color: isOverdue ? colors.destructive : colors.mutedForeground }]}>
                        {due} · {formatClock(item.dueAt)}
                      </Text>
                    </View>
                    {item.notes ? (
                      <Text numberOfLines={2} style={{ color: colors.mutedForeground, fontSize: 12 }}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.title}`}
                    onPress={() => openDeadline(item)}
                    style={styles.edit}
                  >
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              );
            })}
          </Surface>
        )}
      </View>
    </PlannerPage>
  );
}

const styles = StyleSheet.create({
  summary: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  summaryText: { flex: 1, gap: 1 },
  count: { fontSize: 20 },
  sectionBlock: { gap: 11 },
  list: { paddingVertical: 0, paddingHorizontal: 14 },
  row: { minHeight: 82, flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 23, height: 23, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  itemText: { flex: 1, gap: 7, paddingVertical: 13 },
  titleLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  itemTitle: { flex: 1, fontSize: 14 },
  type: { fontSize: 9, letterSpacing: 0.5 },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  due: { fontSize: 11 },
  edit: { width: 30, height: 48, alignItems: "center", justifyContent: "center" },
});
