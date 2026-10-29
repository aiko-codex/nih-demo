import { NavLink, Outlet, useNavigate } from "react-router";
import { useState } from "react";
import {
  Blocks,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ThemeToggle from "@/components/ThemeToggle";
import AppLogo from "@/components/AppLogo";
import { useLogout } from "./useAdmin";

const links = [
  ["Dashboard", "/crm", LayoutDashboard],
  ["Blocks", "/crm/blocks", Blocks],
  ["Donations", "/crm/donations", HandCoins],
  ["Settings", "/crm/settings", Settings],
];
function Nav({ close }) {
  const logout = useLogout();
  const navigate = useNavigate();
  return (
    <nav className="flex flex-col gap-1 p-3">
      {links.map(([label, to, Icon]) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/crm"}
          onClick={close}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`
          }
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
      <a
        href="/"
        className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted"
      >
        <ExternalLink className="size-4" />
        View site
      </a>
      <Button
        variant="ghost"
        className="justify-start"
        onClick={() =>
          logout.mutate(undefined, { onSettled: () => navigate("/crm/login") })
        }
      >
        <LogOut className="mr-3 size-4" />
        Log out
      </Button>
    </nav>
  );
}
export default function CrmLayout() {
  const [open, setOpen] = useState(false);
  const parts = window.location.pathname.split("/").filter(Boolean);
  const label =
    parts.length < 2
      ? "Dashboard"
      : parts[1] === "blocks"
        ? "Blocks"
        : parts[1] === "donations"
          ? "Donations"
          : "Settings";
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r md:block">
        <div className="p-5">
          <AppLogo />
        </div>
        <Nav />
      </aside>
      <div className="min-w-0">
        <header className="flex h-16 items-center gap-3 border-b px-4 md:px-7">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-5">
                <AppLogo />
              </div>
              <Nav close={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>CRM</BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
