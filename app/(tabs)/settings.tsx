import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { PageHeader, PlannerPage, Surface } from "@/components/PlannerUI";
import {
  isPlannerBackup,
  usePlanner,
  type PlannerBackup,
} from "@/context/PlannerContext";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const modeLabels: Record<ThemeMode, string> = {
  system: "Use device setting",
  light: "Light",
  dark: "Dark",
};

export default function SettingsScreen() {
  const colors = useColors();
  const { mode, setMode } = useTheme();
  const planner = usePlanner();
  const [pendingBackup, setPendingBackup] = useState<{
    backup: PlannerBackup;
    fileName: string;
  } | null>(null);
  const [message, setMessage] = useState("");

  const exportBackup = () => {
    setMessage("");
    if (typeof document === "undefined") {
      setMessage("File export is only available in a web browser.");
      return;
    }
    try {
      const backup = planner.makeBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `senior-planner-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      planner.markBackupExported();
      setMessage("Backup saved. Keep the JSON file somewhere safe.");
    } catch {
      setMessage("The backup could not be exported. Check browser storage and try again.");
    }
  };

  const downloadPortableHtmlApp = async () => {
    setMessage("");
    if (typeof document === "undefined" || typeof window === "undefined") {
      setMessage("File download is only available in a web browser.");
      return;
    }
    try {
      const response = await fetch("./Giuliana-Planner.html", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Standalone file not found.");
      }
      let html = await response.text();
      const embeddedState = {
        formatVersion: 1,
        createdAt: new Date().toISOString(),
        lastExportAt: new Date().toISOString(),
        tasks: planner.tasks,
        events: planner.events,
        deadlines: planner.deadlines,
      };
      html = html.replace(
        /<script id="planner-embedded-state" type="application\/json">[\s\S]*?<\/script>/,
        `<script id="planner-embedded-state" type="application/json">${JSON.stringify(embeddedState)}</script>`,
      );
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Giuliana-Planner.html";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      planner.markBackupExported();
      setMessage("Downloaded Giuliana-Planner.html with your current planner data built in.");
    } catch {
      setMessage("Could not download the single-file app. Use Export JSON backup below.");
    }
  };

  const chooseBackup = () => {
    setMessage("");
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = ".json,application/json,.html,text/html";
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        let parsed: unknown;
        if (file.name.toLowerCase().endsWith(".html")) {
          const match = text.match(
            /<script[^>]*id=["']planner-embedded-state["'][^>]*>([\s\S]*?)<\/script>/i,
          );
          const rawJson = match?.[1] ? JSON.parse(match[1]) : null;
          parsed = rawJson
            ? {
                formatVersion: rawJson.formatVersion,
                exportedAt: rawJson.lastExportAt ?? rawJson.createdAt ?? new Date().toISOString(),
                tasks: rawJson.tasks,
                events: rawJson.events,
                deadlines: rawJson.deadlines,
              }
            : null;
        } else {
          parsed = JSON.parse(text);
        }
        if (!isPlannerBackup(parsed)) {
          setMessage("That file is not a supported Senior Planner backup.");
          return;
        }
        setPendingBackup({ backup: parsed, fileName: file.name });
      } catch {
        setMessage("The selected file could not be read as a planner backup.");
      }
    };
    picker.click();
  };

  const applyImport = (importMode: "replace" | "merge") => {
    if (!pendingBackup) return;
    const count =
      pendingBackup.backup.tasks.length +
      pendingBackup.backup.events.length +
      pendingBackup.backup.deadlines.length;
    planner.importBackup(pendingBackup.backup, importMode);
    setPendingBackup(null);
    setMessage(
      importMode === "replace"
        ? `Replaced planner data with ${count} items from ${pendingBackup.fileName}.`
        : `Merged ${count} items from ${pendingBackup.fileName}. Items with matching IDs were skipped.`,
    );
  };

  const totalItems =
    planner.tasks.length + planner.events.length + planner.deadlines.length;

  return (
    <PlannerPage>
      <PageHeader title="Settings" subtitle="Your appearance and local backups." />

      <Surface style={styles.storageInfo}>
        <View style={[styles.storageIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="hard-drive" size={19} color={colors.primary} />
        </View>
        <View style={styles.storageCopy}>
          <Text style={[styles.storageTitle, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>
            Stored on this device
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
            Your {totalItems} planner items stay in this browser. They do not sync to other devices.
          </Text>
        </View>
      </Surface>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>
          One-Click App Setup (Phone & Computer)
        </Text>
        <Surface style={styles.backupCard}>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 19 }}>
            No extra software is needed. Here is how to make a 1-click icon on any device:
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 12, lineHeight: 18 }}>
            • <Text style={{ fontFamily: colors.fontFamily.semibold }}>iPhone / iPad:</Text> Open in Safari, tap Share, then tap <Text style={{ fontFamily: colors.fontFamily.semibold }}>Add to Home Screen</Text>.{"\n"}
            • <Text style={{ fontFamily: colors.fontFamily.semibold }}>Android:</Text> Open in Chrome, tap ⋮, then tap <Text style={{ fontFamily: colors.fontFamily.semibold }}>Install app</Text>.{"\n"}
            • <Text style={{ fontFamily: colors.fontFamily.semibold }}>Computer (Offline File):</Text> Download the single-file app below, put <Text style={{ fontFamily: colors.fontFamily.semibold }}>Giuliana-Planner.html</Text> on your Desktop, and double-click it anytime.
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="download-portable-html"
            onPress={() => void downloadPortableHtmlApp()}
            style={({ pressed }) => [
              styles.actionRow,
              { backgroundColor: colors.primary, borderRadius: colors.radius.medium, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name="download" size={18} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontFamily: colors.fontFamily.semibold }}>
              Download Portable App File (.html)
            </Text>
          </Pressable>
        </Surface>
      </View>

      {planner.backupDue ? (
        <Surface style={styles.backupNotice}>
          <Feather name="alert-circle" size={18} color={colors.primary} />
          <Text style={{ color: colors.foreground, flex: 1, fontSize: 12, lineHeight: 18 }}>
            It’s been more than 7 days since your last backup. Export a copy to protect your planner data.
          </Text>
        </Surface>
      ) : null}

      {planner.storageError ? (
        <Surface style={styles.errorNotice}>
          <Feather name="alert-triangle" size={18} color={colors.destructive} />
          <Text style={{ color: colors.foreground, flex: 1, fontSize: 12, lineHeight: 18 }}>
            {planner.storageError}
          </Text>
        </Surface>
      ) : null}

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
            Export includes tasks, events, assignments, and tests. Import can replace this browser’s data or merge items from another backup.
          </Text>
          <Pressable
            accessibilityRole="button"
            testID="export-backup"
            onPress={exportBackup}
            style={({ pressed }) => [
              styles.actionRow,
              { backgroundColor: colors.secondary, borderRadius: colors.radius.medium, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name="download" size={18} color={colors.primary} />
            <Text style={{ color: colors.secondaryForeground, fontFamily: colors.fontFamily.semibold }}>Export JSON backup</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            testID="import-backup"
            onPress={chooseBackup}
            style={({ pressed }) => [
              styles.actionRow,
              { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: colors.radius.medium, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name="upload" size={18} color={colors.primary} />
            <Text style={{ color: colors.foreground, fontFamily: colors.fontFamily.semibold }}>Import JSON backup</Text>
          </Pressable>
          {message ? (
            <Text accessibilityRole="status" style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>
              {message}
            </Text>
          ) : null}
        </Surface>
      </View>

      <Modal
        visible={pendingBackup !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingBackup(null)}
      >
        <View style={styles.modalBackdrop}>
          <Surface style={[styles.modalCard, { borderRadius: colors.radius.large }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: colors.fontFamily.bold }]}>
              Import backup
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, lineHeight: 20 }}>
              Choose whether to replace the planner on this device or merge in items from {pendingBackup?.fileName}.
            </Text>
            <Pressable
              accessibilityRole="button"
              testID="import-replace"
              onPress={() => applyImport("replace")}
              style={[styles.modalAction, { backgroundColor: colors.destructive, borderRadius: colors.radius.medium }]}
            >
              <Text style={{ color: colors.destructiveForeground, fontFamily: colors.fontFamily.semibold }}>
                Replace current data
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              testID="import-merge"
              onPress={() => applyImport("merge")}
              style={[styles.modalAction, { backgroundColor: colors.primary, borderRadius: colors.radius.medium }]}
            >
              <Text style={{ color: colors.primaryForeground, fontFamily: colors.fontFamily.semibold }}>
                Merge with current data
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setPendingBackup(null)} style={styles.cancelButton}>
              <Text style={{ color: colors.mutedForeground, fontFamily: colors.fontFamily.medium }}>Cancel</Text>
            </Pressable>
          </Surface>
        </View>
      </Modal>
    </PlannerPage>
  );
}

const styles = StyleSheet.create({
  storageInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  storageIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  storageCopy: { flex: 1, gap: 4 },
  storageTitle: { fontSize: 14 },
  backupNotice: { flexDirection: "row", alignItems: "center", gap: 10 },
  errorNotice: { flexDirection: "row", alignItems: "center", gap: 10 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, paddingLeft: 2 },
  modeList: { paddingVertical: 0, paddingHorizontal: 14 },
  modeRow: { minHeight: 53, flexDirection: "row", alignItems: "center" },
  backupCard: { gap: 12 },
  actionRow: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  modalBackdrop: { flex: 1, padding: 20, backgroundColor: "rgba(0,0,0,0.42)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "100%", maxWidth: 440, gap: 13 },
  modalTitle: { fontSize: 19 },
  modalAction: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  cancelButton: { minHeight: 40, alignItems: "center", justifyContent: "center" },
});
