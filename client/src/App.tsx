import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import DietPlans from "@/pages/diet-plans";
import FoodDatabase from "@/pages/food-database";
import FoodDetail from "@/pages/food-detail";
import HealthCalculator from "@/pages/health-calculator";
import ClientsPage from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import SubscriptionPage from "@/pages/subscription";
import CheckoutPage from "@/pages/subscription/checkout";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import AdminDashboard from "@/pages/admin";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  const [location] = useLocation();
  
  // Auth sayfaları için Layout'u devre dışı bırak
  const isAuthPage = location === "/login" || location === "/register";
  
  // Auth sayfaları için doğrudan component renderla, diğerleri için Layout içinde renderla
  if (isAuthPage) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
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
        <Route path="/food-database" component={FoodDatabase} />
        <Route path="/food/:id" component={FoodDetail} />
        <Route path="/health-calculator" component={HealthCalculator} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/subscription" component={SubscriptionPage} />
        <Route path="/subscription/checkout" component={CheckoutPage} />
        <Route path="/admin" component={AdminDashboard} />
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
