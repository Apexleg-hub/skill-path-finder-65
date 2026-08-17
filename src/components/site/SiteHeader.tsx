import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/courses";
import logo from "@/assets/corepoint-tech.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Corepoint Tech Logo" className="h-9 w-auto" />
          <span className="font-display text-lg font-bold tracking-tight">
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
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            <Link to="/" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
              Home
            </Link>
            <Link to="/courses" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
              All Courses
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to="/courses"
                search={{ category: cat.id }}
                onClick={() => setOpen(false)}
                className="py-1.5 pl-4 text-sm text-muted-foreground"
              >
                {cat.name}
              </Link>
            ))}
            <Link to="/about" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
              About
            </Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="py-2 text-sm font-medium">
              Contact
            </Link>
            <Button asChild variant="cta" className="mt-2">
              <Link to="/register" onClick={() => setOpen(false)}>
                Register Now
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}