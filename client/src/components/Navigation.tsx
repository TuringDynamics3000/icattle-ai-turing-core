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
  Activity,
  MapPin,
  Building2
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
    <header className="sticky top-0 z-50 w-full bg-gradient-purple-deep shadow-soft-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center gap-3 cursor-pointer">
            <img src="/icattle-logo.png" alt="iCattle" className="h-10 w-10" />
            <span className="text-xl font-bold text-white">iCattle</span>
          </a>
        </Link>

        {/* Main Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {/* Home */}
            <NavigationMenuItem>
              <Link href="/demo">
                <a>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none",
                      isActive('/demo') && "bg-white/20"
                    )}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </NavigationMenuLink>
                </a>
              </Link>
            </NavigationMenuItem>

            {/* Livestock */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn(
                "text-white hover:bg-white/10 data-[state=open]:bg-white/20",
                (isActive('/cattle') || isActive('/farmer') || isActive('/clients')) && "bg-white/20"
              )}>
                <Beef className="mr-2 h-4 w-4" />
                Livestock
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 bg-white">
                  <li>
                    <Link href="/cattle">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <Beef className="h-4 w-4" />
                          Cattle Registry
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Browse all livestock digital twins
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/farmer">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <MapPin className="h-4 w-4" />
                          Farmer View
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          GPS tracking & herd operations
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/clients">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <Users className="h-4 w-4" />
                          Client Accounts
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Manage producer portfolios
                        </p>
                      </a>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Market Intelligence */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn(
                "text-white hover:bg-white/10 data-[state=open]:bg-white/20",
                (isActive('/market') || isActive('/forecast') || isActive('/recommendations') || isActive('/provenance')) && "bg-white/20"
              )}>
                <Brain className="mr-2 h-4 w-4" />
                Market Intelligence
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 bg-white">
                  <li>
                    <Link href="/market">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <Activity className="h-4 w-4" />
                          Live Prices & Forecasts
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          MLA NLRS data + ML predictions
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/recommendations">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <Brain className="h-4 w-4" />
                          AI Recommendations
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Portfolio optimization
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/provenance">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <Shield className="h-4 w-4" />
                          Provenance Verification
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Turing Protocol & fraud detection
                        </p>
                      </a>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Financial */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn(
                "text-white hover:bg-white/10 data-[state=open]:bg-white/20",
                (isActive('/bank') || isActive('/financial') || isActive('/reports')) && "bg-white/20"
              )}>
                <DollarSign className="mr-2 h-4 w-4" />
                Financial
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 bg-white">
                  <li>
                    <Link href="/bank">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <Building2 className="h-4 w-4" />
                          Bank View
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Risk metrics & iCattle Certified
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/financial">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <DollarSign className="h-4 w-4" />
                          Xero Integration
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          AASB 141 compliance dashboard
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/reports">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <FileText className="h-4 w-4" />
                          Financial Reports
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Bank-grade reporting
                        </p>
                      </a>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-white/10">
        <div className="container flex items-center gap-2 py-2 overflow-x-auto">
          <Link href="/demo">
            <a className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              isActive('/demo') ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            )}>
              <Home className="h-4 w-4" />
              Home
            </a>
          </Link>
          <Link href="/cattle">
            <a className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              isActive('/cattle') ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            )}>
              <Beef className="h-4 w-4" />
              Cattle
            </a>
          </Link>
          <Link href="/farmer">
            <a className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              isActive('/farmer') ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            )}>
              <MapPin className="h-4 w-4" />
              Farmer
            </a>
          </Link>
          <Link href="/market">
            <a className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              isActive('/market') ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            )}>
              <Activity className="h-4 w-4" />
              Market
            </a>
          </Link>
          <Link href="/bank">
            <a className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
              isActive('/bank') ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
            )}>
              <Building2 className="h-4 w-4" />
              Bank
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
}
