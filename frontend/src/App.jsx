import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import ExplorePage from "@/features/explore/ExplorePage";
import DonationReturnPage from "@/features/donate/DonationReturnPage";
import AboutPage from "@/features/about/AboutPage";
import ContactPage from "@/features/contact/ContactPage";

const LoginPage = lazy(() => import("@/features/crm/LoginPage"));
const DashboardPage = lazy(() => import("@/features/crm/DashboardPage"));
const BlocksPage = lazy(() => import("@/features/crm/BlocksPage"));
const BlockEditPage = lazy(() => import("@/features/crm/BlockEditPage"));
const DonationsPage = lazy(() => import("@/features/crm/DonationsPage"));
const SettingsPage = lazy(() => import("@/features/crm/SettingsPage"));
const RequireAdmin = lazy(() => import("@/features/crm/RequireAdmin"));

const queryClient = new QueryClient();

function CrmFallback() {
  return (
    <main className="space-y-4 p-6" aria-label="Loading page">
      <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </main>
  );
}

function CrmRoutes() {
  return (
    <Suspense fallback={<CrmFallback />}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route index element={<DashboardPage />} />
          <Route path="blocks" element={<BlocksPage />} />
          <Route path="blocks/new" element={<BlockEditPage />} />
          <Route path="blocks/:id" element={<BlockEditPage />} />
          <Route path="donations" element={<DonationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<ExplorePage />} />
              <Route path="/f/:floor" element={<ExplorePage />} />
              <Route path="/b/:code" element={<ExplorePage />} />
              <Route path="/donate/return" element={<DonationReturnPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/crm/*" element={<CrmRoutes />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


