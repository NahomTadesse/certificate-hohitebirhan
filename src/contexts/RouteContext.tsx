// contexts/RouteContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Cookies from 'js-cookie';
import { usePathname, useRouter } from 'next/navigation';

interface RouteContextType {
  routes: string[];
  hasAccess: (path: string) => boolean;
  isLoading: boolean;
  setUserRoutes: (routes: string[]) => void;
  routeProtectionEnabled: boolean; 
  toggleRouteProtection: () => void; 
  enableRouteProtection: (enabled: boolean) => void; 
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider = ({ children }: { children: ReactNode }) => {
  const [routes, setRoutes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [routeProtectionEnabled, setRouteProtectionEnabled] = useState(false); 
  const router = useRouter();
  const pathname = usePathname();

  // Initialize from cookies ONCE
  useEffect(() => {
    // Load routes
    const routesCookie = Cookies.get('user_routes');
    if (routesCookie) {
      try {
        const parsedRoutes = JSON.parse(routesCookie);
        setRoutes(parsedRoutes);
      } catch (error) {
        console.error('Failed to parse routes from cookies:', error);
      }
    }

    // Load route protection setting
    const protectionCookie = Cookies.get('route_protection_enabled');
    if (protectionCookie !== undefined) {
      setRouteProtectionEnabled(protectionCookie === 'true');
    }
  }, []); // Empty dependency array - runs only once on mount

  // Update routes function
  const setUserRoutes = (newRoutes: string[]) => {
    setRoutes(newRoutes);
    Cookies.set('user_routes', JSON.stringify(newRoutes), {
      expires: 7,
      secure: true,
      sameSite: 'strict'
    });
  };

  // Toggle route protection
  const toggleRouteProtection = () => {
    const newValue = !routeProtectionEnabled;
    setRouteProtectionEnabled(newValue);
    Cookies.set('route_protection_enabled', newValue.toString(), {
      expires: 7,
      secure: true,
      sameSite: 'strict'
    });
  };

  // Enable/disable route protection
  const enableRouteProtection = (enabled: boolean) => {
    setRouteProtectionEnabled(enabled);
    Cookies.set('route_protection_enabled', enabled.toString(), {
      expires: 7,
      secure: true,
      sameSite: 'strict'
    });
  };

  // Function to check if user has access to a path
  const hasAccess = (path: string): boolean => {
    // If protection is disabled, allow all access
    if (!routeProtectionEnabled) {
      return true;
    }
    
    if (!path || routes.length === 0) {
      return true; // Allow access if no routes defined yet
    }
    
    // Normalize the path
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const pathSegment = normalizedPath.split('/')[0];
    
    // Always allowed routes (core functionality)
    const alwaysAllowed = [
      'dashboard', 
      'profile', 
      'settings', 
      'notifications', 
      'login', 
      'logout',
      'not-found'
    ];
    
    if (alwaysAllowed.includes(pathSegment)) {
      return true;
    }
    
    // Check if any route includes this path segment
    return routes.some(route => {
      const routeSegment = route.startsWith('/') ? route.slice(1) : route;
      return routeSegment.toLowerCase() === pathSegment.toLowerCase();
    });
  };

  // Check current route on path change - but only if protection is enabled
  useEffect(() => {
    if (!routeProtectionEnabled || routes.length === 0 || !pathname) return;
    
    const normalizedPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const pathSegment = normalizedPath.split('/')[0];
    
    const alwaysAllowed = ['dashboard', 'profile', 'settings', 'notifications', 'login', 'logout', 'not-found'];
    
    // Skip check for always allowed routes
    if (alwaysAllowed.includes(pathSegment)) return;
    
    // Check access
    if (!hasAccess(pathname)) {
      router.replace('/not-found');
    }
  }, [pathname, routes, router, routeProtectionEnabled]);

  return (
    <RouteContext.Provider value={{ 
      routes, 
      hasAccess, 
      isLoading, 
      setUserRoutes,
      routeProtectionEnabled, // Add to context
      toggleRouteProtection, // Add to context
      enableRouteProtection // Add to context
    }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoutes = () => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    // Safe default for SSR
    return {
      routes: [],
      hasAccess: () => true,
      isLoading: false,
      setUserRoutes: () => {},
      routeProtectionEnabled: false, // Default disabled
      toggleRouteProtection: () => {},
      enableRouteProtection: () => {},
    };
  }
  return context;
};