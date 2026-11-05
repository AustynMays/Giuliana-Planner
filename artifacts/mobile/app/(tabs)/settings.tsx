import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListDeadlinesQueryKey,
  getListEventsQueryKey,
  getListTasksQueryKey,
  useExportData,
  useImportData,
} from "@workspace/api-client-react";
import type { BackupInput } from "@workspace/api-client-react";
import { PageHeader, PlannerPage, Surface } from "@/components/PlannerUI";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const modeLabels: Record<ThemeMode, string> = {
  system: "Use device setting",
  light: "Light",
  dark: "Dark",
};

function validateBackup(value: unknown): value is BackupInput {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return (
    data.formatVersion === 1 &&
    Array.isArray(data.tasks) &&
    Array.isArray(data.events) &&
    Array.isArray(data.deadlines) &&
    data.tasks.length + data.events.length + data.deadlines.length <= 5000
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const { user, signOut } = useAuth();
  const { mode, setMode } = useTheme();
  const queryClient = useQueryClient();
  const exportQuery = useExportData({ query: { enabled: false, retry: false } });
  const importMutation = useImportData();
  const [busy, setBusy] = useState<"export" | "import" | "signout" | null>(null);

  const exportBackup = async () => {
    setBusy("export");
    try {
      const { data } = await exportQuery.refetch();
      if (!data) throw new Error("The backup was empty.");
      const fileName = `senior-planner-${new Date().toISOString().slice(0, 10)}.json`;
      const basePath = FileSystem.documentDirectory;
      if (!basePath) throw new Error("A file folder is not available on this device.");
      const fileUri = `${basePath}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing files is not available on this device.");
      }
      await Sharing.shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Save planner backup",
        UTI: "public.json",
      });
    } catch (error) {
      Alert.alert("Backup could not be exported", error instanceof Error ? error.message : "Try again.");
    } finally {
      setBusy(null);
    }
  };

  const chooseBackup = async () => {
    try {
      const selected = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/json"],
        copyToCacheDirectory: true,
      });
      if (selected.canceled || !selected.assets[0]) return;
      const raw = await FileSystem.readAsStringAsync(selected.assets[0].uri);
      const backup: unknown = JSON.parse(raw);
      if (!validateBackup(backup)) {
        throw new Error("This file is not a supported Senior Planner backup.");
      }
      Alert.alert(
        "Replace planner data?",
        "Import replaces the events, tasks, assignments, and tests in this account with the selected backup.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace data",
            style: "destructive",
            onPress: () => void importBackup(backup),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Backup could not be read", error instanceof Error ? error.message : "Choose another file.");
    }
  };

  const importBackup = async (backup: BackupInput) => {
    setBusy("import");
    try {
      const result = await importMutation.mutateAsync({ data: backup });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getListDeadlinesQueryKey() }),
      ]);
      Alert.alert("Backup imported", `${result.imported} planner items were restored.`);
    } catch (error) {
      Alert.alert("Import failed", error instanceof Error ? error.message : "The backup could not be imported.");
    } finally {
      setBusy(null);
    }
  };

  const confirmSignOut = () => {
    Alert.alert("Sign out?", "Your planner data will stay in your account.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        onPress: async () => {
          setBusy("signout");
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Could not sign out", error instanceof Error ? error.message : "Try again.");
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  return (
    <PlannerPage>
      <PageHeader title="Settings" subtitle="Your account and planner preferences." />
      <Surface style={styles.account}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary, borderRadius: colors.radius.large }]}>
          <Feather name="user" size={20} color={colors.primary} />
        </View>
        <View style={styles.accountCopy}>
          <Text style={[styles.accountName, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Your account</Text>
          <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 13 }}>{user?.email ?? ""}</Text>
        </View>
      </Surface>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Appearance</Text>
        <Surface style={styles.modeList}>
          {(["system", "light", "dark"] as ThemeMode[]).map((choice, index) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: mode === choice }}
              testID={`theme-${choice}`}
              key={choice}
              onPress={() => setMode(choice)}
              style={[
                styles.modeRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              ]}
            >
              <Text style={{ flex: 1, color: colors.foreground, fontFamily: colors.fontFamily.medium }}>
                {modeLabels[choice]}
              </Text>
              <Feather
                name={mode === choice ? "check-circle" : "circle"}
                size={20}
                color={mode === choice ? colors.primary : colors.mutedForeground}
              />
            </Pressable>
          ))}
        </Surface>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Backups</Text>
        <Surface style={styles.backupCard}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>
            Save a copy of your tasks, schedule, assignments, and tests as JSON. Importing a backup replaces the data in this account.
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="export-backup"
            disabled={busy !== null}
            onPress={() => void exportBackup()}
            style={({ pressed }) => [
              styles.actionRow,
              { backgroundColor: colors.secondary, borderRadius: colors.radius.medium, opacity: pressed || busy ? 0.7 : 1 },
            ]}
          >
            {busy === "export" ? <ActivityIndicator color={colors.primary} /> : <Feather name="download" size={18} color={colors.primary} />}
            <Text style={{ color: colors.secondaryForeground, fontFamily: colors.fontFamily.semibold }}>Export JSON backup</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            testID="import-backup"
            disabled={busy !== null}
            onPress={() => void chooseBackup()}
            style={({ pressed }) => [
              styles.actionRow,
              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: colors.radius.medium, opacity: pressed || busy ? 0.7 : 1 },
            ]}
          >
            {busy === "import" ? <ActivityIndicator color={colors.primary} /> : <Feather name="upload" size={18} color={colors.primary} />}
            <Text style={{ color: colors.foreground, fontFamily: colors.fontFamily.semibold }}>Import JSON backup</Text>
          </Pressable>
        </Surface>
      </View>

      <Pressable
        accessibilityRole="button"
        testID="sign-out"
        disabled={busy !== null}
        onPress={confirmSignOut}
        style={({ pressed }) => [
          styles.signOut,
          { borderColor: colors.border, borderRadius: colors.radius.pill, opacity: pressed || busy ? 0.65 : 1 },
        ]}
      >
        {busy === "signout" ? <ActivityIndicator color={colors.destructive} /> : <Feather name="log-out" size={17} color={colors.destructive} />}
        <Text style={{ color: colors.destructive, fontFamily: colors.fontFamily.semibold }}>Sign out</Text>
      </Pressable>
    </PlannerPage>
  );
}

const styles = StyleSheet.create({
  account: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  accountCopy: { flex: 1, gap: 4 },
  accountName: { fontSize: 15 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, paddingLeft: 2 },
  modeList: { paddingVertical: 0, paddingHorizontal: 14 },
  modeRow: { minHeight: 53, flexDirection: "row", alignItems: "center" },
  backupCard: { gap: 12 },
  actionRow: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  signOut: {
    minHeight: 51,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
});
