import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { AUTH_STORAGE_KEYS } from "../auth.constants";
import type { IAuthSessionContextValue, IAuthUser, ILoginRequest } from "../auth.types";
import {
  login as loginRequest,
  logout as clearSession,
  refreshSession as refreshSessionRequest,
  restoreSession,
} from "../services/loginService";

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
  const sessionOperationIdRef = useRef(0);

  const updateAuthState = useCallback((user: IAuthUser | null) => {
    setAuthState(user ? toAuthenticatedState(user) : toAnonymousState());
  }, []);

  const runSessionOperation = useCallback(
    async (
      loadSession: () => Promise<IAuthUser | null>,
      fallbackToAnonymous = false
    ) => {
      const operationId = sessionOperationIdRef.current + 1;
      sessionOperationIdRef.current = operationId;

      try {
        const user = await loadSession();

        if (sessionOperationIdRef.current === operationId) {
          updateAuthState(user);
        }

        return user;
      } catch (error) {
        if (fallbackToAnonymous && sessionOperationIdRef.current === operationId) {
          updateAuthState(null);
        }

        throw error;
      }
    },
    [updateAuthState]
  );

  const bootstrapSession = useCallback(async () => {
    try {
      await runSessionOperation(restoreSession, true);
    } catch {
      return;
    }
  }, [runSessionOperation]);

  useEffect(() => {
    async function init() {
      await bootstrapSession();
    }
    void init();
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

  const login = useCallback(
    async (request: ILoginRequest) => {
      sessionOperationIdRef.current += 1;
      const operationId = sessionOperationIdRef.current;

      const user = await loginRequest(request);

      if (sessionOperationIdRef.current === operationId) {
        updateAuthState(user);
      }

      return user;
    },
    [updateAuthState]
  );

  const logout = useCallback(() => {
    sessionOperationIdRef.current += 1;
    clearSession();
    updateAuthState(null);
  }, [updateAuthState]);

  const refreshSession = useCallback(
    () => runSessionOperation(refreshSessionRequest),
    [runSessionOperation]
  );

  const value = useMemo(
    () => ({
      status: authState.status,
      isAuthenticated: authState.status === "authenticated",
      isLoading: authState.status === "loading",
      user: authState.user,
      login,
      logout,
      refreshSession,
    }),
    [authState, login, logout, refreshSession]
  );

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  );
}

export function useAuthSession(): IAuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within an AuthSessionProvider");
  }

  return context;
}
