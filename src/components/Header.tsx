"use client";

import { logoutUser } from "@/services/authService";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from '@/components/LanguageSwitcher'; 
import { useTranslation } from "react-i18next";

export default function Header() {
  const router = useRouter();
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation(); 

  useEffect(() => {
    setMounted(true);
    
    // Read user data from cookies
    const userCookie = Cookies.get("user_login");
    const roleCookie = Cookies.get("user_role");
    const nameCookie = Cookies.get("user_fullName");
    
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        setFullName(userData.fullName || nameCookie || "");
        setRole(userData.role || roleCookie || "");
      } catch (error) {
        console.error("Failed to parse user data from cookie:", error);
        // Fallback to individual cookies
        if (nameCookie) setFullName(nameCookie);
        if (roleCookie) setRole(roleCookie);
      }
    } else {
      // Fallback to individual cookies
      if (nameCookie) setFullName(nameCookie);
      if (roleCookie) setRole(roleCookie);
    }
  }, []);


  if (!mounted) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
         
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden sm:block" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>
      </header>
    );
  }

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logoutUser();
    // Remove all relevant cookies
    Cookies.remove("user_login");
    Cookies.remove("user_role");
    Cookies.remove("user_fullName");
    Cookies.remove("user_email");
    Cookies.remove("user_accountType");
    Cookies.remove("user_me");
    Cookies.remove("organizationId");
    Cookies.remove("customerProfileId");
    Cookies.remove("user_routes");
    Cookies.remove("role");
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shadow-sm">
      {/* Left side: Logo & Brand */}
      <div className="flex items-center gap-4">
       
        <h1 className="text-md font-bold hidden sm:block text-primary">
          {t("Certeficate-dashboard")}
        </h1>
      </div>

      {/* Right side: Notifications & User Menu */}
      <div className="flex items-center gap-4">
       
       
        
        <LanguageSwitcher />
        
        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Avatar className="h-9 w-9 text-primary">
                <AvatarFallback className="text-white font-semibold text-sm bg-primary">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {fullName}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {role?.replace("_", " ").toLowerCase() || "user"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => router.push("/profile")}
              className="cursor-pointer hover:bg-gray-50"
            >
              <UserIcon className="mr-2 h-4 w-4 text-primary" />
              <span>{t("Profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push("/settings")}
              className="cursor-pointer hover:bg-gray-50"
            >
              <Settings className="mr-2 h-4 w-4 text-primary" />
              <span>{t("Settings")}</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("Log out")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}