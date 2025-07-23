import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home } from "@/pages/Home";
import { Account } from "@/pages/Account";
import { Inventory } from "@/pages/Inventory";
import { Checkout } from "@/pages/Checkout";
import { SafetyGuide } from "@/pages/SafetyGuide";
import { InstallationGuide } from "@/pages/InstallationGuide";
import { StorageChecklist } from "@/pages/StorageChecklist";
import { Admin } from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/account" component={Account} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/safety-guide" component={SafetyGuide} />
      <Route path="/installation-guide" component={InstallationGuide} />
      <Route path="/storage-checklist" component={StorageChecklist} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
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
