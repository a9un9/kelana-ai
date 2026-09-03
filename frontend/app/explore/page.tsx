"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type Destination = {
  id: string;
  city: string;
  country: string;
  flag: string;
  category: ("beach" | "urban" | "culture" | "nature" | "culinary")[];
  image: string;
  dailyBudget: number;
  bestSeason: string;
  defaultDays: number;
  recommendedBudget: number;
  travelStyle: string;
  description: string;
  highlights: string[];
};

const DESTINATIONS: Destination[] = [
  {
    id: "tokyo",
    city: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    category: ["urban", "culture", "culinary"],
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 85,
    bestSeason: "Mar - May, Sep - Nov",
    defaultDays: 6,
    recommendedBudget: 900,
    travelStyle: "Standard",
    description: "Futuristic neon skyscrapers meeting ancient Shinto shrines and world-class ramen bars.",
    highlights: ["Shibuya Crossing", "Senso-ji Temple", "Akihabara", "Shinjuku"],
  },
  {
    id: "kyoto",
    city: "Kyoto",
    country: "Japan",
    flag: "🇯🇵",
    category: ["culture", "nature", "culinary"],
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 75,
    bestSeason: "Apr (Cherry Blossom), Nov",
    defaultDays: 4,
    recommendedBudget: 600,
    travelStyle: "Standard",
    description: "Ancient imperial capital with thousands of classical Buddhist temples, gardens, and geisha tea houses.",
    highlights: ["Fushimi Inari Taisha", "Arashiyama Bamboo Grove", "Kinkaku-ji (Golden Pavilion)", "Gion District"],
  },
  {
    id: "seoul",
    city: "Seoul",
    country: "South Korea",
    flag: "🇰🇷",
    category: ["urban", "culture", "culinary"],
    image: "https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 70,
    bestSeason: "Sep - Nov (Autumn)",
    defaultDays: 5,
    recommendedBudget: 750,
    travelStyle: "Standard",
    description: "Vibrant K-culture capital blending royal palaces, trendy street fashion, and sizzling BBQ.",
    highlights: ["Gyeongbokgung Palace", "Myeongdong", "Bukchon Hanok", "Hongdae"],
  },
  {
    id: "bali",
    city: "Bali",
    country: "Indonesia",
    flag: "🇮🇩",
    category: ["beach", "nature", "culture"],
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 45,
    bestSeason: "May - Sep (Dry Season)",
    defaultDays: 5,
    recommendedBudget: 450,
    travelStyle: "Backpacker",
    description: "Tropical island sanctuary featuring cascading rice terraces, surf beaches, and peaceful temples.",
    highlights: ["Ubud Rice Terraces", "Uluwatu Sunset", "Canggu Beach", "Nusa Penida"],
  },
  {
    id: "lombok",
    city: "Lombok & Gili",
    country: "Indonesia",
    flag: "🇮🇩",
    category: ["beach", "nature"],
    image: "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 35,
    bestSeason: "May - Oct (Dry Season)",
    defaultDays: 4,
    recommendedBudget: 300,
    travelStyle: "Backpacker",
    description: "Pristine turquoise water islands, sea turtle coral reefs, and the volcanic slopes of Mount Rinjani.",
    highlights: ["Gili Trawangan Snorkel", "Pink Beach", "Kuta Lombok", "Sendang Gile Waterfall"],
  },
  {
    id: "singapore",
    city: "Singapore",
    country: "Singapore",
    flag: "🇸🇬",
    category: ["urban", "culinary", "nature"],
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 110,
    bestSeason: "Nov - Jan, Jun - Aug",
    defaultDays: 4,
    recommendedBudget: 800,
    travelStyle: "Standard",
    description: "A lush garden city packed with futuristic architecture, Michelin street food, and luxury shopping.",
    highlights: ["Gardens by the Bay", "Marina Bay Sands", "Chinatown", "Sentosa Island"],
  },
  {
    id: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    flag: "🇹🇭",
    category: ["culinary", "culture", "urban"],
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 40,
    bestSeason: "Nov - Feb (Cool Season)",
    defaultDays: 4,
    recommendedBudget: 350,
    travelStyle: "Backpacker",
    description: "Bustling metropolis with golden Buddhist temples, legendary floating markets, and nightlife.",
    highlights: ["Grand Palace", "Wat Arun", "Chatuchak Weekend Market", "Yaowarat (Chinatown)"],
  },
  {
    id: "hanoi",
    city: "Hanoi & Ha Long",
    country: "Vietnam",
    flag: "🇻🇳",
    category: ["culinary", "nature", "culture"],
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 35,
    bestSeason: "Oct - Dec, Mar - Apr",
    defaultDays: 4,
    recommendedBudget: 300,
    travelStyle: "Backpacker",
    description: "Centuries-old Old Quarter alleys, legendary egg coffee, and emerald limestone bay cruise waters.",
    highlights: ["Ha Long Bay Cruise", "Hanoi Old Quarter", "Train Street", "Hoan Kiem Lake"],
  },
  {
    id: "paris",
    city: "Paris",
    country: "France",
    flag: "🇫🇷",
    category: ["culture", "urban", "culinary"],
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 140,
    bestSeason: "Apr - Jun, Sep - Oct",
    defaultDays: 5,
    recommendedBudget: 1200,
    travelStyle: "Luxury",
    description: "The city of light, art museums, world-renowned bakeries, and romantic Seine river walks.",
    highlights: ["Eiffel Tower", "Louvre Museum", "Montmartre", "Champs-Élysées"],
  },
  {
    id: "rome",
    city: "Rome",
    country: "Italy",
    flag: "🇮🇹",
    category: ["culture", "culinary", "urban"],
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 110,
    bestSeason: "Apr - May, Sep - Oct",
    defaultDays: 5,
    recommendedBudget: 950,
    travelStyle: "Standard",
    description: "An open-air museum of Roman antiquity, world-famous handmade pasta, espresso, and renaissance art.",
    highlights: ["Colosseum", "Trevi Fountain", "Vatican City & St. Peter's", "Trastevere Food Tour"],
  },
  {
    id: "barcelona",
    city: "Barcelona",
    country: "Spain",
    flag: "🇪🇸",
    category: ["beach", "culture", "culinary", "urban"],
    image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 95,
    bestSeason: "May - Jun, Sep - Oct",
    defaultDays: 5,
    recommendedBudget: 800,
    travelStyle: "Standard",
    description: "Mediterranean jewel famous for Gaudí's whimsical architecture, tapas bars, and sun-drenched beaches.",
    highlights: ["Sagrada Família", "Park Güell", "Barceloneta Beach", "La Boqueria Market"],
  },
  {
    id: "london",
    city: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    category: ["urban", "culture", "culinary"],
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 135,
    bestSeason: "May - Sep (Summer)",
    defaultDays: 5,
    recommendedBudget: 1100,
    travelStyle: "Standard",
    description: "Dynamic metropolis where royal heritage, iconic red buses, West End theatre, and pubs converge.",
    highlights: ["Big Ben & Parliament", "Tower Bridge", "British Museum", "Soho & Covent Garden"],
  },
  {
    id: "interlaken",
    city: "Interlaken",
    country: "Switzerland",
    flag: "🇨🇭",
    category: ["nature", "culture"],
    image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 175,
    bestSeason: "Dec - Mar (Snow), Jun - Aug",
    defaultDays: 4,
    recommendedBudget: 1400,
    travelStyle: "Luxury",
    description: "Majestic Swiss Alpine wonderland nestled between two emerald lakes with breathtaking peaks.",
    highlights: ["Jungfraujoch Peak", "Lake Brienz", "Harder Kulm", "Lauterbrunnen Valley"],
  },
  {
    id: "reykjavik",
    city: "Reykjavik",
    country: "Iceland",
    flag: "🇮🇸",
    category: ["nature"],
    image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 165,
    bestSeason: "Sep - Mar (Northern Lights)",
    defaultDays: 5,
    recommendedBudget: 1300,
    travelStyle: "Luxury",
    description: "Land of fire and ice with dancing aurora borealis, geothermal lagoons, black sand beaches, and geysers.",
    highlights: ["Northern Lights (Aurora)", "Blue Lagoon Geothermal Spa", "Golden Circle", "Black Sand Beach"],
  },
  {
    id: "istanbul",
    city: "Istanbul",
    country: "Turkey",
    flag: "🇹🇭",
    category: ["culture", "culinary", "urban"],
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 55,
    bestSeason: "Apr - May, Sep - Nov",
    defaultDays: 5,
    recommendedBudget: 500,
    travelStyle: "Standard",
    description: "The transcontinental bridge connecting Europe & Asia with magnificent domes, spice bazaars, and tea.",
    highlights: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Bosphorus Sunset Cruise"],
  },
  {
    id: "cairo",
    city: "Cairo",
    country: "Egypt",
    flag: "🇪🇬",
    category: ["culture", "nature"],
    image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 45,
    bestSeason: "Oct - Apr (Mild Weather)",
    defaultDays: 4,
    recommendedBudget: 400,
    travelStyle: "Backpacker",
    description: "Cradle of ancient civilization boasting colossal desert pyramids, the Nile river, and bustling souks.",
    highlights: ["Giza Pyramids & Sphinx", "Grand Egyptian Museum", "Nile River Cruise", "Khan el-Khalili Bazaar"],
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "UAE",
    flag: "🇦🇪",
    category: ["urban", "culture"],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 150,
    bestSeason: "Nov - Mar (Cool Season)",
    defaultDays: 4,
    recommendedBudget: 1100,
    travelStyle: "Luxury",
    description: "Ultra-modern oasis known for cloud-piercing towers, luxury shopping, and golden desert dune safaris.",
    highlights: ["Burj Khalifa", "Dubai Mall & Fountain", "Palm Jumeirah", "Desert Safari BBQ"],
  },
  {
    id: "sydney",
    city: "Sydney",
    country: "Australia",
    flag: "🇦🇺",
    category: ["beach", "urban", "nature"],
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 120,
    bestSeason: "Sep - Nov, Mar - May",
    defaultDays: 5,
    recommendedBudget: 1100,
    travelStyle: "Standard",
    description: "Iconic harbourfront city boasting golden surf beaches, vibrant cafés, and coastal walks.",
    highlights: ["Sydney Opera House", "Bondi Beach", "Harbour Bridge", "Blue Mountains"],
  },
  {
    id: "new-york",
    city: "New York City",
    country: "USA",
    flag: "🇺🇸",
    category: ["urban", "culinary", "culture"],
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 165,
    bestSeason: "Apr - Jun, Sep - Nov",
    defaultDays: 5,
    recommendedBudget: 1350,
    travelStyle: "Standard",
    description: "The city that never sleeps, famous for dazzling Broadway lights, Central Park, and skyscraper skylines.",
    highlights: ["Times Square", "Central Park", "Brooklyn Bridge", "Empire State Building"],
  },
  {
    id: "cape-town",
    city: "Cape Town",
    country: "South Africa",
    flag: "🇿🇦",
    category: ["nature", "beach", "urban"],
    image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1200&auto=format&fit=crop",
    dailyBudget: 65,
    bestSeason: "Nov - Mar (Summer)",
    defaultDays: 5,
    recommendedBudget: 650,
    travelStyle: "Standard",
    description: "Where dramatic mountain ridges meet two oceans, penguin colonies, vineyards, and scenic coastal drives.",
    highlights: ["Table Mountain Cableway", "Boulders Beach Penguins", "Cape Point", "V&A Waterfront"],
  },
];

