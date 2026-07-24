import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import {
  Box,
  Eye,
  EyeOff,
  LineChart,
  Loader2,
  LogIn,
  Mail,
  Lock,
  Moon,
  ShoppingCart,
  Sun,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — MAQIL.ERP" },
      { name: "description", content: "Halaman login MAQIL.ERP." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

type LoginForm = { email: string; password: string; remember: boolean };

const FEATURES = [
  {
    icon: Box,
    title: "Kelola Produk",
    desc: "Manajemen produk dan stok secara real-time.",
  },
  {
    icon: ShoppingCart,
    title: "Kelola Pesanan",
    desc: "Sinkronisasi seluruh marketplace.",
  },
  {
    icon: Warehouse,
    title: "Kelola Gudang",
    desc: "Stock, mutasi, opname, dan histori.",
  },
  {
    icon: LineChart,
    title: "Laporan Lengkap",
    desc: "Analisa bisnis dan performa marketplace.",
  },
];

const DEMO_ACCOUNTS = [
  { role: "Owner", email: "owner@maqil.id", password: "owner123" },
  { role: "Admin", email: "admin@maqil.id", password: "admin123" },
  { role: "Warehouse", email: "warehouse@maqil.id", password: "warehouse123" },
  { role: "Customer Service", email: "cs@maqil.id", password: "cs123" },
];

const THEME_KEY = "maqil.theme";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as "light" | "dark" | null) ?? "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  return { theme, toggle };
}

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggle } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: "", password: "", remember: true },
  });

  const remember = watch("remember");

  const onSubmit = async (values: LoginForm) => {
    const res = await login(values.email, values.password, values.remember);
    if (!res.ok) {
      toast.error(res.error ?? "Email atau Password salah.");
      return;
    }
    toast.success("Berhasil masuk. Selamat datang!");
    navigate({ to: "/dashboard", replace: true });
  };

  const fillDemo = (email: string, password: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0F172A]">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggle}
        className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white/90 px-3.5 py-2 text-xs font-medium text-[#0F172A] shadow-sm backdrop-blur transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span>Tema</span>
      </button>

      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[40%_60%] lg:grid-cols-2">
        {/* LEFT: Hero */}
        <aside
          className="relative hidden overflow-hidden md:flex md:flex-col md:justify-between md:p-10 lg:p-12"
          style={{
            background:
              "linear-gradient(135deg, #0F172A 0%, #14224a 45%, #2563EB 100%)",
          }}
        >
          {/* glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-[#2563EB] opacity-40 blur-[120px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#3b82f6] opacity-30 blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Logo */}
          <div className="relative flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl font-black text-white shadow-lg backdrop-blur">
              M
            </div>
            <div className="text-white">
              <div className="text-xl font-bold tracking-tight">MAQIL.ERP</div>
              <div className="text-xs opacity-70">Internal ERP System</div>
            </div>
          </div>

          {/* Hero content */}
          <div className="relative text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight lg:text-5xl">
              Kelola Bisnis Marketplace Anda dengan{" "}
              <span className="bg-gradient-to-r from-[#60A5FA] to-[#93C5FD] bg-clip-text text-transparent">
                Mudah
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 lg:text-base">
              Sistem ERP terintegrasi untuk mengelola produk, pesanan, gudang,
              dan marketplace dalam satu platform.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#2563EB]/30 text-white ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">
                      {f.title}
                    </div>
                    <div className="mt-0.5 text-xs leading-snug text-white/60">
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative text-xs text-white/50">
            © {new Date().getFullYear()} MAQIL.ERP — All rights reserved.
          </div>
        </aside>

        {/* RIGHT: Card */}
        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[520px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Floating logo */}
            <div className="mb-[-32px] flex justify-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#0F172A] text-2xl font-black text-white shadow-lg ring-4 ring-white dark:ring-[#0F172A]">
                M
              </div>
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-8 pt-12 shadow-xl transition-shadow duration-200 hover:shadow-2xl dark:border-white/10 dark:bg-white/[0.03] sm:p-10 sm:pt-14">
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] dark:text-white">
                  Selamat Datang Kembali
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-white/60">
                  Masuk menggunakan akun Anda untuk melanjutkan.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#0F172A] dark:text-white">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Masukkan email Anda"
                      autoComplete="email"
                      className={cn(
                        "h-11 pl-10 border-[#E5E7EB] transition-all duration-200 focus-visible:ring-[#2563EB]/30 dark:border-white/10 dark:bg-white/5",
                        errors.email && "border-destructive",
                      )}
                      aria-invalid={!!errors.email}
                      {...register("email", { required: "Email wajib diisi." })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-[#0F172A] dark:text-white">
                      Kata Sandi
                    </Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-[#2563EB] hover:underline"
                    >
                      Lupa password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi"
                      autoComplete="current-password"
                      className={cn(
                        "h-11 pl-10 pr-10 border-[#E5E7EB] transition-all duration-200 focus-visible:ring-[#2563EB]/30 dark:border-white/10 dark:bg-white/5",
                        errors.password && "border-destructive",
                      )}
                      aria-invalid={!!errors.password}
                      {...register("password", { required: "Password wajib diisi." })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 transition-colors hover:text-[#0F172A] dark:hover:text-white"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setValue("remember", v === true)}
                    className="data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
                  />
                  <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm font-normal text-slate-600 dark:text-white/70"
                  >
                    Ingat saya
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="group h-11 w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-md transition-all duration-200 hover:from-[#1D4ED8] hover:to-[#1E3A8A] hover:shadow-lg disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogIn className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                  Masuk
                </Button>
              </form>

              {/* Demo accounts */}
              <div className="mt-6 rounded-2xl border border-dashed border-[#E5E7EB] bg-[#F8FAFC] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#0F172A] dark:text-white">
                    Akun Demo
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">
                    Klik untuk isi
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => fillDemo(acc.email, acc.password)}
                      className="group rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2563EB]/40 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2563EB]">
                        {acc.role}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-slate-600 dark:text-white/70">
                        {acc.email}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-white/60">
              Belum punya akun?{" "}
              <span className="font-semibold text-[#2563EB]">
                Hubungi Administrator
              </span>{" "}
              Anda.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
