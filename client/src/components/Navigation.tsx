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
            {/* Dashboard */}
            <NavigationMenuItem>
              <Link href="/dashboard">
                <a>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none",
                      isActive('/dashboard') && "bg-white/20"
                    )}
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </NavigationMenuLink>
                </a>
              </Link>
            </NavigationMenuItem>

            {/* Assets */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn(
                "text-white hover:bg-white/10 data-[state=open]:bg-white/20",
                (isActive('/cattle') || isActive('/clients')) && "bg-white/20"
              )}>
                <Beef className="mr-2 h-4 w-4" />
                Assets
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 bg-white">
                  <li>
                    <Link href="/cattle">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none text-plum-900">Cattle Registry</div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Browse all livestock digital twins
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/clients">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none text-plum-900">Client Accounts</div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Manage producer portfolios
                        </p>
                      </a>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Views */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn(
                "text-white hover:bg-white/10 data-[state=open]:bg-white/20",
                (isActive('/farmer') || isActive('/bank')) && "bg-white/20"
              )}>
                <Users className="mr-2 h-4 w-4" />
                Views
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 bg-white">
                  <li>
                    <Link href="/farmer">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none text-plum-900">Farmer View</div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          GPS tracking & herd operations
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/bank">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none text-plum-900">Bank View</div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Risk metrics & iCattle Certified
                        </p>
                      </a>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Intelligence */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className={cn(
                "text-white hover:bg-white/10 data-[state=open]:bg-white/20",
                (isActive('/market') || isActive('/forecast') || isActive('/recommendations') || isActive('/provenance')) && "bg-white/20"
              )}>
                <Brain className="mr-2 h-4 w-4" />
                Intelligence
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 bg-white">
                  <li>
                    <Link href="/market">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <Activity className="h-4 w-4" />
                          Market Data
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Live MLA NLRS pricing
                        </p>
                      </a>
                    </Link>
                  </li>
                  <li>
                    <Link href="/forecast">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <TrendingUp className="h-4 w-4" />
                          Price Forecast
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          ML 7-day predictions
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
                          Provenance
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
                (isActive('/financial') || isActive('/reports')) && "bg-white/20"
              )}>
                <DollarSign className="mr-2 h-4 w-4" />
                Financial
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 bg-white">
                  <li>
                    <Link href="/financial">
                      <a className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-lavender-100 focus:bg-lavender-100">
                        <div className="text-sm font-medium leading-none flex items-center gap-2 text-plum-900">
                          <DollarSign className="h-4 w-4" />
                          Financial Dashboard
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-gray-600">
                          Xero integration & AASB 141
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

            {/* Demo */}
            <NavigationMenuItem>
              <Link href="/demo">
                <a>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors text-white hover:bg-white/10 focus:bg-white/10 focus:outline-none",
                      isActive('/demo') && "bg-white/20"
                    )}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Golden Record Demo
                  </NavigationMenuLink>
                </a>
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
      <div className="md:hidden border-t border-white/10">
        <div className="container flex items-center gap-2 py-2 overflow-x-auto">
          <Link href="/dashboard">
            <a>
              <Button 
                variant={isActive('/dashboard') ? "secondary" : "ghost"} 
                size="sm"
                className={isActive('/dashboard') ? "bg-white/20 text-white hover:bg-white/30" : "text-white hover:bg-white/10"}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </a>
          </Link>
          <Link href="/cattle">
            <a>
              <Button 
                variant={isActive('/cattle') ? "secondary" : "ghost"} 
                size="sm"
                className={isActive('/cattle') ? "bg-white/20 text-white hover:bg-white/30" : "text-white hover:bg-white/10"}
              >
                <Beef className="h-4 w-4 mr-2" />
                Cattle
              </Button>
            </a>
          </Link>
          <Link href="/clients">
            <a>
              <Button 
                variant={isActive('/clients') ? "secondary" : "ghost"} 
                size="sm"
                className={isActive('/clients') ? "bg-white/20 text-white hover:bg-white/30" : "text-white hover:bg-white/10"}
              >
                <Users className="h-4 w-4 mr-2" />
                Clients
              </Button>
            </a>
          </Link>
          <Link href="/financial">
            <a>
              <Button 
                variant={isActive('/financial') ? "secondary" : "ghost"} 
                size="sm"
                className={isActive('/financial') ? "bg-white/20 text-white hover:bg-white/30" : "text-white hover:bg-white/10"}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Financial
              </Button>
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
}
