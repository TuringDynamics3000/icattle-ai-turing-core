import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
  Home, 
  Beef, 
  Users, 
  FileText, 
  TrendingUp, 
  Shield, 
  DollarSign,
  Brain,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';

export function Navigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img src="/icattle-logo.png" alt="iCattle" className="h-20 w-20" />
            <span className="text-xl font-bold">iCattle</span>
          </div>
        </Link>

        {/* Main Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Dashboard */}
            <NavigationMenuItem>
              <Link href="/">
                <NavigationMenuLink
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                    isActive('/') && location === '/' && "bg-accent"
                  )}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            {/* Assets */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={isActive('/cattle') || isActive('/clients') ? "bg-accent" : ""}>
                <Beef className="mr-2 h-4 w-4" />
                Assets
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <Link href="/cattle">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Cattle Registry</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Browse all livestock digital twins
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/clients">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Client Accounts</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Manage producer portfolios
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Views */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={isActive('/farmer') || isActive('/bank') ? "bg-accent" : ""}>
                <Users className="mr-2 h-4 w-4" />
                Views
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <Link href="/farmer">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Farmer View</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          GPS tracking & herd operations
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/bank">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Bank View</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Risk metrics & iCattle Certified
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Intelligence */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={isActive('/market') || isActive('/forecast') || isActive('/recommendations') || isActive('/provenance') ? "bg-accent" : ""}>
                <Brain className="mr-2 h-4 w-4" />
                Intelligence
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <Link href="/market">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Market Data
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Live MLA NLRS pricing
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/forecast">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Price Forecast
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          ML 7-day predictions
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/recommendations">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI Recommendations
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Portfolio optimization
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/provenance">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Provenance
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Turing Protocol & fraud detection
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Financial */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={isActive('/financial') || isActive('/reports') ? "bg-accent" : ""}>
                <DollarSign className="mr-2 h-4 w-4" />
                Financial
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <Link href="/financial">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Financial Dashboard
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Xero integration & AASB 141
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                  <li>
                    <Link href="/reports">
                      <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Financial Reports
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Bank-grade reporting
                        </p>
                      </NavigationMenuLink>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Demo */}
            <NavigationMenuItem>
              <Link href="/demo">
                <NavigationMenuLink
                  className={cn(
                    "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                    isActive('/demo') && "bg-accent"
                  )}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Golden Record Demo
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t">
        <div className="container flex items-center gap-2 py-2 overflow-x-auto">
          <Link href="/">
            <Button variant={isActive('/') && location === '/' ? "default" : "ghost"} size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
          <Link href="/cattle">
            <Button variant={isActive('/cattle') ? "default" : "ghost"} size="sm">
              <Beef className="h-4 w-4 mr-2" />
              Cattle
            </Button>
          </Link>
          <Link href="/clients">
            <Button variant={isActive('/clients') ? "default" : "ghost"} size="sm">
              <Users className="h-4 w-4 mr-2" />
              Clients
            </Button>
          </Link>
          <Link href="/financial">
            <Button variant={isActive('/financial') ? "default" : "ghost"} size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Financial
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
