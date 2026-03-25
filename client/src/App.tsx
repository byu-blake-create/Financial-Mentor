import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// Layout
import { Sidebar, MobileHeader, MobileNav } from "@/components/layout/Sidebar";

// Pages
import Dashboard from "@/pages/Dashboard";
import Budget from "@/pages/Budget";
import Modules from "@/pages/Modules";
import ModuleDetail from "@/pages/ModuleDetail";
import Chat from "@/pages/Chat";
import Transactions from "@/pages/Transactions";
import FinancialGoals from "@/pages/FinancialGoals";
import EditProfileInformation from "@/pages/EditProfileInformation";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileHeader />
      <main className="md:pl-72 flex flex-col min-h-screen pb-16 md:pb-0">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user && location !== "/auth") {
      setLocation("/auth");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Loading Prosper AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <ProtectedLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/budget" component={Budget} />
        <Route path="/modules/:id" component={ModuleDetail} />
        <Route path="/modules" component={Modules} />
        <Route path="/chat" component={Chat} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/goals" component={FinancialGoals} />
        <Route path="/edit-profile" component={EditProfileInformation} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
