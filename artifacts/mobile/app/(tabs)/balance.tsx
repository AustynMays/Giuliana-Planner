import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useGetWeeklySummary } from "@workspace/api-client-react";
import type { Category } from "@workspace/api-client-react";
import { EmptyState, ErrorState, PageHeader, PlannerPage, SectionHeading, Surface } from "@/components/PlannerUI";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function mondayOf(date: Date) {
  const offset = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

const categoryList: Category[] = ["School", "Clubs", "Tutoring", "Study", "Social", "Personal"];

export default function BalanceScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [focusDate, setFocusDate] = useState(() => new Date());
  const weekStart = useMemo(() => mondayOf(focusDate), [focusDate]);
  const query = useGetWeeklySummary(
    { weekStart: weekStart.toISOString() },
    { query: { enabled: !!user } },
  );
  const summary = query.data;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const period = `${weekStart.toLocaleDateString([], { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  const byCategory = new Map((summary?.categories ?? []).map((row) => [row.category, row]));
  const hasTime = Boolean(summary?.totalMinutes);

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
      <PageHeader title="Balance" subtitle="How your planned time is shared." />
      {query.isLoading ? (
        <View style={styles.loading}><Text style={{ color: colors.mutedForeground }}>Loading your week…</Text></View>
      ) : query.isError ? (
        <ErrorState
          message={query.error instanceof Error ? query.error.message : "Could not load your time summary."}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <Surface style={styles.totalCard}>
            <View style={styles.totalIcon}>
              <Feather name="pie-chart" size={20} color={colors.primary} />
            </View>
            <View style={styles.totalCopy}>
              <Text style={[styles.totalValue, { color: colors.foreground, fontFamily: colors.fontFamily.bold }]}>
                {Math.floor((summary?.totalMinutes ?? 0) / 60)}h {(summary?.totalMinutes ?? 0) % 60}m
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>planned this week</Text>
            </View>
          </Surface>

          <Surface style={styles.balanceCard}>
            <View style={styles.periodRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous week"
                testID="balance-previous-week"
                onPress={() => setFocusDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))}
                style={styles.arrow}
              >
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.period, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>{period}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next week"
                testID="balance-next-week"
                onPress={() => setFocusDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))}
                style={styles.arrow}
              >
                <Feather name="chevron-right" size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <SectionHeading title="Time by category" />
            {hasTime ? (
              <View style={styles.rows}>
                {categoryList.map((category) => {
                  const entry = byCategory.get(category);
                  const minutes = entry?.minutes ?? 0;
                  const percent = entry?.percent ?? 0;
                  const color =
                    category === "School" ? colors.categorySchool :
                    category === "Clubs" ? colors.categoryClubs :
                    category === "Tutoring" ? colors.categoryTutoring :
                    category === "Study" ? colors.categoryStudy :
                    category === "Social" ? colors.categorySocial : colors.categoryPersonal;
                  return (
                    <View key={category} style={styles.categoryRow}>
                      <View style={styles.categoryLine}>
                        <View style={styles.categoryName}>
                          <View style={[styles.dot, { backgroundColor: color }]} />
                          <Text style={[styles.name, { color: colors.foreground, fontFamily: colors.fontFamily.medium }]}>{category}</Text>
                        </View>
                        <Text style={[styles.value, { color: colors.mutedForeground }]}>
                          {Math.floor(minutes / 60)}h {minutes % 60}m · {percent}%
                        </Text>
                      </View>
                      <View style={[styles.track, { backgroundColor: colors.muted, borderRadius: colors.radius.pill }]}>
                        <View
                          style={[
                            styles.fill,
                            {
                              width: `${Math.max(0, Math.min(100, percent))}%`,
                              backgroundColor: color,
                              borderRadius: colors.radius.pill,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                icon="clock"
                title="No time logged yet"
                description="Add events to your week to see how your time is divided."
              />
            )}
          </Surface>
        </>
      )}
    </PlannerPage>
  );
}

const styles = StyleSheet.create({
  totalCard: { flexDirection: "row", alignItems: "center", gap: 13 },
  totalIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  totalCopy: { gap: 3 },
  totalValue: { fontSize: 23 },
  balanceCard: { gap: 16 },
  periodRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  arrow: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  period: { fontSize: 14 },
  rows: { gap: 18 },
  categoryRow: { gap: 8 },
  categoryLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  categoryName: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 5 },
  name: { fontSize: 13 },
  value: { fontSize: 11 },
  track: { height: 7, overflow: "hidden" },
  fill: { height: 7 },
  loading: { minHeight: 170, alignItems: "center", justifyContent: "center" },
});
