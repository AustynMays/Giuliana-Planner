import { Redirect } from "expo-router";
import { LoadingState } from "@/components/PlannerUI";
import { useAuth } from "@/context/AuthContext";

export default function IndexScreen() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState />;
  return <Redirect href={user ? "/(tabs)" : "/login"} />;
}
