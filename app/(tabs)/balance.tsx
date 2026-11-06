import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  EmptyState,
  PageHeader,
  PlannerPage,
  SectionHeading,
  Surface,
} from "@/components/PlannerUI";
import { PLANNER_CATEGORIES, usePlanner, type PlannerCategory } from "@/context/PlannerContext";
import { useColors } from "@/hooks/useColors";

function mondayOf(date: Date) {
  const offset = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
}

function duration(minutes: number) {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function BalanceScreen() {
  const colors = useColors();
  const { events } = usePlanner();
  const [focusDate, setFocusDate] = useState(() => new Date());
  const weekStart = useMemo(() => mondayOf(focusDate), [focusDate]);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const periodEnd = new Date(weekEnd.getTime() - 1);
  const period = `${weekStart.toLocaleDateString([], { month: "short", day: "numeric" })} – ${periodEnd.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  const values = useMemo(() => {
    const totals = new Map<PlannerCategory, number>(
      PLANNER_CATEGORIES.map((category) => [category, 0]),
    );
    const start = weekStart.getTime();
    const end = weekEnd.getTime();
    for (const event of events) {
      const eventStart = new Date(event.startsAt).getTime();
      const eventEnd = new Date(event.endsAt).getTime();
      const overlap = Math.max(0, Math.min(eventEnd, end) - Math.max(eventStart, start));
      if (overlap > 0) {
        totals.set(event.category, (totals.get(event.category) ?? 0) + overlap / 60_000);
      }
    }
    const rounded = new Map(
      Array.from(totals, ([category, minutes]) => [category, Math.round(minutes)] as const),
    );
    const totalMinutes = Array.from(rounded.values()).reduce((sum, minutes) => sum + minutes, 0);
    return {
      totalMinutes,
      categories: PLANNER_CATEGORIES.map((category) => {
        const minutes = rounded.get(category) ?? 0;
        return {
          category,
          minutes,
          percent: totalMinutes ? Math.round((minutes / totalMinutes) * 100) : 0,
        };
      }),
    };
  }, [events, weekEnd, weekStart]);

  const categoryColor = (category: PlannerCategory) => {
    switch (category) {
      case "School": return colors.categorySchool;
      case "Clubs": return colors.categoryClubs;
      case "Tutoring": return colors.categoryTutoring;
      case "Study": return colors.categoryStudy;
      case "Social": return colors.categorySocial;
      case "Personal": return colors.categoryPersonal;
    }
  };

  return (
    <PlannerPage>
      <PageHeader title="Balance" subtitle="How your planned time is shared." />
      <Surface style={styles.totalCard}>
        <View style={[styles.totalIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="pie-chart" size={20} color={colors.primary} />
        </View>
        <View style={styles.totalCopy}>
          <Text style={[styles.totalValue, { color: colors.foreground, fontFamily: colors.fontFamily.bold }]}>
            {duration(values.totalMinutes)}
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
        {values.totalMinutes > 0 ? (
          <View style={styles.rows}>
            {values.categories.map(({ category, minutes, percent }) => {
              const color = categoryColor(category);
              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryLine}>
                    <View style={styles.categoryName}>
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      <Text style={[styles.name, { color: colors.foreground, fontFamily: colors.fontFamily.medium }]}>{category}</Text>
                    </View>
                    <Text style={[styles.value, { color: colors.mutedForeground }]}>
                      {duration(minutes)} · {percent}%
                    </Text>
                  </View>
                  <View style={[styles.track, { backgroundColor: colors.muted, borderRadius: colors.radius.pill }]}>
                    <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color, borderRadius: colors.radius.pill }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="clock"
            title="No time planned yet"
            description="Add events to your week to see how your time is divided."
          />
        )}
      </Surface>
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
});
