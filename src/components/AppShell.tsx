"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { ReactNode, useEffect, useState } from "react";
import { toast } from "sonner";

function NavLink({
  href,
  label,
  icon,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));

  const tooltip = collapsed ? label : undefined;
  const disablePrefetch = href.startsWith("/admin");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={tooltip}
      prefetch={disablePrefetch ? false : undefined}
      className={
        "flex items-center gap-2 rounded-xl px-3 py-2 transition-all min-w-0 " +
        (active
          ? "bg-[rgba(245,158,11,0.14)] border border-[rgba(245,158,11,0.25)] text-[hsl(var(--foreground))]"
          : "bg-transparent border border-transparent text-[rgba(255,255,255,0.72)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[hsl(var(--foreground))]")
      }
    >
      <span className={"shrink-0 " + (active ? "text-[hsl(var(--primary))]" : "text-[rgba(255,255,255,0.65)]")}>{icon}</span>
      {collapsed ? null : <span className="truncate text-sm font-semibold">{label}</span>}
    </Link>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  const normalizedPath = pathname !== "/" ? pathname.replace(/\/+$/g, "") : pathname;
  const isAdminArea = normalizedPath === "/admin" || normalizedPath.startsWith("/admin/");
  const isAdminLogin = normalizedPath === "/admin/login";
  const showAdminChrome = isAdminArea && !isAdminLogin;

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      toast.success("Sessão encerrada");
    } catch {
      toast.error("Não foi possível sair");
    } finally {
      // Hard navigation clears any cached /admin RSC payload and forces middleware to re-check cookies.
      window.location.href = "/admin/login";
    }
  }

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileDrawerOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Toaster richColors theme="dark" position="top-right" />

      {!showAdminChrome ? (
        <main className="min-w-0">{children}</main>
      ) : (
        <>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 2xl:px-10">
          <div className="glass glow mt-3 flex items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <Image
                src="/logo-alpha.png"
                alt="Alpha Assessoria"
                width={160}
                height={52}
                priority
                className="h-auto w-[110px] sm:w-[130px] lg:w-[150px]"
              />
              <div className="hidden sm:block min-w-0">
                <div className="text-sm font-bold tracking-tight truncate">Acompanhamento Alpha</div>
                <div className="text-xs text-[rgba(255,255,255,0.65)] truncate">Painéis e sprints</div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="btn-glass inline-flex lg:hidden items-center justify-center h-10 w-10"
                aria-label="Abrir menu"
              >
                <Icon path="M4 6h16M4 12h16M4 18h16" />
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <NavLink
                href="/"
                label="Home"
                icon={<Icon path="M3 10.5L12 3l9 7.5" />}
                collapsed={false}
              />
              <NavLink
                href="/admin"
                label="Admin"
                icon={<Icon path="M3 12l2-2 4 4L19 4l2 2-12 12L3 12z" />}
                collapsed={false}
              />
              <NavLink
                href="/admin/dashboard"
                label="Dashboard"
                icon={<Icon path="M3 3v18h18" />}
                collapsed={false}
              />
              <NavLink
                href="/admin/configuracoes"
                label="Configurações"
                icon={<Icon path="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />}
                collapsed={false}
              />

              {showAdminChrome ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-glass px-4 py-2 font-semibold"
                  title="Sair"
                >
                  Sair
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileDrawerOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[340px] p-4">
            <div className="glass glow h-full p-3 animate-fade-in">
              <div className="flex items-center justify-between gap-3 px-2 py-2">
                <div className="text-sm font-bold">Navegação</div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="btn-glass inline-flex items-center justify-center h-10 w-10"
                  aria-label="Fechar"
                >
                  <Icon path="M6 6l12 12M18 6l-12 12" />
                </button>
              </div>
              <div className="space-y-1">
                <NavLink
                  href="/"
                  label="Home"
                  icon={<Icon path="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" />}
                  onNavigate={() => setMobileDrawerOpen(false)}
                />
                <NavLink href="/admin" label="Admin" icon={<Icon path="M4 4h16v16H4z" />} onNavigate={() => setMobileDrawerOpen(false)} />
                <NavLink
                  href="/admin/dashboard"
                  label="Dashboard"
                  icon={<Icon path="M4 19V5m6 14V9m6 10v-6" />}
                  onNavigate={() => setMobileDrawerOpen(false)}
                />
                <NavLink
                  href="/admin/configuracoes"
                  label="Configurações"
                  icon={<Icon path="M10 3h4l1 3 3 1v4l-3 1-1 3h-4l-1-3-3-1V7l3-1 1-3z" />}
                  onNavigate={() => setMobileDrawerOpen(false)}
                />

                {showAdminChrome ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      void handleLogout();
                    }}
                    className="btn-glass w-full px-3 py-3 text-left font-semibold"
                  >
                    Sair
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Layout */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 2xl:px-10">
        <div className="pt-[92px] sm:pt-[104px] pb-[88px] lg:pb-10">
          <main className="min-w-0 animate-fade-in">{children}</main>
        </div>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
          <div className="glass glow mb-3 grid grid-cols-4 gap-2 p-2">
            <NavLink href="/" label="Home" icon={<Icon path="M3 10.5L12 3l9 7.5" />} />
            <NavLink href="/admin" label="Admin" icon={<Icon path="M4 4h16v16H4z" />} />
            <NavLink href="/admin/dashboard" label="Dash" icon={<Icon path="M4 19V5m6 14V9m6 10v-6" />} />
            <NavLink href="/admin/configuracoes" label="Config" icon={<Icon path="M12 15.5a3.5 3.5 0 1 0 0-7" />} />
          </div>
        </div>
      </nav>
        </>
      )}
    </div>
  );
}
