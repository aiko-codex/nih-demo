import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { ChevronDown, Menu } from "lucide-react";
import AppLogo from "@/components/AppLogo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const aboutLinks = [
  { label: "Our mission", href: "/about#mission", hint: "Why the Hub exists" },
  { label: "The building", href: "/about#building", hint: "Five floors, one landmark" },
  { label: "How it works", href: "/about#how", hint: "Light a window in three steps" },
];

const linkClass = ({ isActive }) =>
  `rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
    isActive ? "text-white" : "text-white/65 hover:text-white"
  }`;

function AboutMenu() {
  return (
    <div className="group relative">
      <NavLink to="/about" className={(state) => `${linkClass(state)} inline-flex items-center gap-1`}>
        About us
        <ChevronDown className="size-3.5 opacity-60 transition-transform group-hover:rotate-180" />
      </NavLink>
      <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0
        transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100
        group-hover:visible group-hover:opacity-100">
        <div className="glass-panel rounded-2xl p-1.5">
          {aboutLinks.map((link) => (
            <Link key={link.href} to={link.href} className="block rounded-xl px-3.5 py-2.5 hover:bg-white/8">
              <span className="block text-[13px] text-white">{link.label}</span>
              <span className="block text-xs text-white/50">{link.hint}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMenu({ onDonate }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label="Open menu" className="grid size-9 place-items-center text-white/80 md:hidden">
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="dark w-[min(20rem,88vw)] border-white/10 bg-[#0a0c14] text-white">
        <SheetHeader><SheetTitle><AppLogo /></SheetTitle></SheetHeader>
        <nav className="mt-6 flex flex-col px-4 text-lg">
          <NavLink to="/" end onClick={close} className="border-b border-white/10 py-4">Home</NavLink>
          <NavLink to="/about" onClick={close} className="border-b border-white/10 py-4">About us</NavLink>
          <NavLink to="/contact" onClick={close} className="border-b border-white/10 py-4">Contact us</NavLink>
        </nav>
        <div className="mt-auto p-4">
          <button
            type="button"
            onClick={() => { close(); onDonate(); }}
            className="h-12 w-full rounded-full bg-white text-sm font-medium text-black"
          >
            Light a window
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function SiteNav() {
  const navigate = useNavigate();
  const goToBuilding = () => navigate("/");

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav className="glass-panel mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full pl-5 pr-2">
        <Link to="/" aria-label="National India Hub home" className="text-white"><AppLogo /></Link>
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <AboutMenu />
          <NavLink to="/contact" className={linkClass}>Contact us</NavLink>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={goToBuilding}
            className="hidden h-10 rounded-full bg-white px-5 text-[13px] font-medium text-black transition-colors
              hover:bg-white/90 md:block"
          >
            Light a window
          </button>
          <MobileMenu onDonate={goToBuilding} />
        </div>
      </nav>
    </header>
  );
}
