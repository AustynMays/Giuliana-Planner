import React from "react";
import { Platform, StyleSheet, useWindowDimensions } from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 950;
  const tabBarWidth = wide ? Math.min(width - 64, 820) : width;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: colors.fontFamily.medium,
          marginTop: 2,
        },
        tabBarItemStyle: {
          minHeight: 50,
          borderRadius: colors.radius.medium,
        },
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: wide ? colors.radius.large : 0,
            width: wide ? tabBarWidth : "100%",
            left: wide ? (width - tabBarWidth) / 2 : 0,
            marginBottom: Platform.OS === "web" ? 16 : 0,
            paddingBottom:
              Platform.OS === "web" ? 7 : Math.max(5, insets.bottom),
          },
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ focused }) => (
            <Feather
              name={focused ? "sun" : "sunrise"}
              size={19}
              color={focused ? colors.primary : colors.mutedForeground}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: "Week",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="calendar"
              size={19}
              color={focused ? colors.primary : colors.mutedForeground}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="due"
        options={{
          title: "Due",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="bookmark"
              size={19}
              color={focused ? colors.primary : colors.mutedForeground}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: "Balance",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="bar-chart-2"
              size={19}
              color={focused ? colors.primary : colors.mutedForeground}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => (
            <Feather
              name="settings"
              size={19}
              color={focused ? colors.primary : colors.mutedForeground}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    height: 70,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
  },
});
