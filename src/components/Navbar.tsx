"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/store/authSlice";
import type { AppDispatch } from "@/store/store";
import { Bell, Menu, Moon, Sun, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface NavbarProps {
  sidebarCollapsed?: boolean;
  pageTitle?: string;
}

export function Navbar({ sidebarCollapsed, pageTitle }: NavbarProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { fullName } = useAuth();

  useEffect(() => {
    setIsClient(true);
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    setDarkMode(!darkMode);
  };

  if (!isClient || !fullName) return null;

  return (
    <header
      className={`fixed top-0 right-0 z-40 h-16 px-6 md:px-8 border-b transition-all duration-300 flex items-center justify-between
    ${sidebarCollapsed ? "w-[calc(100%-85px)]" : "w-[calc(100%-255px)]"}
    bg-white text-[#1D2939] dark:bg-[#101828] dark:text-white border-gray-100 dark:border-[#1F2937]`}
    >
      {/* Left - Page Title */}
      <div className="text-lg font-semibold tracking-wide">
        {pageTitle ?? "Dashboard"}
      </div>

      {/* Right - Controls */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1F2937] transition"
          title="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1F2937] transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#101828]" />
        </div>

        {/* Profile Menu */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          >
            <Avatar>
              <AvatarFallback>
                {fullName ? getInitials(fullName) : ""}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <div className="font-medium">{fullName}</div>
            </div>
          </div>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 top-14 mt-2 w-48 bg-white dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 shadow-lg rounded-md z-50">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#374151] transition"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          aria-label="Toggle Menu"
          className="lg:hidden p-2 rounded-md text-gray-700 dark:text-white"
          onClick={toggleMenu}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="absolute top-16 right-4 bg-white dark:bg-[#1F2937] text-black dark:text-white rounded-lg shadow-md w-48 p-4 space-y-4 transition-all duration-300 z-50 lg:hidden">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-[#F2F4F7] dark:hover:bg-[#374151] transition duration-300"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
