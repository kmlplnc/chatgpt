import { Switch, Route } from "wouter";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/diet-plans" component={DietPlans} />
      <Route path="/food-database" component={FoodDatabase} />
      <Route path="/food/:id" component={FoodDetail} />
      <Route path="/health-calculator" component={HealthCalculator} />
      <Route path="/clients" component={ClientsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Layout>
          <Router />
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
