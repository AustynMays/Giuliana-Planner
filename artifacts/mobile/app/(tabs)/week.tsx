import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useListEvents } from "@workspace/api-client-react";
import { CategoryChip, EmptyState, ErrorState, PageHeader, PlannerPage, SectionHeading, SmallButton, Surface, categoryColorFor, dateToInput, formatClock } from "@/components/PlannerUI";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function mondayOf(date: Date) {
  const dayOffset = (date.getDay() + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - dayOffset);
}

function openEvent(event?: {
  id?: string;
  title?: string;
  category?: string;
  notes?: string | null;
  startsAt?: string;
  endsAt?: string;
}, date = dateToInput(new Date())) {
  const params: Record<string, string> = {
    kind: "event",
    date,
    time: "15:00",
    endTime: "16:00",
  };
  if (event?.id && event.startsAt && event.endsAt) {
    const start = new Date(event.startsAt);
    const end = new Date(event.endsAt);
    Object.assign(params, {
      id: event.id,
      title: event.title ?? "",
      category: event.category ?? "School",
      notes: event.notes ?? "",
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      date: dateToInput(start),
      time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      endTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
    });
  }
  router.push({ pathname: "/item-form", params } as never);
}

export default function WeekScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const [focusDate, setFocusDate] = useState(() => new Date());
  const weekStart = useMemo(() => mondayOf(focusDate), [focusDate]);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const from = weekStart.toISOString();
  const to = weekEnd.toISOString();
  const eventQuery = useListEvents(
    { from, to },
    { query: { enabled: !!user } },
  );
  const events = eventQuery.data ?? [];
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    const dayKey = dateToInput(date);
    return {
      date,
      dayKey,
      events: events.filter((event) => dateToInput(new Date(event.startsAt)) === dayKey),
    };
  });
  const label = `${weekStart.toLocaleDateString([], { month: "short", day: "numeric" })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString([], { month: "short", day: "numeric" })}`;

  if (eventQuery.isLoading) {
    return <PlannerPage><PageHeader title="This week" /><View style={{ flex: 1 }} /></PlannerPage>;
  }
  if (eventQuery.isError) {
    return (
      <PlannerPage>
        <PageHeader title="This week" />
        <ErrorState
          message={eventQuery.error instanceof Error ? eventQuery.error.message : "Could not load this week."}
          onRetry={() => void eventQuery.refetch()}
        />
      </PlannerPage>
    );
  }

  return (
    <PlannerPage
      refreshControl={
        <RefreshControl
          refreshing={eventQuery.isFetching}
          onRefresh={() => void eventQuery.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <PageHeader title="This week" subtitle="A clear view of what's coming." />
      <Surface style={styles.weekCard}>
        <View style={styles.weekNav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous week"
            testID="previous-week"
            onPress={() => setFocusDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 7))}
            style={styles.arrow}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.weekLabel, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>{label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next week"
            testID="next-week"
            onPress={() => setFocusDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7))}
            style={styles.arrow}
          >
            <Feather name="chevron-right" size={20} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.dayStrip}>
          {days.map(({ date }) => {
            const selected = dateToInput(date) === dateToInput(focusDate);
            const today = dateToInput(date) === dateToInput(new Date());
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
                accessibilityState={{ selected }}
                testID={`week-day-${dateToInput(date)}`}
                key={date.toISOString()}
                onPress={() => setFocusDate(date)}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: selected ? colors.primary : "transparent",
                    borderRadius: colors.radius.medium,
                  },
                ]}
              >
                <Text style={{ color: selected ? colors.primaryForeground : colors.mutedForeground, fontSize: 10 }}>
                  {date.toLocaleDateString([], { weekday: "short" })}
                </Text>
                <Text
                  style={{
                    color: selected ? colors.primaryForeground : colors.foreground,
                    fontSize: 14,
                    fontFamily: colors.fontFamily.semibold,
                  }}
                >
                  {date.getDate()}
                </Text>
                {today ? <View style={[styles.todayDot, { backgroundColor: selected ? colors.primaryForeground : colors.primary }]} /> : <View style={styles.todayDot} />}
              </Pressable>
            );
          })}
        </View>
      </Surface>
      <View style={styles.sectionBlock}>
        <SectionHeading title="Events" trailing={<SmallButton label="Add event" icon="plus" onPress={() => openEvent(undefined, dateToInput(focusDate))} />} />
        {days.map(({ date, dayKey, events: dayEvents }) => (
          <View key={dayKey} style={styles.dayGroup}>
            <Text style={[styles.dayLabel, { color: colors.mutedForeground, fontFamily: colors.fontFamily.semibold }]}>
              {date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
            </Text>
            {dayEvents.length === 0 ? (
              <Text style={[styles.noEvents, { color: colors.mutedForeground }]}>No events planned</Text>
            ) : (
              <View style={styles.eventList}>
                {dayEvents.map((event) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${event.title}`}
                    testID={`week-event-${event.id}`}
                    key={event.id}
                    onPress={() => openEvent(event, dayKey)}
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
                    <View style={[styles.colorBar, { backgroundColor: categoryColorFor(event.category, colors) }]} />
                    <View style={styles.eventDetails}>
                      <Text style={[styles.eventTime, { color: colors.mutedForeground }]}>{formatClock(event.startsAt)} – {formatClock(event.endsAt)}</Text>
                      <Text style={[styles.eventTitle, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>{event.title}</Text>
                      <CategoryChip category={event.category} />
                    </View>
                    <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}
        {events.length === 0 ? (
          <Surface>
            <EmptyState
              icon="calendar"
              title="Your week is open"
              description="Events you add will appear here, grouped by day and category."
              action={<SmallButton label="Add event" icon="plus" onPress={() => openEvent(undefined, dateToInput(focusDate))} />}
            />
          </Surface>
        ) : null}
      </View>
    </PlannerPage>
  );
}

const styles = StyleSheet.create({
  weekCard: { gap: 12 },
  weekNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  arrow: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  weekLabel: { fontSize: 15 },
  dayStrip: { flexDirection: "row", justifyContent: "space-between" },
  dayButton: { flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", gap: 4 },
  todayDot: { width: 4, height: 4, borderRadius: 3 },
  sectionBlock: { gap: 12 },
  dayGroup: { gap: 8 },
  dayLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  noEvents: { fontSize: 13, paddingLeft: 3, paddingVertical: 4 },
  eventList: { gap: 8 },
  eventCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 11,
  },
  colorBar: { width: 3, borderRadius: 4 },
  eventDetails: { flex: 1, gap: 6, alignItems: "flex-start" },
  eventTime: { fontSize: 11 },
  eventTitle: { fontSize: 14 },
});
