import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "owner" | "admin" | "warehouse" | "customer-service" | "viewer";

export type AuthUser = {
  isLoggedIn: true;
  role: Role;
  name: string;
  email: string;
  accessToken?: string;
};

type StoredSession = AuthUser | null;

const STORAGE_KEY = "maqil.auth.session";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:3000";

// Dummy accounts — replace with backend call later
const DUMMY_ACCOUNTS: Array<{ email: string; password: string; role: Role; name: string }> = [
  { email: "owner@maqil.id", password: "owner123", role: "owner", name: "Owner" },
  { email: "admin@maqil.id", password: "admin123", role: "admin", name: "Admin" },
  { email: "warehouse@maqil.id", password: "warehouse123", role: "warehouse", name: "Gudang" },
  { email: "cs@maqil.id", password: "cs123", role: "customer-service", name: "Customer Service" },
];

// Permission map: which nav keys each role is allowed to see.
// Keys correspond to `navItems[].url` in `src/lib/nav.ts`.
const ROLE_MENU: Record<Role, string[] | "*"> = {
  owner: "*",
  admin: "*",
  warehouse: ["/dashboard", "/produk", "/gudang"],
  "customer-service": ["/dashboard", "/pesanan"],
  viewer: ["/dashboard"],
};

export function canAccessMenu(role: Role, url: string): boolean {
  const allowed = ROLE_MENU[role];
  if (allowed === "*") return true;
  return allowed.some((prefix) => url === prefix || url.startsWith(prefix + "/"));
}

type AuthContextValue = {
  currentUser: AuthUser | null;
  role: Role | null;
  isAuthenticated: () => boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): StoredSession {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed && parsed.isLoggedIn && parsed.role && parsed.email) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCurrentUser(readSession());
    setHydrated(true);
  }, []);

  const login: AuthContextValue["login"] = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const dummyMatch = DUMMY_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === normalizedEmail && a.password === password,
    );

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { ok: false, error: "Email atau Password salah." };
        }
        throw new Error(`Auth request failed: ${response.status}`);
      }

      const result = (await response.json()) as {
        accessToken: string;
        user: { id: string; name: string | null; email: string };
      };

      const role =
        dummyMatch?.role ??
        (result.user.email.toLowerCase() === "owner@maqil.id" ? "owner" : "viewer");

      const session: AuthUser = {
        isLoggedIn: true,
        role,
        name: result.user.name ?? result.user.email,
        email: result.user.email,
        accessToken: result.accessToken,
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      setCurrentUser(session);
      return { ok: true };
    } catch (error) {
      if (dummyMatch) {
        const session: AuthUser = {
          isLoggedIn: true,
          role: dummyMatch.role,
          name: dummyMatch.name,
          email: dummyMatch.email,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        setCurrentUser(session);
        return { ok: true };
      }
      return { ok: false, error: "Email atau Password salah." };
    }
  };

  const logout = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  };

  const value: AuthContextValue = {
    currentUser,
    role: currentUser?.role ?? null,
    isAuthenticated: () => currentUser !== null,
    login,
    logout,
  };

  // Avoid SSR hydration mismatch on protected areas
  if (!hydrated) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Safe fallback so SSR / early renders don't crash.
    return {
      currentUser: null,
      role: null,
      isAuthenticated: () => false,
      login: async () => ({ ok: false, error: "Auth not ready" }),
      logout: () => {},
    };
  }
  return ctx;
}
