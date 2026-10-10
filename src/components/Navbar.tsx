"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, Plus, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { useAuth } from "@/context/AuthContext";
import { cn, initials } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore Projects" },
  { href: "/#categories", label: "Categories" },
  { href: "/students", label: "Students" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Link href="/" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                isActive(l.href)
                  ? "bg-primary/8 text-primary"
                  : "text-body hover:bg-slate-100",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user && !loading ? (
            <>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1 pr-3 pl-1 transition hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initials(user.name)}
                  </span>
                  <span className="max-w-32 truncate text-sm font-semibold text-body">
                    {user.name.split(" ")[0]}
                  </span>
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      role="menu"
                      className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-xl shadow-slate-900/10"
                    >
                      <div className="border-b border-line px-3.5 py-2.5">
                        <p className="truncate text-sm font-semibold text-body">{user.name}</p>
                        <p className="truncate text-xs text-muted">{user.rollNumber}</p>
                      </div>
                      <Link
                        role="menuitem"
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-body hover:bg-slate-50"
                      >
                        <LayoutDashboard className="size-4 text-muted" /> Dashboard
                      </Link>
                      <Link
                        role="menuitem"
                        href="/profile"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-body hover:bg-slate-50"
                      >
                        <Plus className="size-4 rotate-45 text-muted" /> My Profile
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          role="menuitem"
                          href="/admin"
                          className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-body hover:bg-slate-50"
                        >
                          <ShieldAdminIcon /> Admin Panel
                        </Link>
                      )}
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-danger hover:bg-red-50"
                      >
                        <LogOut className="size-4" /> Log out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button size="sm" onClick={() => router.push("/projects/new")}>
                <Plus className="size-4" /> New Project
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => router.push(user ? "/dashboard" : "/login")}>
                Get Started
              </Button>
            </>
          )}
        </div>

        <button
          className="flex size-11 items-center justify-center rounded-lg text-body hover:bg-slate-100 lg:hidden focus-visible:outline-2 focus-visible:outline-primary"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-line bg-white lg:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              {LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive(l.href)
                      ? "bg-primary/8 text-primary"
                      : "text-body hover:bg-slate-50",
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-2">
                {user && !loading ? (
                  <>
                    <Button
                      variant="outline"
                      size="md"
                      className="flex-1"
                      onClick={() => router.push("/dashboard")}
                    >
                      Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      className="flex-1 text-danger"
                      onClick={handleLogout}
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="md"
                      className="flex-1"
                      onClick={() => router.push("/login")}
                    >
                      Login
                    </Button>
                    <Button
                      size="md"
                      className="flex-1"
                      onClick={() => router.push("/login")}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function ShieldAdminIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 text-muted"
      aria-hidden
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
