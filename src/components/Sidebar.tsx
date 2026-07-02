

"use client";

import Header from "./Header"; 
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Route,
  Truck,
  User,
  Building,
  Receipt,
  ShipWheelIcon,
  TruckIcon,
  ChevronDown,
  Users,
  Package,
  Calendar,
  GitGraphIcon,
  TrafficConeIcon,
  Landmark,
  FileText,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useNavigate } from "@/hooks/useNavigate";
import { useRoutes } from "@/contexts/RouteContext";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import i18next from "@/services/i18next";
import { PRIMARY_COLOR,SECONDARY_COLOR } from "./colors";


interface SubMenuItem {
  label: string;
  path: string;
  type: "view" | "add";
}

interface MenuItem {
  label: string;
  icon: any;
  path: string;
  subMenu?: SubMenuItem[];
  allowedRoles?: string[];
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

// Base menu configuration
const baseMenu: MenuSection[] = [
  {
    section: "DASHBOARD",
    items: [{ label: "Overview", icon: LayoutDashboard, path: "dashboard" }],
  },
  {
    section: "MANAGEMENT",
    items: [
     

      {
        label: "Diocese",
        icon: Landmark,
        path: "dioceses",
        subMenu: [
          { label: "Diocese Management", path: "dioceses", type: "view" },
        ],
      },

      {
        label: "Church",
        icon: Users,
        path: "churches",
        subMenu: [
          { label: "Church Managment", path: "churches", type: "view" },
          // { label: "Add Organization", path: "organization/add", type: "add" },
        ],
      },

 



      {
        label: "Children",
        icon: Truck,
        path: "children",
        subMenu: [
          { label: "Children Management", path: "children", type: "view" },
          // { label: "Add Vehicle", path: "vehicle/add", type: "add" },
          // { label: "Assign Driver", path: "assignDriver", type: "add" },
        ],
      },
      {
        label: "Father",
        icon: ShipWheelIcon,
        path: "fathers",
        subMenu: [
          { label: "Father Management", path: "fathers", type: "view" },
         
        ],
      },
    

 
    ],
  },
  {
    section: "FINANCE & RECORDS",
    items: [
      {
        label: "Payments",
        icon: Banknote,
        path: "payments",
        subMenu: [{ label: "Record Payment", path: "payments", type: "view" }],
      },
      {
        label: "Certificates",
        icon: FileText,
        path: "certificates",
        subMenu: [{ label: "Generate Certificate", path: "certificates", type: "view" }],
      },
    ],
  },
];

export function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const navigate = useNavigate();
  const pathname = usePathname();
  const { routes, hasAccess } = useRoutes();
  const { t } = useTranslation(); 
  const user = typeof window !== "undefined" ? JSON.parse(Cookies.get("user_me") || "{}") : null;
  const userRole = user?.role || "USER";

  // Filter menu items based on routes
  const getFilteredMenu = (): MenuSection[] => {
    if (routes.length === 0) {
      return baseMenu;
    }

    return baseMenu.map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
          return false;
        }
        return hasAccess(item.path);
      })
    })).filter(section => section.items.length > 0);
  };

  useEffect(() => {
    console.log("lang", i18next.language);
  }, []);

  const filteredMenu = getFilteredMenu();

  const handleItemClick = (item: MenuItem) => {
    if (item.subMenu && !collapsed) {
      setExpandedItems((prev) => ({
        ...prev,
        [item.path]: !prev[item.path],
      }));
    } else {
      if (hasAccess(item.path)) {
        navigate(`/${item.path}`);
      } else {
        router.push("/not-found");
      }
    }
  };

  const handleSubItemClick = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAccess(path)) {
      navigate(`/${path}`);
    } else {
      router.push("/not-found");
    }
  };

  const isActive = (path: string) => pathname?.includes(path);

  const isItemActive = (item: MenuItem) => {
    if (item.subMenu) {
      return item.subMenu.some((subItem) => isActive(subItem.path));
    }
    return isActive(item.path);
  };

  return (
    <>
      <Header />
      
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col pt-16
          bg-white dark:bg-gray-950
          border-r border-gray-200 dark:border-gray-800
          transition-[width] duration-300 ease-out
          ${collapsed ? "w-20" : "w-72"}
          overflow-y-auto
        `}
      >
        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 shadow-md hover:scale-110 active:scale-95 transition-all"
          style={{ borderColor: PRIMARY_COLOR }}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" style={{ color: PRIMARY_COLOR }} />
          ) : (
            <ChevronLeft className="h-5 w-5" style={{ color: PRIMARY_COLOR }} />
          )}
        </button>

        <nav className="flex-1 space-y-6 px-3 py-4">
          {filteredMenu.map((group) => (
            <div key={group.section} className="space-y-2">
              {!collapsed && (
                <div className="px-4 text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>
                  {group.section}
                </div>
              )}

              {group.items.map((item) => {
                const itemActive = isItemActive(item);
                const isExpanded = expandedItems[item.path] && !collapsed;

                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`
                        group flex w-full items-center justify-between rounded-lg px-4 py-3
                        font-medium transition-all duration-200
                        ${
                          itemActive
                            ? "bg-opacity-10 text-white"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/30"
                        }
                      `}
                      style={{
                        backgroundColor: itemActive ? PRIMARY_COLOR : "transparent",
                        color: itemActive ? "white" : undefined,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon
                          className={`h-5 w-5 shrink-0`}
                          style={{ color: itemActive ? "white" : PRIMARY_COLOR }}
                        />
                        {!collapsed && (
                          <span className={`text-sm font-medium ${itemActive ? "font-bold" : ""}`}>
                            {t(item.label)}
                          </span>
                        )}
                      </div>

                      {item.subMenu && !collapsed && (
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          style={{ color: itemActive ? "white" : PRIMARY_COLOR }}
                        />
                      )}
                    </button>

                    {/* Submenu */}
                    {item.subMenu && isExpanded && (
                      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-b-lg border border-gray-200 dark:border-gray-800 border-t-0">
                        {item.subMenu.map((subItem) => {
                          const subActive = isActive(subItem.path);
                          return (
                            <button
                              key={subItem.label}
                              onClick={(e) => handleSubItemClick(subItem.path, e)}
                              className={`
                                flex w-full items-center gap-3 px-10 py-2.5 text-sm
                                hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors
                              `}
                              style={{
                                color: subActive ? SECONDARY_COLOR : PRIMARY_COLOR,
                                fontWeight: subActive ? "600" : "400",
                              }}
                            >
                              <div
                                className={`w-2 h-2 rounded-full`}
                                style={{
                                  backgroundColor: subItem.type === "add" ? SECONDARY_COLOR : PRIMARY_COLOR,
                                }}
                              />
                              <span>{t(subItem.label)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}