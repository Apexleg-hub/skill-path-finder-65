import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from "lucide-react";
import { categories } from "@/data/courses";
import logo from "@/assets/corepoint-tech.jpg";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt="Corepoint Tech Logo" className="h-9 w-auto rounded-md" />
            <span className="font-display text-lg font-bold">Corepoint Tech</span>
          </div>
          <p className="mt-4 text-sm text-ink-foreground/70">
            Practical, instructor-led technology training. One-On-One Classes, Cohort classes, real projects, working
            professionals as trainers.
          </p>
          <div className="mt-5 flex gap-3">
            <a href="https://linkedin.com" aria-label="LinkedIn" className="rounded-md bg-ink-foreground/10 p-2 transition-colors hover:bg-ink-foreground/20">
              <Linkedin className="size-4" />
            </a>
            <a href="https://twitter.com" aria-label="X" className="rounded-md bg-ink-foreground/10 p-2 transition-colors hover:bg-ink-foreground/20">
              <Twitter className="size-4" />
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="rounded-md bg-ink-foreground/10 p-2 transition-colors hover:bg-ink-foreground/20">
              <Instagram className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-foreground/60">
            Quick links
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/courses" className="text-ink-foreground/80 hover:text-ink-foreground">All Courses</Link></li>
            <li><Link to="/about" className="text-ink-foreground/80 hover:text-ink-foreground">About Us</Link></li>
            <li><Link to="/contact" className="text-ink-foreground/80 hover:text-ink-foreground">Contact</Link></li>
            <li><Link to="/register" className="text-ink-foreground/80 hover:text-ink-foreground">Register</Link></li>
            <li><Link to="/register" className="text-ink-foreground/80 hover:text-ink-foreground">Payment Plan</Link></li>
            <li><Link to="/register" className="text-ink-foreground/80 hover:text-ink-foreground">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-foreground/60">
            Categories
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  to="/courses"
                  search={{ category: c.id }}
                  className="text-ink-foreground/80 hover:text-ink-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-foreground/60">
            Get in touch
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-foreground/80">
            <li className="flex gap-2"><Phone className="size-4 shrink-0" /> +234 911 575 1406</li>
            <li className="flex gap-2"><Mail className="size-4 shrink-0" /> info@corepointtech.com.ng</li>
            <li className="flex gap-2"><MapPin className="size-4 shrink-0" /> Shomolu, Lagos Nigeria</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 text-xs text-ink-foreground/60">
          <p>© {new Date().getFullYear()} Corepoint Tech Academy. All rights reserved.</p>
          <p className="text-right">Owned and Managed by Equaline Limited</p>
        </div>
      </div>
    </footer>
  );
}