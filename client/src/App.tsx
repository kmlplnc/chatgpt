import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import DietPlans from "@/pages/diet-plans";
import CreateAIDietPlan from "@/pages/diet-plans/create-ai";
import FoodDatabase from "@/pages/food-database";
import FoodDetail from "@/pages/food-detail";
import HealthCalculator from "@/pages/health-calculator";
import ClientsPage from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import Messages from "@/pages/messages";
import SubscriptionPage from "@/pages/subscription";
import CheckoutPage from "@/pages/subscription/checkout";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import AdminDashboard from "@/pages/admin";
import ClientPortalLogin from "@/pages/client-portal";
import ClientPortalDashboard from "@/pages/client-portal/dashboard";
import ClientPortalMessages from "@/pages/client-portal/messages";
import { AuthProvider } from "@/hooks/use-auth";
import SettingsPage from "@/pages/settings";

function Router() {
  const [location] = useLocation();
  
  // Auth sayfaları ve Danışan portalı için Layout'u devre dışı bırak
  const isAuthPage = location === "/login" || location === "/register";
  const isClientPortal = location.startsWith("/client-portal");
  
  // Auth sayfaları için doğrudan component renderla
  if (isAuthPage) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Danışan portalı sayfaları için doğrudan component renderla
  if (isClientPortal) {
    return (
      <Switch>
        <Route path="/client-portal" component={ClientPortalLogin} />
        <Route path="/client-portal/dashboard" component={ClientPortalDashboard} />
        <Route path="/client-portal/messages" component={ClientPortalMessages} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Ana uygulama sayfaları için Layout içinde renderla
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/diet-plans" component={DietPlans} />
        <Route path="/diet-plans/create-ai" component={CreateAIDietPlan} />
        <Route path="/food-database" component={FoodDatabase} />
        <Route path="/food/:id" component={FoodDetail} />
        <Route path="/health-calculator" component={HealthCalculator} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/messages" component={Messages} />
        <Route path="/subscription" component={SubscriptionPage} />
        <Route path="/subscription/checkout" component={CheckoutPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
