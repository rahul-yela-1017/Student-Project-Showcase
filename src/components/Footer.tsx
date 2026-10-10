import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/Logo";
import { INSTITUTE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            A centralized platform for {INSTITUTE.name} students to publish
            academic projects, share technical skills, and discover innovative
            work from their peers.
          </p>
          <p className="text-xs text-muted">
            {INSTITUTE.course} · {INSTITUTE.department}
            <br />
            Batch {INSTITUTE.batch} · Section {INSTITUTE.section}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold tracking-wide text-ink">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="text-muted transition hover:text-primary" href="/explore">Explore Projects</Link></li>
            <li><Link className="text-muted transition hover:text-primary" href="/#categories">Categories</Link></li>
            <li><Link className="text-muted transition hover:text-primary" href="/students">Students</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold tracking-wide text-ink">Account</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="text-muted transition hover:text-primary" href="/login">Student Login</Link></li>
            <li><Link className="text-muted transition hover:text-primary" href="/dashboard">Dashboard</Link></li>
            <li><Link className="text-muted transition hover:text-primary" href="/change-password">Change Password</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-bold tracking-wide text-ink">Contact</h3>
          <ul className="space-y-2.5 text-sm text-muted">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              projectshowcase@{INSTITUTE.emailDomain}
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              Malla Reddy Vishwavidyapeeth, Maisammaguda,
              <br />
              Dullapally, Medchal, Telangana, 500100
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
              8978356798
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {INSTITUTE.name} — Student Project
            Showcase
          </p>
          <p>Built by CSE (AI &amp; ML), Section {INSTITUTE.section}</p>
        </div>
      </div>
    </footer>
  );
}
