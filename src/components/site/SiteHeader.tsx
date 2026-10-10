import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  BookOpen,
  CreditCard,
  Home,
  Info,
  Newspaper,
  PhoneCall,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/courses";
import logo from "@/assets/corepoint-tech.jpg";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/blog", label: "Blog", icon: Newspaper },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/payment-plans-and-faqs", label: "Payment Plans", icon: CreditCard },
] as const;

const mobileNavLinks = [
  { to: "/", label: "Home", icon: Home },
  ...navLinks.slice(1).map((link) => ({
    ...link,
    icon: link.to === "/about" ? Info : link.to === "/contact" ? PhoneCall : link.icon,
  })),
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
    setCoursesOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setCoursesOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2" onClick={closeMenu}>
          <img src={logo} alt="Corepoint Tech Logo" className="h-9 w-auto shrink-0 rounded-md" />
          <span className="truncate font-display text-base font-bold tracking-tight sm:text-lg">
            Corepoint <span className="text-primary">Tech</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground" }}
          >
            Home
          </Link>

          <div className="group relative">
            <Link
              to="/courses"
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Courses <ChevronDown className="size-3.5" />
            </Link>
            <div className="invisible absolute left-0 top-full w-64 translate-y-1 rounded-xl border border-border bg-popover p-2 opacity-0 shadow-lift transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to="/courses"
                  search={{ category: cat.id }}
                  className="block rounded-md px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-secondary"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {navLinks.slice(1).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild variant="cta" size="sm">
            <Link to="/register">Register Now</Link>
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-16 border-t border-border bg-background shadow-lift md:hidden">
          <nav className="mx-auto flex max-h-[calc(100dvh-4rem)] max-w-6xl flex-col gap-1 overflow-y-auto px-4 py-4">
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-secondary" }}
            >
              <Home className="size-4 text-primary" />
              Home
            </Link>

            <div className="rounded-md border border-border bg-card">
              <button
                type="button"
                aria-expanded={coursesOpen}
                aria-controls="mobile-courses-menu"
                onClick={() => setCoursesOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm font-semibold text-foreground"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  All Courses
                </span>
                <ChevronDown
                  className={`size-4 transition-transform ${coursesOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                id="mobile-courses-menu"
                className={`grid overflow-hidden transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${
                  coursesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="min-h-0 border-t border-border px-3 pb-3">
                  <Link
                    to="/courses"
                    onClick={closeMenu}
                    className="mt-2 block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    All Courses
                  </Link>
                  <div className="mt-1 grid gap-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to="/courses"
                        search={{ category: cat.id }}
                        onClick={closeMenu}
                        className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {mobileNavLinks.slice(1).map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className="flex items-center gap-2 rounded-md px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                  activeProps={{ className: "bg-secondary" }}
                >
                  <Icon className="size-4 text-primary" />
                  {link.label}
                </Link>
              );
            })}

            <Button asChild variant="cta" className="mt-2">
              <Link to="/register" onClick={closeMenu}>
                Register Now
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
