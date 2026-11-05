import React, { createContext, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
  useLogout,
} from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const queryClient = useQueryClient();
  const currentUser = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: 30_000,
    },
  });
  const logout = useLogout();

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUser.data ?? null,
      loading: currentUser.isLoading,
      refreshUser: async () => {
        await queryClient.invalidateQueries({
          queryKey: getGetCurrentUserQueryKey(),
        });
      },
      signOut: async () => {
        await logout.mutateAsync(undefined);
        queryClient.clear();
      },
    }),
    [
      currentUser.data,
      currentUser.isLoading,
      logout,
      queryClient,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
