import { Link } from "react-router";
import AppLogo from "@/components/AppLogo";
import { homeCopy } from "@/features/home/homeCopy";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "About us", to: "/about" },
  { label: "Contact us", to: "/contact" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 px-6 pb-10 pt-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 sm:flex-row sm:justify-between">
        <div className="space-y-3">
          <AppLogo />
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">{homeCopy.address}</p>
          <a href={`mailto:${homeCopy.email}`} className="text-sm text-white/80 hover:text-primary">
            {homeCopy.email}
          </a>
        </div>
        <nav className="flex gap-8 text-sm">
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-muted-foreground hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-12 max-w-6xl text-xs text-muted-foreground">
        © {new Date().getFullYear()} National India Hub
      </p>
    </footer>
  );
}
