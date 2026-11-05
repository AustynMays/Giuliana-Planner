import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey, useLogin, useRegister } from "@workspace/api-client-react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";

export function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const login = useLogin();
  const register = useRegister();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [formError, setFormError] = useState("");
  const isSignup = mode === "signup";
  const isBusy = login.isPending || register.isPending;

  const submit = async () => {
    setFormError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setFormError("Use a password with at least 8 characters.");
      return;
    }
    if (isSignup && password !== confirmation) {
      setFormError("Those passwords do not match.");
      return;
    }
    try {
      if (isSignup) {
        await register.mutateAsync({ data: { email: normalizedEmail, password } });
      } else {
        await login.mutateAsync({ data: { email: normalizedEmail, password } });
      }
      await queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      router.replace("/(tabs)" as never);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in right now.");
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={72}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: colors.spacing.xl,
          paddingTop:
            Platform.OS === "web"
              ? Math.max(insets.top, 67) + colors.spacing.lg
              : insets.top + colors.spacing.lg,
          paddingBottom:
            Platform.OS === "web"
              ? 34 + colors.spacing.xl
              : insets.bottom + colors.spacing.xl,
        }}
      >
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={25} color={colors.primaryForeground} />
        </View>
        <Text
          style={[
            styles.eyebrow,
            { color: colors.mutedForeground, fontFamily: colors.fontFamily.semibold },
          ]}
        >
          SENIOR PLANNER
        </Text>
        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            { color: colors.foreground, fontFamily: colors.fontFamily.bold },
          ]}
        >
          {isSignup ? "Make room for it all." : "Good to see you."}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.mutedForeground, fontFamily: colors.fontFamily.regular },
          ]}
        >
          {isSignup
            ? "One calm place for classes, plans, and everything in between."
            : "Pick up where your week left off."}
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Email</Text>
          <TextInput
            testID="auth-email"
            accessibilityLabel="Email address"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.input,
                color: colors.foreground,
                borderRadius: colors.radius.medium,
                fontFamily: colors.fontFamily.regular,
              },
            ]}
          />
          <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Password</Text>
          <TextInput
            testID="auth-password"
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete={isSignup ? "new-password" : "current-password"}
            secureTextEntry
            placeholder="At least 8 characters"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.input,
                color: colors.foreground,
                borderRadius: colors.radius.medium,
                fontFamily: colors.fontFamily.regular,
              },
            ]}
          />
          {isSignup ? (
            <>
              <Text style={[styles.label, { color: colors.foreground, fontFamily: colors.fontFamily.semibold }]}>Confirm password</Text>
              <TextInput
                testID="auth-confirm-password"
                accessibilityLabel="Confirm password"
                autoCapitalize="none"
                secureTextEntry
                value={confirmation}
                onChangeText={setConfirmation}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.input,
                    color: colors.foreground,
                    borderRadius: colors.radius.medium,
                    fontFamily: colors.fontFamily.regular,
                  },
                ]}
              />
            </>
          ) : null}
          {formError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.destructive }]}>
              {formError}
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSignup ? "Create account" : "Sign in"}
            testID="auth-submit"
            disabled={isBusy}
            onPress={submit}
            style={({ pressed }) => [
              styles.submit,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius.pill,
                opacity: pressed || isBusy ? 0.76 : 1,
              },
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text
                style={[
                  styles.submitText,
                  { color: colors.primaryForeground, fontFamily: colors.fontFamily.semibold },
                ]}
              >
                {isSignup ? "Create account" : "Sign in"}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.mutedForeground, fontFamily: colors.fontFamily.regular }}>
            {isSignup ? "Already have an account?" : "New to Senior Planner?"}
          </Text>
          <Link href={isSignup ? "/login" : "/signup"} asChild>
            <Pressable accessibilityRole="link" testID="auth-switch">
              <Text style={{ color: colors.primary, fontFamily: colors.fontFamily.semibold }}>
                {isSignup ? "Sign in" : "Create account"}
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
  },
  eyebrow: { fontSize: 11, letterSpacing: 1.8, marginBottom: 10 },
  title: { fontSize: 32, lineHeight: 39, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 30, maxWidth: 310 },
  form: { gap: 9 },
  label: { fontSize: 13, marginTop: 5 },
  input: {
    minHeight: 54,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    fontSize: 15,
  },
  error: { fontSize: 13, lineHeight: 18, marginTop: 5 },
  submit: {
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  submitText: { fontSize: 15 },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    flexWrap: "wrap",
  },
});
