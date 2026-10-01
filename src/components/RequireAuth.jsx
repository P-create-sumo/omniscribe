import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";

export default function RequireAuth({ children }) {
  const { isAuthenticated, authError, navigateToLogin } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && authError?.type !== "user_not_registered") {
      navigateToLogin();
    }
  }, [isAuthenticated, authError, navigateToLogin]);

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }
  if (!isAuthenticated) {
    return null;
  }
  return children;
}