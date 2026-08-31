"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { isAuthenticated as checkAuth, logout } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    
    // Check initial auth state
    setIsAuthenticated(checkAuth());
    
    // Listen for custom auth events (e.g. login/logout in same tab)
    const handleAuthChange = () => setIsAuthenticated(checkAuth());
    window.addEventListener("auth-change", handleAuthChange);
    
    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("auth-change", handleAuthChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setIsSettingsOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);
  
  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setIsSettingsOpen(false);
    window.location.href = "/";
  };
  
  const navLinks = [
    { name: "Plan Trip", path: "/" },
    { name: "Explore", path: "#" },
    { name: "My Trips", path: "/trips" },
    { name: "Travel Assistant", path: "/assistant" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled || isMobileMenuOpen ? "bg-slate-900/95 backdrop-blur-md shadow-lg border-b border-slate-800" : "bg-transparent border-b border-white/10"}`}>
      <div className="px-6 py-5 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-md">
            KelanaAI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = link.path === "/" ? pathname === "/" : pathname.startsWith(link.path);
            const colorClasses = isActive 
              ? "text-white drop-shadow font-extrabold" 
              : "text-white/70 hover:text-white drop-shadow font-bold";

            return (
              <Link 
                key={link.name} 
                href={link.path} 
                className={`text-sm transition-colors ${colorClasses}`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Auth CTA / Settings & Mobile Toggle */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="relative hidden md:block" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`cursor-pointer flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 border ${
                  isSettingsOpen 
                    ? "bg-blue-600/30 border-blue-400/60 text-cyan-300 shadow-lg shadow-blue-500/20" 
                    : "bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-sm"
                }`}
                aria-label="Settings"
                title="Settings"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${isSettingsOpen ? "rotate-90 text-cyan-300" : "text-white"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Settings</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsSettingsOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="cursor-pointer hidden md:block text-sm font-bold text-white hover:text-white/80 transition-colors drop-shadow-sm px-2 py-2">
                Sign In
              </Link>
              <Link href="/register" className="cursor-pointer rounded-lg text-sm font-extrabold px-5 py-2 md:px-6 md:py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm hover:shadow-md transition-all">
                Sign Up
              </Link>
            </>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-6 py-4">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const isActive = link.path === "/" ? pathname === "/" : pathname.startsWith(link.path);
              const colorClasses = isActive 
                ? "text-white font-extrabold" 
                : "text-white/70 hover:text-white font-bold";

              return (
                <Link 
                  key={link.name} 
                  href={link.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-base py-2 transition-colors ${colorClasses}`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="border-t border-white/10 my-2 pt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1 pt-1">
                    Settings
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 font-bold text-white py-2 px-1 hover:text-cyan-400 transition-colors"
                  >
                    <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full text-left font-bold text-red-400 py-2 px-1 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full font-bold text-white py-2">
                    Sign In
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full font-bold text-blue-400 py-2">
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
