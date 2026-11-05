import React from 'react';
import { Platform, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Redirect, Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAuth } from '@/context/AuthContext';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} />
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="week">
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} />
        <NativeTabs.Trigger.Label>Week</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="due">
        <NativeTabs.Trigger.Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} />
        <NativeTabs.Trigger.Label>Due</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="balance">
        <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <NativeTabs.Trigger.Label>Balance</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb
            ? { height: 84 }
            : { paddingBottom: 5, height: 60 }),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) =>
            <Feather name={focused ? 'sun' : 'sunrise'} size={20} color={focused ? colors.primary : colors.mutedForeground} />,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'Week',
          tabBarIcon: ({ focused }) => (
            <Feather name="calendar" size={20} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="due"
        options={{
          title: 'Due',
          tabBarIcon: ({ focused }) => (
            <Feather name="bookmark" size={20} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: 'Balance',
          tabBarIcon: ({ focused }) => <Feather name="bar-chart-2" size={20} color={focused ? colors.primary : colors.mutedForeground} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <Feather name="settings" size={20} color={focused ? colors.primary : colors.mutedForeground} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();
  if (loading) return <View style={{ flex: 1 }} />;
  if (!user) return <Redirect href="/login" />;
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
