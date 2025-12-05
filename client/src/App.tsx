import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LandingPage } from "@/pages/LandingPage";
import { HomeDashboard } from "@/pages/HomeDashboard";
import { Cattle } from "@/pages/Cattle";
import { Clients } from "@/pages/Clients";
import { Reports } from "@/pages/Reports";
import { FarmerView } from "@/pages/FarmerView";
import { BankView } from "@/pages/BankView";
import { CattleDetail } from "@/pages/CattleDetail";
import { ClientDetail } from "@/pages/ClientDetail";
import { MarketData } from "./pages/MarketData";
import PriceForecast from "./pages/PriceForecast";
import PortfolioRecommendations from "./pages/PortfolioRecommendations";
import Provenance from "./pages/Provenance";
import FinancialDashboard from "./pages/FinancialDashboard";
import { DemoGoldenRecord } from "./pages/DemoGoldenRecord";
import { GoldenRecordDetail } from "./pages/GoldenRecordDetail";
import { Navigation } from "./components/Navigation";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={LandingPage} />
      <Route path="/dashboard" component={HomeDashboard} />
        <Route path="/cattle" component={Cattle} />
      <Route path="/clients" component={Clients} />
      <Route path="/reports" component={Reports} />
      <Route path="/farmer" component={FarmerView} />
      <Route path="/bank" component={BankView} />
      <Route path="/cattle/:id" component={CattleDetail} />
      <Route path="/clients/:id" component={ClientDetail} />
        <Route path="/market" component={MarketData} />
      <Route path="/forecast" component={PriceForecast} />
      <Route path="/recommendations" component={PortfolioRecommendations} />
      <Route path="/provenance" component={Provenance} />
      <Route path="/financial" component={FinancialDashboard} />
      <Route path="/demo" component={DemoGoldenRecord} />
      <Route path="/golden-record/:id" component={GoldenRecordDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Navigation />
          <main className="min-h-screen">
            <Router />
          </main>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
