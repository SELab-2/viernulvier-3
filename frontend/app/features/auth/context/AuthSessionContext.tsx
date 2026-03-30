import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { AUTH_STORAGE_KEYS } from "../auth.constants";
import type { IAuthSessionContextValue, IAuthUser, ILoginRequest } from "../auth.types";
import {
  getCurrentUser,
  login as loginRequest,
  logout as clearSession,
  restoreSession,
} from "../services/loginService";
import { refreshAccessToken } from "../services/tokenRefresh";

type AuthState = {
  status: IAuthSessionContextValue["status"];
  user: IAuthUser | null;
};

const AuthSessionContext = createContext<IAuthSessionContextValue | null>(null);

function toAuthenticatedState(user: IAuthUser): AuthState {
  return { status: "authenticated", user };
}

function toAnonymousState(): AuthState {
  return { status: "anonymous", user: null };
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  const bootstrapSession = useCallback(async () => {
    try {
      const user = await restoreSession();

      setAuthState(user ? toAuthenticatedState(user) : toAnonymousState());
    } catch {
      setAuthState(toAnonymousState());
    }
  }, []);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.key !== null &&
        event.key !== AUTH_STORAGE_KEYS.accessToken &&
        event.key !== AUTH_STORAGE_KEYS.refreshToken
      ) {
        return;
      }

      void bootstrapSession();
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [bootstrapSession]);

  const login = async (request: ILoginRequest) => {
    const user = await loginRequest(request);
    setAuthState(toAuthenticatedState(user));
    return user;
  };

  const logout = () => {
    clearSession();
    setAuthState(toAnonymousState());
  };

  const refreshSession = async () => {
    try {
      await refreshAccessToken();
      const user = await getCurrentUser();
      setAuthState(toAuthenticatedState(user));
      return user;
    } catch {
      clearSession();
      setAuthState(toAnonymousState());
      return null;
    }
  };

  return (
    <AuthSessionContext.Provider
      value={{
        status: authState.status,
        isAuthenticated: authState.status === "authenticated",
        isLoading: authState.status === "loading",
        user: authState.user,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): IAuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within an AuthSessionProvider");
  }

  return context;
}
