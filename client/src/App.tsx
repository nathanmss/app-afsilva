import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Finance from "@/pages/Finance";
import Invoices from "@/pages/Invoices";
import Employees from "@/pages/Employees";
import Vehicles from "@/pages/Vehicles";
import Loadings from "@/pages/Loadings";
import CompanyProfile from "@/pages/CompanyProfile";
import { Loader2 } from "lucide-react";
import { USER_ROLES } from "@shared/schema";

// Protected Route wrapper
function ProtectedRoute({
  component: Component,
  allowedRoles,
  fallbackPath = "/loadings",
}: {
  component: React.ComponentType;
  allowedRoles?: Array<keyof typeof USER_ROLES>;
  fallbackPath?: string;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as keyof typeof USER_ROLES)) {
    return <Redirect to={fallbackPath} />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        <ProtectedRoute component={Dashboard} allowedRoles={["ADMIN"]} />
      </Route>
      <Route path="/finance">
        <ProtectedRoute component={Finance} allowedRoles={["ADMIN"]} />
      </Route>
      <Route path="/invoices">
        <ProtectedRoute component={Invoices} allowedRoles={["ADMIN"]} />
      </Route>
      <Route path="/employees">
        <ProtectedRoute component={Employees} allowedRoles={["ADMIN"]} />
      </Route>
      <Route path="/vehicles">
        <ProtectedRoute component={Vehicles} allowedRoles={["ADMIN"]} />
      </Route>
      <Route path="/loadings">
        <ProtectedRoute component={Loadings} allowedRoles={["ADMIN", "OPERATOR"]} />
      </Route>
      <Route path="/company-profile">
        <ProtectedRoute component={CompanyProfile} allowedRoles={["ADMIN"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
