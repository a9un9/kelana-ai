"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const navLinks = [
    { name: "Plan Trip", path: "/" },
    { name: "Explore", path: "#" },
    { name: "My Trips", path: "/trips" },
  ];

  return (
    <header className={`fixed top-0 inset-x-0 z-50 px-6 py-5 md:px-12 flex items-center justify-between transition-all duration-300 ${isScrolled ? "bg-slate-900/95 backdrop-blur-md shadow-lg border-b border-slate-800" : "bg-transparent border-b border-white/10"}`}>
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

        {/* Auth CTA */}
        <div className="flex items-center gap-5">
          <button className="cursor-pointer hidden md:block text-sm font-bold text-white hover:text-white/80 transition-colors drop-shadow-sm px-2 py-2">
            Sign In
          </button>
          <button className="cursor-pointer rounded-lg text-sm font-extrabold px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm hover:shadow-md transition-all">
            Sign Up
          </button>
        </div>
    </header>
  );
}
