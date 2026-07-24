import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "owner" | "admin" | "warehouse" | "customer-service" | "viewer";

export type AuthUser = {
  isLoggedIn: true;
  role: Role;
  name: string;
  email: string;
};

type StoredSession = AuthUser | null;

const STORAGE_KEY = "maqil.auth.session";

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
    // TODO: replace with `POST /auth/login` to NestJS backend.
    const match = DUMMY_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (!match) return { ok: false, error: "Email atau Password salah." };

    const session: AuthUser = {
      isLoggedIn: true,
      role: match.role,
      name: match.name,
      email: match.email,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setCurrentUser(session);
    return { ok: true };
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
