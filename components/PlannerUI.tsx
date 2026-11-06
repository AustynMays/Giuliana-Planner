import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export function PlannerPage({
  children,
  contentStyle,
  ...scrollProps
}: ScrollViewProps & { children: React.ReactNode; contentStyle?: ViewStyle }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.pageContent,
          {
            paddingTop:
              Platform.OS === "web"
                ? Math.max(insets.top, colors.spacing.md) + colors.spacing.md
                : insets.top + colors.spacing.md,
            paddingBottom:
              Platform.OS === "web"
                ? 34 + 100
                : insets.bottom + 110,
            paddingHorizontal: colors.spacing.lg,
            width: "100%",
            maxWidth: 960,
            alignSelf: "center",
          },
          contentStyle,
        ]}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground, fontFamily: colors.fontFamily.semibold }]}>
          YOUR PLANNER
        </Text>
        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            { color: colors.foreground, fontFamily: colors.fontFamily.bold },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: colors.mutedForeground, fontFamily: colors.fontFamily.regular },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  testID,
  color,
}: {
  name: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
  color?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Feather name={name} size={21} color={color ?? colors.foreground} />
    </Pressable>
  );
}

export function Surface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius.medium,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionHeading({
  title,
  trailing,
}: {
  title: string;
  trailing?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.foreground, fontFamily: colors.fontFamily.semibold },
        ]}
      >
        {title}
      </Text>
      {trailing}
    </View>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const colors = useColors();
  const tint = categoryColorFor(category, colors);
  return (
    <View
      style={[
        styles.categoryChip,
        { backgroundColor: colors.secondary, borderRadius: colors.radius.pill },
      ]}
    >
      <View style={[styles.categoryDot, { backgroundColor: tint }]} />
      <Text
        style={[
          styles.categoryText,
          { color: colors.secondaryForeground, fontFamily: colors.fontFamily.medium },
        ]}
      >
        {category}
      </Text>
    </View>
  );
}

export function categoryColorFor(
  category: string,
  colors: ReturnType<typeof useColors>,
) {
  const colorMap: Record<string, string> = {
    School: colors.categorySchool,
    Clubs: colors.categoryClubs,
    Tutoring: colors.categoryTutoring,
    Study: colors.categoryStudy,
    Social: colors.categorySocial,
    Personal: colors.categoryPersonal,
  };
  return colorMap[category] ?? colors.primary;
}

export function EmptyState({
  icon = "calendar",
  title,
  description,
  action,
}: {
  icon?: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: colors.secondary, borderRadius: colors.radius.large },
        ]}
      >
        <Feather name={icon} size={22} color={colors.primary} />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: colors.foreground, fontFamily: colors.fontFamily.semibold },
        ]}
      >
        {title}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {description}
      </Text>
      {action}
    </View>
  );
}

export function LoadingState({ label = "Loading your planner…" }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.errorBox,
        {
          backgroundColor: colors.accent,
          borderColor: colors.border,
          borderRadius: colors.radius.medium,
        },
      ]}
    >
      <Feather name="alert-circle" size={19} color={colors.accentForeground} />
      <Text style={[styles.errorMessage, { color: colors.accentForeground }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        testID="retry-button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, { opacity: pressed ? 0.65 : 1 }]}
      >
        <Text style={{ color: colors.primary, fontFamily: colors.fontFamily.semibold }}>
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

export function SmallButton({
  label,
  icon,
  onPress,
  secondary = false,
  testID,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  secondary?: boolean;
  testID?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallButton,
        {
          backgroundColor: secondary ? colors.secondary : colors.primary,
          borderRadius: colors.radius.pill,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {icon ? (
        <Feather
          name={icon}
          size={15}
          color={secondary ? colors.secondaryForeground : colors.primaryForeground}
        />
      ) : null}
      <Text
        style={{
          color: secondary ? colors.secondaryForeground : colors.primaryForeground,
          fontSize: colors.typography.small,
          fontFamily: colors.fontFamily.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function formatClock(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatLongDate(value: Date) {
  return value.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function dateToInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateTimeInput(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  pageContent: { flexGrow: 1, gap: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 74,
    gap: 14,
  },
  headerCopy: { flex: 1, gap: 4 },
  eyebrow: { fontSize: 10, letterSpacing: 1.6 },
  title: { fontSize: 31, lineHeight: 38 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  iconButton: {
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: { fontSize: 17 },
  categoryChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryDot: { width: 7, height: 7, borderRadius: 4 },
  categoryText: { fontSize: 11 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 9,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, textAlign: "center" },
  emptyDescription: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  state: { flex: 1, minHeight: 160, alignItems: "center", justifyContent: "center", gap: 10 },
  stateText: { fontSize: 13 },
  errorBox: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorMessage: { flex: 1, fontSize: 13, lineHeight: 18 },
  retry: { paddingHorizontal: 6, paddingVertical: 8 },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 15,
    gap: 7,
  },
});