const CATEGORIES = [
  { id: "all", label: "✨ All Places" },
  { id: "beach", label: "🏖️ Beach & Islands" },
  { id: "urban", label: "🏙️ Urban & Modern" },
  { id: "culture", label: "🏛️ Culture & Heritage" },
  { id: "nature", label: "🏔️ Nature & Adventure" },
  { id: "culinary", label: "🍜 Culinary & Food" },
];

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ||
        item.category.includes(selectedCategory as Destination["category"][number]);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.city.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.highlights.some((h) => h.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 relative">
      {/* Background Image & Gradient Overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover -z-20 blur-[2px] scale-105"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/60 to-slate-950/85 -z-10" />

      {/* Floating Animated Particles */}
      <div className="particle particle-1 top-24 left-16" />
      <div className="particle particle-2 top-48 right-24" />
      <div className="particle particle-3 top-96 left-1/4" />
      <div className="particle particle-2 bottom-32 right-1/3" />

      {/* Hero Header Section */}
      <div className="w-full pt-28 pb-6 px-4 md:px-8 text-center animate-float-up">
        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/25 shadow-lg mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-200">
            Travel Inspiration • 20+ Global Destinations
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-2xl tracking-tight mb-2">
          Explore World <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Destinations</span>
        </h1>
        <p className="text-white/80 text-sm md:text-base font-medium max-w-xl mx-auto">
          Discover top trending cities, seasonal guides, and launch personalized AI itinerary plans in one click.
        </p>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pb-20 relative z-10 flex flex-col gap-8 animate-float-up">
        
        {/* Search & Filter Bar (Glassmorphic) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/10 backdrop-blur-xl p-4 rounded-lg border border-white/20 shadow-2xl">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search destination, city, or attractions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold text-white placeholder-white/50 focus:outline-none focus:border-cyan-300 transition-all backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2 px-3 text-xs font-bold text-white/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              Showing <strong className="text-cyan-300 font-extrabold">{filteredDestinations.length}</strong> of {DESTINATIONS.length} spots
            </span>
          </div>
        </div>

        {/* Category Vibe Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`cursor-pointer px-4 py-2 rounded-lg text-xs font-bold transition-all backdrop-blur-md border ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-lg shadow-blue-500/25 scale-102"
                    : "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border-white/15"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Destinations Cards Grid */}
        {filteredDestinations.length === 0 ? (
          <div className="rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 p-12 text-center text-white shadow-2xl">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="text-xl font-bold mb-1">No destinations found</h3>
            <p className="text-sm text-white/70 mb-4">
              We couldn&apos;t find any place matching &quot;{searchQuery}&quot;. Try searching another city or category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDestinations.map((dest) => (
              <div
                key={dest.id}
                className="group flex flex-col rounded-lg bg-white/95 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Card Image Banner */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.image}
                    alt={`${dest.city}, ${dest.country}`}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Top Badge: Country & Flag */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/70 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-md">
                    <span>{dest.flag}</span>
                    <span>{dest.country}</span>
                  </div>

                  {/* Daily Budget Badge */}
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white text-xs font-black shadow-md">
                    <span>~${dest.dailyBudget}/day</span>
                  </div>

                  {/* City Title on Image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-white drop-shadow-md tracking-tight">
                        {dest.city}
                      </h3>
                      <p className="text-[11px] text-cyan-200 font-bold flex items-center gap-1">
                        <span>🗓️ Best:</span> {dest.bestSeason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-2 mb-3">
                      {dest.description}
                    </p>

                    {/* Highlights tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {dest.highlights.map((h, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700"
                        >
                          📍 {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    {/* Plan with AI Button */}
                    <Link
                      href={`/?destination=${encodeURIComponent(dest.city)}&days=${dest.defaultDays}&budget=${dest.recommendedBudget}&style=${encodeURIComponent(dest.travelStyle)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-500/20 cursor-pointer text-center"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Plan Trip with AI</span>
                    </Link>

                    {/* Ask Assistant Button */}
                    <Link
                      href="/assistant"
                      className="inline-flex items-center justify-center p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                      title={`Ask AI Guide about ${dest.city}`}
                    >
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Curated AI Itinerary Templates Section */}
        <div className="rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 p-6 md:p-8 shadow-2xl text-white mt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">
                ⭐ Featured Itinerary Templates
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Ready-Made AI Itineraries
              </h2>
            </div>
            <p className="text-xs text-white/70 max-w-sm">
              Pre-crafted schedules by Kelana AI. Pick any template to customize duration, style, and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md flex flex-col justify-between gap-4 transition-all">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-1">
                  <span>🇯🇵 Tokyo, Japan</span>
                  <span>3 Days</span>
                </div>
                <h4 className="font-extrabold text-sm text-white mb-1">
                  Tokyo Backpacker Express
                </h4>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Asakusa temple sunrise, Shibuya street eats, Akihabara tech district, and budget-friendly metro loops.
                </p>
              </div>
              <Link
                href="/?destination=Tokyo&days=3&budget=450&style=Backpacker"
                className="inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow"
              >
                <span>Use Template</span>
                <span>→</span>
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md flex flex-col justify-between gap-4 transition-all">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-1">
                  <span>🇰🇷 Seoul, Korea</span>
                  <span>5 Days</span>
                </div>
                <h4 className="font-extrabold text-sm text-white mb-1">
                  Autumn K-Culture & Heritage
                </h4>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Hanbok dress-up at royal palaces, Han river sunset ramen, Namsan tower views, and skincare shopping.
                </p>
              </div>
              <Link
                href="/?destination=Seoul&days=5&budget=800&style=Standard"
                className="inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow"
              >
                <span>Use Template</span>
                <span>→</span>
              </Link>
            </div>

            <div className="p-4 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md flex flex-col justify-between gap-4 transition-all">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-1">
                  <span>🇮🇩 Bali, Indonesia</span>
                  <span>4 Days</span>
                </div>
                <h4 className="font-extrabold text-sm text-white mb-1">
                  Ubud & Coastal Escape
                </h4>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Tegallalang rice terraces, holy spring temple purification, Uluwatu cliffside sunsets, and beach clubs.
                </p>
              </div>
              <Link
                href="/?destination=Bali&days=4&budget=400&style=Standard"
                className="inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow"
              >
                <span>Use Template</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
