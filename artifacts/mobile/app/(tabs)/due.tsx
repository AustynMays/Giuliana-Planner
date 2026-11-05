import React from "react";
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListDeadlinesQueryKey,
  useListDeadlines,
  useUpdateDeadline,
} from "@workspace/api-client-react";
import type { Deadline } from "@workspace/api-client-react";
import { EmptyState, ErrorState, PageHeader, PlannerPage, SectionHeading, SmallButton, Surface, dateToInput, formatClock } from "@/components/PlannerUI";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function openDeadline(item?: Deadline) {
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 3);
  const params: Record<string, string> = {
    kind: "deadline",
    date: dateToInput(defaultDue),
    time: "23:59",
    deadlineKind: "assignment",
  };
  if (item) {
    const dueDate = new Date(item.dueAt);
    params.date = dateToInput(dueDate);
    params.time = `${String(dueDate.getHours()).padStart(2, "0")}:${String(dueDate.getMinutes()).padStart(2, "0")}`;
    Object.assign(params, {
      id: item.id,
      title: item.title,
      dueAt: item.dueAt,
      deadlineKind: item.kind,
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useListDeadlines(
    { from: "2000-01-01T00:00:00.000Z", to: "2100-01-01T00:00:00.000Z" },
    { query: { enabled: !!user } },
  );
  const update = useUpdateDeadline();
  const items = query.data ?? [];
  const remaining = items.filter((item) => !item.completed).length;

  const toggle = async (item: Deadline) => {
    try {
      await update.mutateAsync({
        id: item.id,
        data: {
          title: item.title,
          kind: item.kind,
          dueAt: item.dueAt,
          notes: item.notes ?? null,
          completed: !item.completed,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() });
    } catch (error) {
      Alert.alert(
        "Could not update due date",
        error instanceof Error ? error.message : "Try again in a moment.",
      );
    }
  };

  return (
    <PlannerPage
      refreshControl={
        <RefreshControl
          refreshing={query.isFetching}
          onRefresh={() => void query.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <PageHeader
        title="Coming up"
        subtitle="Assignments and tests, in due-date order."
      />
      {query.isLoading ? (
        <View style={styles.loading}><Text style={{ color: colors.mutedForeground }}>Loading due dates…</Text></View>
      ) : query.isError ? (
        <ErrorState
          message={query.error instanceof Error ? query.error.message : "Could not load due dates."}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <Surface style={styles.summary}>
            <View style={styles.summaryIcon}>
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
                        onPress={() => void toggle(item)}
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
                          <Text
                            style={[
                              styles.due,
                              { color: isOverdue ? colors.destructive : colors.mutedForeground },
                            ]}
                          >
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
        </>
      )}
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
  loading: { minHeight: 170, alignItems: "center", justifyContent: "center" },
});
