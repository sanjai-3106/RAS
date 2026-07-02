import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Film,
  Music,
  Gamepad2,
  BookOpen,
  GraduationCap,
  Compass,
  Utensils,
  ShoppingBag,
  Heart,
  User,
  Layers,
  ArrowRight,
  Code2,
  Copy,
  Check,
  Search,
  Filter,
  Info,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Sliders,
  Send,
  Database,
  Globe,
  Terminal,
  ExternalLink,
  HelpCircle,
  History,
  X,
  MessageSquare,
  Bot
} from "lucide-react";
import { JAVA_SOURCE_FILES, JavaFile } from "./data/javaSource";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  tags: string[];
  rating: number;
  matchReason: string;
  metadata: Record<string, string>;
}

interface RecentSearch {
  id: string;
  category: string;
  query: string;
  timestamp: number;
}

export default function App() {
  // Navigation / Tab state matching the 12 files in the user's diagram
  // "index" | "movies" | "music" | "games" | "courses" | "travel" | "book" | "food" | "shopping" | "fav" | "profile" | "cate"
  const [activeTab, setActiveTab] = useState<string>("index");
  
  // Java code viewer states
  const [selectedJavaFile, setSelectedJavaFile] = useState<JavaFile>(JAVA_SOURCE_FILES[0]);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  
  // Recommendation Playground states
  const [categoryPreferences, setCategoryPreferences] = useState<Record<string, string>>({
    movies: "Tamil action thrillers and Mani Ratnam blockbusters",
    music: "Soulful Tamil melodies, A.R. Rahman classics, and high-energy Anirudh hits",
    games: "immersive open-world games or cozy simulators",
    courses: "introductory computer science and python programming",
    travel: "scenic, cultural, and budget-friendly places in Asia or Europe",
    book: "inspiring self-help or epic science fiction",
    food: "healthy high-protein or quick vegetarian dinners",
    shopping: "ergonomic office tech or smart productivity gadgets"
  });

  const [userProfile, setUserProfile] = useState({
    username: "Sanjai Balaji",
    occupation: "Software Developer",
    diet: "None",
    favoriteCategory: "movies",
    techSkill: "Intermediate"
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [favorites, setFavorites] = useState<Recommendation[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [architectureStep, setArchitectureStep] = useState<number>(0);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [indexSearchCategory, setIndexSearchCategory] = useState("movies");
  const [sortBy, setSortBy] = useState<"relevance" | "rating">("relevance");

  // Ask Expert Chat Overlay states
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ role: "user" | "assistant"; content: string }>>>({});
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);

  // Load favorites and recent searches from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("my_ras_favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    const savedSearches = localStorage.getItem("my_ras_recent_searches");
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error(e);
      }
    }
    
    // Auto cycle architecture step for a dynamic visual experience
    const interval = setInterval(() => {
      setArchitectureStep((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Save favorites to local storage
  const saveFavorites = (newFavs: Recommendation[]) => {
    setFavorites(newFavs);
    localStorage.setItem("my_ras_favorites", JSON.stringify(newFavs));
  };

  // Save a recent search query
  const saveRecentSearch = (category: string, query: string) => {
    if (!query || !query.trim()) return;
    const trimmedQuery = query.trim();
    
    setRecentSearches((prev) => {
      // Remove any matching query in same category to avoid duplicates
      const filtered = prev.filter(
        (item) => !(item.category === category && item.query.toLowerCase() === trimmedQuery.toLowerCase())
      );
      const newItem: RecentSearch = {
        id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        category,
        query: trimmedQuery,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 15); // limit to 15 entries
      localStorage.setItem("my_ras_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  // Remove a single search item
  const removeRecentSearch = (id: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("my_ras_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all for a specific category
  const clearAllRecentSearches = (category: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item.category !== category);
      localStorage.setItem("my_ras_recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle favorite
  const toggleFavorite = (rec: Recommendation) => {
    const exists = favorites.find(f => f.id === rec.id);
    if (exists) {
      saveFavorites(favorites.filter(f => f.id !== rec.id));
    } else {
      saveFavorites([...favorites, rec]);
    }
  };

  // Copy code utility
  const handleCopyCode = (file: JavaFile) => {
    navigator.clipboard.writeText(file.code);
    setCopiedFile(file.name);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  // Trigger Live Recommendation Fetch from Node server
  const fetchRecommendations = async (category: string, saveToRecent: boolean = false) => {
    setLoading(true);
    setError(null);
    const currentQuery = categoryPreferences[category] || "";
    
    // Save to recent searches if requested
    if (saveToRecent && currentQuery.trim()) {
      saveRecentSearch(category, currentQuery);
    }

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          preferences: {
            search: currentQuery
          },
          profile: userProfile
        })
      });

      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const data = await response.json();
      setRecommendations(data);
    } catch (e: any) {
      console.error(e);
      setError("Failed to fetch custom suggestions. Showing off-line recommendation fallbacks.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial content when changing active tabs and sync search inputs
  useEffect(() => {
    const categories = ["movies", "music", "games", "courses", "travel", "book", "food", "shopping"];
    if (categories.includes(activeTab)) {
      fetchRecommendations(activeTab);
      setGlobalSearchQuery(categoryPreferences[activeTab] || "");
    } else {
      setGlobalSearchQuery("");
    }
  }, [activeTab]);

  const handleGlobalSearchChange = (val: string) => {
    setGlobalSearchQuery(val);
    const categories = ["movies", "music", "games", "courses", "travel", "book", "food", "shopping"];
    if (categories.includes(activeTab)) {
      setCategoryPreferences(prev => ({
        ...prev,
        [activeTab]: val
      }));
    }
  };

  const WELCOME_MESSAGES: Record<string, string> = {
    movies: "Vanakkam! I'm your My RAS Cinema Expert. 🎬 I see we have some incredible Tamil cinematic masterpieces and Mani Ratnam classics loaded. Ask me about directors, cast details, similar Kollywood blockbusters, or how to customize your watch list!",
    music: "Welcome! I'm your Music & Soundtrack Expert. 🎵 Ready to dive deep into A.R. Rahman melodies, high-octane Anirudh hits, or soulful Yuvan tracks? Tell me what vibe you're looking for, or ask for song recommendations!",
    games: "Greetings, player! 🎮 I'm your Gaming Guru. Let's talk about open-world physics, cosy simulators, or hard-core rogue-likes. Ask me anything about these games or what you should play next!",
    courses: "Hello! I'm your Learning & Tech Advisor. 📚 Looking to master Python, start computer science principles, or explore financial markets? Ask me to compare these paths or map out a study schedule for you!",
    travel: "Hello adventurer! ✈️ I'm your Travel & Discovery Guide. Ready to explore Kyoto's temples, Amalfi's coastlines, or Banff's wilderness? Ask me for packing tips, sample itineraries, or best seasons to visit!",
    book: "Welcome, reader! 📚 I'm your Literary Advisor. From Frank Herbert's epic sci-fi Dune to atomic habits and deep memoirs, let's discuss these pages. Ask me for themes, summaries, or what to read next!",
    food: "Hello and bon appétit! 🍳 I'm your Culinary & Recipe Expert. Let's talk about creamy Tuscan garlic chicken, fresh pad thai, or spicy beef biryani. Ask me for prep tips, ingredient substitutes, or diet options!",
    shopping: "Hello there! 🛒 I'm your Shopping & Smart Gear Expert. Interested in keycaps, noise-cancelling tech, or high-performance chargers? Let me explain the specs, value propositions, or help you choose the best gift!"
  };

  const getWelcomeMessage = (cat: string) => {
    return WELCOME_MESSAGES[cat] || `Hello! I am your My RAS ${cat} expert. How can I assist you with your recommendations today?`;
  };

  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
        {lines.map((line, idx) => {
          const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
          const content = isBullet ? line.trim().substring(2) : line;

          const parts = content.split(/\*\*(.*?)\*\*/g);
          const parsedLine = parts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="text-purple-400 font-bold">{part}</strong>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-2">
                <span className="text-purple-500 mt-1 shrink-0 text-[10px]">•</span>
                <span>{parsedLine}</span>
              </div>
            );
          }

          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          return <p key={idx}>{parsedLine}</p>;
        })}
      </div>
    );
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput("");

    const previousMessages = chatMessages[activeTab] || [
      { role: "assistant", content: getWelcomeMessage(activeTab) }
    ];

    const updatedMessages = [...previousMessages, { role: "user", content: userText }];
    setChatMessages(prev => ({
      ...prev,
      [activeTab]: updatedMessages
    }));

    setIsChatSending(true);

    try {
      const response = await fetch("/api/chat-expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: activeTab,
          recommendations: recommendations,
          messages: updatedMessages
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with expert");
      }

      const data = await response.json();
      setChatMessages(prev => ({
        ...prev,
        [activeTab]: [...updatedMessages, { role: "assistant", content: data.text || "I apologize, I could not process that request." }]
      }));
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => ({
        ...prev,
        [activeTab]: [...updatedMessages, { role: "assistant", content: "I am having trouble connecting to the network right now. However, I highly recommend looking over the customized matches above!" }]
      }));
    } finally {
      setIsChatSending(false);
    }
  };

  // Auto-scroll chat messages
  useEffect(() => {
    if (isChatOpen) {
      const container = document.getElementById("chat-messages-container");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [chatMessages, isChatOpen, activeTab, isChatSending]);

  // List of frontend pages matching user's HTML files
  const pagesList = [
    { id: "index", label: "index.html", icon: Sparkles, color: "from-blue-500 to-indigo-500", desc: "Main Hub Overview" },
    { id: "movies", label: "movies.html", icon: Film, color: "from-rose-500 to-purple-500", desc: "Cinematic Suggestions" },
    { id: "music", label: "music.html", icon: Music, color: "from-pink-500 to-rose-500", desc: "Acoustic & Audio Playlists" },
    { id: "games", label: "games.html", icon: Gamepad2, color: "from-purple-500 to-violet-500", desc: "Interactive Adventures" },
    { id: "courses", label: "courses.html", icon: GraduationCap, color: "from-indigo-500 to-blue-500", desc: "Academic Enhancements" },
    { id: "travel", label: "travel.html", icon: Compass, color: "from-cyan-500 to-teal-500", desc: "Wanderlust Destinations" },
    { id: "book", label: "book.html", icon: BookOpen, color: "from-emerald-500 to-green-500", desc: "Literary Discoveries" },
    { id: "food", label: "food.html", icon: Utensils, color: "from-amber-500 to-orange-500", desc: "Gastronomic Masterpieces" },
    { id: "shopping", label: "shopping.html", icon: ShoppingBag, color: "from-orange-500 to-amber-500", desc: "Premium Curated Products" },
    { id: "cate", label: "cate.html", icon: Layers, color: "from-gray-500 to-slate-500", desc: "Browse Categories Matrix" },
    { id: "fav", label: "fav.html", icon: Heart, color: "from-red-500 to-pink-500", desc: "Bookmarks & Favorites" },
    { id: "profile", label: "profile.html", icon: User, color: "from-slate-500 to-zinc-500", desc: "User Custom Persona" },
  ];

  const getActiveTabTitle = () => {
    const page = pagesList.find(p => p.id === activeTab);
    return page ? page.label : "index.html";
  };

  const getActiveTabDesc = () => {
    const page = pagesList.find(p => p.id === activeTab);
    return page ? page.desc : "";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white" id="ras-main-container">
      {/* Header Banner */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 py-4 px-6" id="ras-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-400 p-2.5 rounded-xl shadow-lg shadow-purple-900/20" id="header-logo-container">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-purple-900/80 text-purple-200 border border-purple-700/50 px-2 py-0.5 rounded-full">Active Blueprint</span>
                <span className="text-xs font-mono text-slate-500">v1.2.0</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-purple-300 to-slate-200 bg-clip-text text-transparent">
                My RAS <span className="font-light text-slate-400">| Recommendation and Advice System</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveTab("profile");
              }}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              id="header-profile-btn"
            >
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>{userProfile.username}</span>
            </button>
            <a 
              href="#architecture-section"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-purple-400 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>See System Architecture</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6" id="ras-main-content">
        
        {/* Left column: Simulated HTML file directory (Sidebar) */}
        <aside className="lg:col-span-3 flex flex-col gap-4" id="ras-sidebar">
          <div className="bg-slate-900/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-500" />
                <span>Frontend Files (HTML)</span>
              </h2>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                12 Screens
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              These files constitute the client-side system. Select a file below to load its interactive simulator environment:
            </p>

            <div className="flex flex-col gap-1.5 mt-2" id="html-file-list">
              {pagesList.map((page) => {
                const Icon = page.icon;
                const isSelected = activeTab === page.id;
                return (
                  <button
                    key={page.id}
                    id={`btn-file-${page.id}`}
                    onClick={() => setActiveTab(page.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all relative group cursor-pointer ${
                      isSelected
                        ? "bg-slate-800/80 border border-slate-700 text-purple-300 font-medium"
                        : "bg-transparent hover:bg-slate-900 border border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded bg-slate-950 text-slate-400 group-hover:text-white transition-colors ${isSelected ? 'text-purple-400 bg-purple-950/40' : ''}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-mono font-medium truncate">{page.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{page.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-glow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick System Statistics Widget */}
          <div className="bg-slate-900/40 border border-slate-900/60 rounded-xl p-4 flex flex-col gap-2.5 text-xs">
            <h3 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database & Key Status</span>
            </h3>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span>Active Server Platform</span>
                <span className="text-slate-300 font-mono">Node.js + Spring Boot</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span>Communication Protocol</span>
                <span className="text-slate-300 font-mono">REST JSON (Post)</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span>Core Recommender AI</span>
                <span className="text-purple-400 font-mono">Gemini 3.5 Flash</span>
              </div>
              <div className="flex justify-between pb-0.5">
                <span>Local Bookmarks</span>
                <span className="text-emerald-400 font-mono">{favorites.length} saved</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Area: Simulated Web Frame & Interactive Elements */}
        <section className="lg:col-span-9 flex flex-col gap-6" id="ras-workspace-panel">
          
          {/* Simulated Web Browser App Environment */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[580px]">
            {/* Browser top address bar UI */}
            <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              
              {/* Simulated URL bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-400 flex items-center gap-2 flex-1 max-w-lg mx-auto font-mono text-center justify-center select-all">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>https://my-ras.local/{getActiveTabTitle()}</span>
              </div>

              <div className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-900 px-2 py-0.5 rounded font-mono">
                HTML View
              </div>
            </div>

            {/* Active Simulated Viewport */}
            <div className="p-5 md:p-6 flex-1 flex flex-col bg-slate-950/50">
              
              {/* Context-Aware Global Search Bar (Visible on every single page) */}
              <div className="mb-5 bg-slate-900/60 border border-slate-850 p-3.5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-950/5 relative overflow-hidden" id="global-search-bar">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500" />
                
                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <div className="p-2 bg-slate-950 rounded-lg text-purple-400 border border-slate-800">
                    <Search className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-950/50 border border-purple-900/30 px-1.5 py-0.5 rounded">
                        {activeTab}.html
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {activeTab === "index" ? "Global RAS Search" :
                         activeTab === "cate" ? "Category Matrix Filter" :
                         activeTab === "fav" ? "Favorites Search Engine" :
                         activeTab === "profile" ? "Profile Field Filter" :
                         `Search within ${activeTab}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {activeTab === "index" ? "Type and select a category to discover tailored suggestions." :
                       activeTab === "cate" ? "Filters matching screens in real-time as you type." :
                       activeTab === "fav" ? "Filters saved recommendation bookmarks instantly." :
                       activeTab === "profile" ? "Filters profile attributes and configuration values." :
                       "Refines recommendation criteria for live cognitive matchmaking."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto md:max-w-xl flex-1">
                  {/* Category Selector ONLY on index.html page */}
                  {activeTab === "index" && (
                    <div className="relative shrink-0">
                      <select
                        value={indexSearchCategory}
                        onChange={(e) => setIndexSearchCategory(e.target.value)}
                        className="bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none cursor-pointer appearance-none pr-7 transition-colors"
                        id="global-search-category-select"
                      >
                        <option value="movies">🎬 Movies</option>
                        <option value="music">🎵 Music</option>
                        <option value="games">🎮 Games</option>
                        <option value="courses">🎓 Courses</option>
                        <option value="travel">🧭 Travel</option>
                        <option value="book">📚 Books</option>
                        <option value="food">🍽️ Food</option>
                        <option value="shopping">🛍️ Curated</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  {/* The Search Input */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={globalSearchQuery}
                      onChange={(e) => handleGlobalSearchChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (activeTab === "index") {
                            const trimmed = globalSearchQuery.trim();
                            if (trimmed) {
                              setCategoryPreferences(prev => ({
                                ...prev,
                                [indexSearchCategory]: trimmed
                              }));
                              saveRecentSearch(indexSearchCategory, trimmed);
                              setActiveTab(indexSearchCategory);
                            }
                          } else if (["movies", "music", "games", "courses", "travel", "book", "food", "shopping"].includes(activeTab)) {
                            fetchRecommendations(activeTab, true);
                          }
                        }
                      }}
                      placeholder={
                        activeTab === "index" ? "Search recommendations... (e.g. Tamil action hits)" :
                        activeTab === "cate" ? "Type to filter categories..." :
                        activeTab === "fav" ? "Type to filter saved bookmarks..." :
                        activeTab === "profile" ? "Type to filter profile settings..." :
                        `Refine ${activeTab} preferences... (Press Enter)`
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-200 outline-none transition-colors"
                      id="global-search-input"
                    />
                    {globalSearchQuery && (
                      <button
                        onClick={() => handleGlobalSearchChange("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded hover:bg-slate-900 cursor-pointer"
                        title="Clear input"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Go/Search Button */}
                  {(activeTab === "index" || ["movies", "music", "games", "courses", "travel", "book", "food", "shopping"].includes(activeTab)) && (
                    <button
                      onClick={() => {
                        if (activeTab === "index") {
                          const trimmed = globalSearchQuery.trim();
                          if (trimmed) {
                            setCategoryPreferences(prev => ({
                              ...prev,
                              [indexSearchCategory]: trimmed
                            }));
                            saveRecentSearch(indexSearchCategory, trimmed);
                            setActiveTab(indexSearchCategory);
                          }
                        } else {
                          fetchRecommendations(activeTab, true);
                        }
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow shadow-purple-950/50"
                      id="global-search-submit-btn"
                    >
                      <span>{activeTab === "index" ? "Ask AI" : "Search"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Optional Quick suggestions text based on page context */}
              {(!globalSearchQuery || ["index", "movies", "music", "food"].includes(activeTab)) && (
                <div className="flex flex-wrap items-center gap-2 mb-5 -mt-3 px-1 text-[11px] text-slate-400">
                  <span className="font-mono text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Suggestions:
                  </span>
                  {(activeTab === "index" ? [
                    "Tamil action blockbusters",
                    "A.R. Rahman's debut Roja",
                    "Gritty North Chennai gangsters",
                    "Beautiful ambient lo-fi focus"
                  ] : activeTab === "movies" ? [
                    "Vikram (2022)",
                    "Nayagan classic",
                    "Ponniyin Selvan",
                    "Vada Chennai",
                    "Super Deluxe"
                  ] : activeTab === "music" ? [
                    "Hukum theme",
                    "A.R. Rahman melodies",
                    "Yuvan road trip",
                    "Kannodu Kanbathellam Carnatic"
                  ] : activeTab === "food" ? [
                    "Spicy Chettinad briyani",
                    "Classic South Indian filter coffee",
                    "Crispy masala dosa with sambar"
                  ] : []).map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        if (activeTab === "index") {
                          handleGlobalSearchChange(term);
                          if (term.toLowerCase().includes("rahman") || term.toLowerCase().includes("lo-fi")) {
                            setIndexSearchCategory("music");
                          } else if (term.toLowerCase().includes("briyani") || term.toLowerCase().includes("coffee") || term.toLowerCase().includes("dosa")) {
                            setIndexSearchCategory("food");
                          } else {
                            setIndexSearchCategory("movies");
                          }
                        } else {
                          handleGlobalSearchChange(term);
                          setCategoryPreferences(prev => ({
                            ...prev,
                            [activeTab]: term
                          }));
                          setTimeout(() => {
                            fetchRecommendations(activeTab, true);
                          }, 50);
                        }
                      }}
                      className="bg-slate-900/60 border border-slate-850 hover:border-purple-500/30 hover:bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded-full transition-all cursor-pointer hover:text-purple-300 text-[10px]"
                    >
                      "{term}"
                    </button>
                  ))}
                </div>
              )}
              
              {/* VIEW 1: INDEX.HTML (Home portal hub) */}
              {activeTab === "index" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col gap-6"
                  id="view-index"
                >
                  <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-slate-900 p-6 rounded-2xl border border-purple-900/30 relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 w-40 h-40 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="relative z-10 max-w-xl">
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Welcome to My RAS Portal
                      </h2>
                      <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                        A modern, multi-category **Recommendation and Advice System** (My RAS). 
                        This portal models a full-stack architecture mapping custom web interfaces to a 
                        powerful **Java Spring Boot backend** powered by generative intelligence models.
                      </p>
                      
                      <div className="flex flex-wrap gap-2.5 mt-5">
                        <button
                          onClick={() => setActiveTab("cate")}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Explore Categories Matrix</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href="#code-workspace"
                          className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Code2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>View Java Controller & Services</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Visual Bento Grid of categories */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Interactive Category Pages
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {pagesList
                        .filter(p => !["index", "fav", "profile", "cate"].includes(p.id))
                        .filter(p => {
                          if (!globalSearchQuery) return true;
                          const q = globalSearchQuery.toLowerCase();
                          return p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                        })
                        .map(page => {
                          const Icon = page.icon;
                          return (
                            <div 
                              key={page.id}
                              onClick={() => setActiveTab(page.id)}
                              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 group"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 rounded bg-slate-950 text-slate-300 group-hover:text-purple-400 transition-colors`}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                              </div>
                              <h4 className="text-xs font-mono font-semibold text-slate-200">{page.label}</h4>
                              <p className="text-[10px] text-slate-400 mt-1">{page.desc}</p>
                            </div>
                          );
                        })}
                      {pagesList
                        .filter(p => !["index", "fav", "profile", "cate"].includes(p.id))
                        .filter(p => {
                          if (!globalSearchQuery) return true;
                          const q = globalSearchQuery.toLowerCase();
                          return p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                        }).length === 0 && (
                          <div className="col-span-full text-center py-6 text-slate-500 text-xs font-mono bg-slate-900/20 border border-dashed border-slate-900/50 rounded-xl">
                            No matching category screens found for "{globalSearchQuery}".
                          </div>
                        )}
                    </div>
                  </div>

                  {/* System Summary Features card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide mb-2">
                        <Terminal className="w-4 h-4 text-purple-400" />
                        <span>Java REST Spring Orchestration</span>
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Incoming requests from the front-end (Step 1) hit the Spring Controller 
                        (`RasController.java`), which delegating params to the service layers. 
                        It communicates with the `GeminiApiClient.java` to craft clean prompt templates 
                        and return structured suggestion schemas.
                      </p>
                    </div>
                    
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide mb-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Gemini AI Cognitive Matching</span>
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Rather than hardcoded lookups, Gemini evaluates your detailed personal 
                        profile preferences and generates matching criteria. 
                        You can adjust your profile parameters under the `profile.html` tab to alter suggestions live!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* VIEW 2: CATE.HTML (Browse matrix) */}
              {activeTab === "cate" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col gap-4"
                  id="view-cate"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-purple-400" />
                        <span>Browse Categories Matrix (cate.html)</span>
                      </h2>
                      <p className="text-xs text-slate-400">Review, filter, and drill down into all the recommendation modules supported by My RAS.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pagesList
                      .filter(p => !["index", "fav", "profile", "cate"].includes(p.id))
                      .filter(p => {
                        if (!globalSearchQuery) return true;
                        const q = globalSearchQuery.toLowerCase();
                        return p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                      })
                      .map(p => {
                        const Icon = p.icon;
                        return (
                          <div key={p.id} className="bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-purple-900/40 transition-colors">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="p-1.5 bg-slate-950 text-purple-400 rounded">
                                  <Icon className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-200">{p.label}</span>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Access localized advice and structured predictions regarding {p.id}. Custom prompts format parameters automatically.
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-950 flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-mono">/{p.id}-api</span>
                              <button
                                onClick={() => setActiveTab(p.id)}
                                className="text-xs bg-purple-950 text-purple-300 border border-purple-900/60 hover:bg-purple-900/80 px-2.5 py-1 rounded transition-colors cursor-pointer"
                              >
                                Launch View
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {pagesList
                      .filter(p => !["index", "fav", "profile", "cate"].includes(p.id))
                      .filter(p => {
                        if (!globalSearchQuery) return true;
                        const q = globalSearchQuery.toLowerCase();
                        return p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                      }).length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-500 text-xs font-mono bg-slate-900/30 border border-dashed border-slate-850 rounded-xl w-full">
                          No category screens found matching filter "{globalSearchQuery}".
                        </div>
                      )}
                  </div>
                </motion.div>
              )}

              {/* VIEW 3: PROFILE.HTML (Configure user context) */}
              {activeTab === "profile" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col gap-4"
                  id="view-profile"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-400" />
                        <span>User Profile Context Configuration (profile.html)</span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Spring backend merges these parameters in the RecommendationRequest context to enrich suggestions.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 p-5 rounded-xl border border-slate-800">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        <span>Modify Persona Attributes</span>
                      </h3>

                      {(!globalSearchQuery || "username name nickname profile full name".includes(globalSearchQuery.toLowerCase())) && (
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">User Full Name / Nickname</label>
                          <input
                            type="text"
                            value={userProfile.username}
                            onChange={(e) => setUserProfile({ ...userProfile, username: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-200 outline-none transition-colors"
                          />
                        </div>
                      )}

                      {(!globalSearchQuery || "occupation job activity activities work daily".includes(globalSearchQuery.toLowerCase())) && (
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Occupation / Daily Activities</label>
                          <input
                            type="text"
                            value={userProfile.occupation}
                            onChange={(e) => setUserProfile({ ...userProfile, occupation: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-200 outline-none transition-colors"
                          />
                        </div>
                      )}

                      {((!globalSearchQuery || "diet food vegan vegetarian keto restrictions eating".split(" ").some(kw => globalSearchQuery.toLowerCase().includes(kw))) ||
                        (!globalSearchQuery || "skill tech level beginner experience developer code learning".split(" ").some(kw => globalSearchQuery.toLowerCase().includes(kw)))) ? (
                        <div className="grid grid-cols-2 gap-3">
                          {(!globalSearchQuery || "diet food vegan vegetarian keto restrictions eating".split(" ").some(kw => globalSearchQuery.toLowerCase().includes(kw))) && (
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Diet / Restrictions</label>
                              <select
                                value={userProfile.diet}
                                onChange={(e) => setUserProfile({ ...userProfile, diet: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg p-2 text-xs text-slate-200 outline-none transition-colors"
                              >
                                <option value="None">None</option>
                                <option value="Vegetarian">Vegetarian</option>
                                <option value="Vegan">Vegan</option>
                                <option value="Keto">Keto</option>
                                <option value="Gluten-Free">Gluten-Free</option>
                              </select>
                            </div>
                          )}

                          {(!globalSearchQuery || "skill tech level beginner experience developer code learning".split(" ").some(kw => globalSearchQuery.toLowerCase().includes(kw))) && (
                            <div>
                              <label className="block text-xs font-medium text-slate-400 mb-1">Skill Profile Level</label>
                              <select
                                value={userProfile.techSkill}
                                onChange={(e) => setUserProfile({ ...userProfile, techSkill: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg p-2 text-xs text-slate-200 outline-none transition-colors"
                              >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced / Expert</option>
                              </select>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {["username name nickname profile full name", "occupation job activity activities work daily", "diet food vegan vegetarian keto restrictions eating", "skill tech level beginner experience developer code learning"].every(term => {
                        if (!globalSearchQuery) return false;
                        const q = globalSearchQuery.toLowerCase();
                        return !term.split(" ").some(word => word.includes(q) || q.includes(word));
                      }) && (
                        <div className="text-center py-8 text-slate-500 text-xs font-mono bg-slate-950 rounded-xl border border-dashed border-slate-850">
                          No persona fields match search filter "{globalSearchQuery}".
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between bg-slate-950 p-4 rounded-lg border border-slate-850">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                          <Terminal className="w-3.5 h-3.5 text-slate-500" />
                          <span>Constructed Request Context Block</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                          When triggering a recommendation, these values are wrapped inside a structured payload. Here is the JSON mapped directly into the Java controller input:
                        </p>
                        
                        <pre className="text-[10px] font-mono text-emerald-400 bg-slate-900 p-3 rounded border border-slate-850 overflow-x-auto">
{JSON.stringify({
  category: activeTab,
  preferences: { search: categoryPreferences[activeTab] || "" },
  profile: userProfile
}, null, 2)}
                        </pre>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-900 text-slate-500 text-[10px] italic">
                        * Modifying profile details dynamically updates the prompts fed into our backend logic client.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* VIEW 4: FAV.HTML (Saved items) */}
              {activeTab === "fav" && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col gap-4"
                  id="view-fav"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                        <span>Saved Bookmarks & Favorites (fav.html)</span>
                      </h2>
                      <p className="text-xs text-slate-400">Browse recommendations you flagged across movies, food, music, and other sections.</p>
                    </div>

                    {favorites.length > 0 && (
                      <button 
                        onClick={() => saveFavorites([])}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                      >
                        Clear All Saved
                      </button>
                    )}
                  </div>

                  {favorites.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                      <Heart className="w-12 h-12 stroke-[1.5] mb-2 text-slate-600" />
                      <p className="text-sm font-medium">No bookmarks saved yet</p>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Browse any category page (like movies or books) and click the heart icon on any recommendation cards to save it here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="favorites-grid">
                      {favorites
                        .filter(rec => {
                          if (!globalSearchQuery) return true;
                          const q = globalSearchQuery.toLowerCase();
                          return rec.title.toLowerCase().includes(q) || 
                                 rec.description.toLowerCase().includes(q) || 
                                 rec.tags.some(tag => tag.toLowerCase().includes(q)) ||
                                 (rec.matchReason && rec.matchReason.toLowerCase().includes(q));
                        })
                        .map((rec) => (
                          <div key={rec.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl relative flex flex-col justify-between hover:border-slate-700 transition-all">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h3 className="font-bold text-sm text-slate-100">{rec.title}</h3>
                                <button 
                                  onClick={() => toggleFavorite(rec)}
                                  className="text-rose-500 hover:text-slate-400 p-1 rounded-lg bg-slate-950 transition-colors cursor-pointer"
                                  title="Remove from favorites"
                                >
                                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                                </button>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed mb-3">{rec.description}</p>
                              
                              <div className="flex flex-wrap gap-1 mb-3">
                                {rec.tags.map((tag, i) => (
                                  <span key={i} className="text-[9px] font-mono bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded border border-slate-850">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-slate-950 pt-2.5 mt-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                              <span>Rating: <strong className="text-amber-400 font-semibold text-xs">{rec.rating}</strong> / 5</span>
                              <span className="capitalize px-2 py-0.5 bg-slate-950 rounded text-slate-400 border border-slate-850">Saved Recommendation</span>
                            </div>
                          </div>
                        ))}
                      {favorites
                        .filter(rec => {
                          if (!globalSearchQuery) return true;
                          const q = globalSearchQuery.toLowerCase();
                          return rec.title.toLowerCase().includes(q) || 
                                 rec.description.toLowerCase().includes(q) || 
                                 rec.tags.some(tag => tag.toLowerCase().includes(q)) ||
                                 (rec.matchReason && rec.matchReason.toLowerCase().includes(q));
                        }).length === 0 && (
                          <div className="col-span-full text-center py-12 text-slate-500 text-xs font-mono bg-slate-900/30 border border-dashed border-slate-850 rounded-xl w-full">
                            No saved bookmarks match your search filter "{globalSearchQuery}".
                          </div>
                        )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* VIEW 5: DYNAMIC CATEGORY VIEWS (movies, music, games, courses, travel, book, food, shopping) */}
              {!["index", "cate", "profile", "fav"].includes(activeTab) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1 flex flex-col gap-4"
                >
                  {/* Category Header Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-purple-950 text-purple-400 rounded-lg">
                          {React.createElement(pagesList.find(p => p.id === activeTab)?.icon || Sparkles, { className: "w-4 h-4" })}
                        </span>
                        <h2 className="text-lg font-bold text-white uppercase tracking-tight">
                          {getActiveTabTitle()} View
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Active live system queries using your custom preferences context.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-60 md:w-80">
                        <Sliders className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          value={categoryPreferences[activeTab] || ""}
                          onChange={(e) => {
                            setCategoryPreferences({
                              ...categoryPreferences,
                              [activeTab]: e.target.value
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              fetchRecommendations(activeTab, true);
                            }
                          }}
                          placeholder="Refine search requirements (e.g. moody, retro...)"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none"
                        />
                      </div>
                      
                      <button
                        onClick={() => fetchRecommendations(activeTab, true)}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
                        title="Re-fetch with parameters"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>

                  {/* Recent Searches Row */}
                  {recentSearches.filter((item) => item.category === activeTab).length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap items-center gap-1.5 px-1 py-1 text-xs border-b border-slate-900/50 pb-3"
                    >
                      <span className="text-slate-500 text-[10px] font-mono mr-1 flex items-center gap-1 uppercase tracking-wider">
                        <History className="w-3 h-3 text-purple-400" /> Recent:
                      </span>
                      {recentSearches
                        .filter((item) => item.category === activeTab)
                        .slice(0, 5)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="inline-flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 hover:border-purple-500/50 hover:bg-slate-900 rounded-lg pl-2.5 pr-1 py-1 text-[11px] text-slate-300 transition-all shadow-sm"
                          >
                            <button
                              onClick={() => {
                                setCategoryPreferences(prev => ({ ...prev, [activeTab]: item.query }));
                                fetchRecommendations(activeTab, true);
                              }}
                              className="hover:text-purple-400 cursor-pointer text-left font-medium max-w-[150px] truncate"
                              title={`Click to search "${item.query}"`}
                            >
                              {item.query}
                            </button>
                            <button
                              onClick={() => removeRecentSearch(item.id)}
                              className="text-slate-500 hover:text-rose-400 hover:bg-slate-950 p-0.5 rounded transition-colors cursor-pointer"
                              title="Delete search entry"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      
                      <button
                        onClick={() => clearAllRecentSearches(activeTab)}
                        className="text-[10px] font-mono text-slate-500 hover:text-rose-400 cursor-pointer transition-colors hover:underline px-2 py-1 rounded hover:bg-rose-950/20"
                      >
                        Clear Category History
                      </button>
                    </motion.div>
                  )}

                  {/* Recommendations Display */}
                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                      <RefreshCw className="w-8 h-8 text-purple-500 animate-spin mb-3" />
                      <p className="text-xs font-medium text-slate-300">
                        Spring Backend contacting Gemini AI Model Endpoint...
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs font-mono">
                        POST /api/recommendations HTTP/1.1
                      </p>
                    </div>
                  ) : error ? (
                    <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-400">Offline Mock Recommendation Fallback</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Your active server is fully operational. To execute live queries using true cloud Gemini intelligence, please set your <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-300">GEMINI_API_KEY</code> environment variable. 
                        </p>
                        <button
                          onClick={() => fetchRecommendations(activeTab)}
                          className="mt-2.5 text-xs font-medium text-amber-400 underline hover:text-amber-300"
                        >
                          Retry AI Fetch Call
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Standard Recommendation Cards */}
                  {!loading && (
                    <div className="space-y-4">
                      {/* Interactive Tamil Music Visualizer Banner */}
                      {activeTab === "music" && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                          className="bg-slate-900/40 border border-purple-900/30 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative mb-2 shadow-md shadow-purple-950/5"
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <div className="flex gap-1.5 items-end h-8 px-2 bg-slate-950/40 py-1 rounded-md border border-slate-900">
                              {[1.2, 2.1, 1.5, 2.8, 1.8, 2.4, 1.1, 2.5, 1.9, 2.2].map((delay, index) => (
                                <motion.span
                                  key={index}
                                  className="w-1 bg-gradient-to-t from-pink-500 via-purple-500 to-rose-400 rounded-full"
                                  animate={{ height: ["20%", "100%", "20%"] }}
                                  transition={{
                                    duration: 1.0,
                                    repeat: Infinity,
                                    delay: delay * 0.2,
                                    ease: "easeInOut"
                                  }}
                                />
                              ))}
                            </div>
                            <div>
                              <p className="text-xs font-mono font-bold text-slate-200">ACTIVE STATION: KOLLEYWOOD FM 📻</p>
                              <p className="text-[10px] text-purple-400 font-mono animate-pulse">Now streaming selected Tamil Melodies, Symphonies & High-Octane Beats</p>
                            </div>
                          </div>
                          <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 z-10 text-[10px] font-mono text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span>TAMIL BEAT-SYNC ENGINE LIVE</span>
                          </div>
                          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                        </motion.div>
                      )}

                      {/* Interactive Tamil Cinema Reel Banner */}
                      {activeTab === "movies" && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                          className="bg-slate-900/40 border border-rose-900/30 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative mb-2 shadow-md shadow-rose-950/5"
                        >
                          <div className="flex items-center gap-3 relative z-10">
                            <div className="bg-rose-950/40 p-2.5 border border-rose-900/30 rounded-lg text-rose-400">
                              <Film className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-xs font-mono font-bold text-slate-200">TAMIL CINEMA COGNITIVE MATCHING ACTIVE 🎬</p>
                              <p className="text-[10px] text-rose-400 font-mono">Prioritizing legendary classics, action blocks, and critically-acclaimed Tamil masterpieces</p>
                            </div>
                          </div>
                          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase bg-slate-950/80 px-2.5 py-1 rounded border border-slate-850 z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            <span>Mani Ratnam & LCU Core Active</span>
                          </div>
                          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                        </motion.div>
                      )}

                      {recommendations.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 text-xs">
                          No customized suggestions loaded. Hit the refresh icon to query.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Sorting Control Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 bg-slate-900/40 border border-slate-850 p-3 rounded-xl gap-3">
                            <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              Showing <strong className="text-purple-400 font-bold">{recommendations.length}</strong> AI-curated results
                            </span>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">Order by:</span>
                              <div className="relative">
                                <select
                                  value={sortBy}
                                  onChange={(e) => setSortBy(e.target.value as "relevance" | "rating")}
                                  className="bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-slate-300 text-[11px] rounded px-2.5 py-1 pr-7 outline-none cursor-pointer appearance-none transition-colors"
                                  id="recommendations-sort-select"
                                >
                                  <option value="relevance">✨ Default / Relevance</option>
                                  <option value="rating">⭐️ Rating (High to Low)</option>
                                </select>
                                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...recommendations]
                              .sort((a, b) => {
                                if (sortBy === "rating") {
                                  const rA = typeof a.rating === "number" ? a.rating : parseFloat(a.rating) || 0;
                                  const rB = typeof b.rating === "number" ? b.rating : parseFloat(b.rating) || 0;
                                  return rB - rA;
                                }
                                return 0;
                              })
                              .map((rec, cardIdx) => {
                                const isFav = favorites.some(f => f.id === rec.id);
                                return (
                                  <motion.div
                                    key={rec.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: cardIdx * 0.08 }}
                                    whileHover={{ y: -4, scale: 1.01, borderColor: "rgba(168, 85, 247, 0.4)" }}
                                    className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between transition-colors hover:shadow-lg hover:shadow-purple-950/10"
                                  >
                                    <div>
                                      {/* Title & Favorite */}
                                      <div className="flex justify-between items-start gap-2 mb-2">
                                        <h3 className="font-bold text-sm text-slate-100 hover:text-purple-400 transition-colors">
                                          {rec.title}
                                        </h3>
                                        <button
                                          onClick={() => toggleFavorite(rec)}
                                          className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                                            isFav
                                              ? "bg-rose-950/60 border-rose-900 text-rose-400"
                                              : "bg-slate-950 border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-900/30"
                                          }`}
                                          title={isFav ? "Remove Bookmark" : "Add Bookmark"}
                                        >
                                          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-rose-500 stroke-rose-500" : ""}`} />
                                        </button>
                                      </div>

                                      {/* Tags */}
                                      <div className="flex flex-wrap gap-1 mb-2.5">
                                        {rec.tags.map((tag, idx) => (
                                          <span
                                            key={idx}
                                            className="text-[9px] font-mono bg-slate-950 border border-slate-850 text-slate-300 px-1.5 py-0.5 rounded"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>

                                      {/* Description */}
                                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                        {rec.description}
                                      </p>

                                      {/* Match Reason (AI personalized insight) */}
                                      {rec.matchReason && (
                                        <div className="bg-purple-950/20 border border-purple-900/30 p-2.5 rounded-lg mb-3">
                                          <p className="text-[11px] text-purple-300 leading-normal flex items-start gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                                            <span>
                                              <strong>Advice:</strong> {rec.matchReason}
                                            </span>
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Dynamic Category Specific Metadata */}
                                    <div className="border-t border-slate-950 pt-3 mt-1 flex flex-wrap justify-between items-center gap-2">
                                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                                        {Object.entries(rec.metadata || {}).map(([key, val]) => (
                                          <span key={key} className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px]">
                                            <strong className="text-slate-500 uppercase text-[9px] mr-1">{key}:</strong> 
                                            {val}
                                          </span>
                                        ))}
                                      </div>

                                      <div className="text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-850 px-2.5 py-0.5 rounded shrink-0">
                                        Rating Score: <strong className="text-amber-400 font-semibold text-xs">{rec.rating}</strong>
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Interactive Architecture & Flow Visualizer */}
          <div id="architecture-section" className="bg-slate-900/80 border border-slate-900 rounded-2xl p-6 flex flex-col gap-5">
            <div>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-950/60 border border-purple-900/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                System Workflow
              </span>
              <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>My RAS Communication Architecture (Interactive)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Your uploaded design diagrams show 4 steps of critical system communication. 
                Hover or click through steps below to trace execution live:
              </p>
            </div>

            {/* Architecture interactive flow chart block */}
            <div className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
              
              {/* STEP A: Front End */}
              <div className={`p-4 rounded-lg border transition-all ${
                architectureStep === 1 || architectureStep === 4
                  ? 'bg-blue-950/20 border-blue-500/80 shadow-lg shadow-blue-900/10'
                  : 'bg-slate-900/40 border-slate-850'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-slate-950 text-xs flex items-center justify-center font-bold">1</span>
                  <h4 className="text-xs font-mono font-bold text-blue-300">Front End (HTML + Tailwind)</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  User configures filter preferences on file interfaces like <code className="text-slate-200">movies.html</code> or <code className="text-slate-200">food.html</code>.
                </p>
                
                {/* Arrow out */}
                <div className="mt-3 flex items-center justify-between bg-slate-950/60 p-2 rounded text-[10px] font-mono border border-slate-900">
                  <span className="text-slate-500">Step 1: REST Send</span>
                  <ArrowRight className={`w-3 h-3 text-blue-400 ${architectureStep === 1 ? 'animate-bounce' : ''}`} />
                </div>
              </div>

              {/* STEP B: Java Spring Boot Backend */}
              <div className={`p-4 rounded-lg border transition-all ${
                architectureStep === 2 || architectureStep === 3
                  ? 'bg-purple-950/30 border-purple-500/80 shadow-lg shadow-purple-900/10'
                  : 'bg-slate-900/40 border-slate-850'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 text-xs flex items-center justify-center font-bold">2</span>
                  <h4 className="text-xs font-mono font-bold text-purple-300">Back End (Java Core)</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Spring RestController processes preferences. Orchestrates prompt formats inside <code className="text-slate-200">RecommendationService.java</code>.
                </p>

                <div className="mt-3 flex items-center justify-between bg-slate-950/60 p-2 rounded text-[10px] font-mono border border-slate-900">
                  <span className="text-slate-500">Step 2 & 3: API Pipeline</span>
                  <ArrowRight className={`w-3 h-3 text-purple-400 ${architectureStep === 2 || architectureStep === 3 ? 'animate-pulse' : ''}`} />
                </div>
              </div>

              {/* STEP C: External Recommendation API */}
              <div className={`p-4 rounded-lg border transition-all ${
                architectureStep === 3
                  ? 'bg-emerald-950/20 border-emerald-500/80 shadow-lg shadow-emerald-900/10'
                  : 'bg-slate-900/40 border-slate-850'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-xs flex items-center justify-center font-bold">3</span>
                  <h4 className="text-xs font-mono font-bold text-emerald-300">Qloo / LLM Gemini API</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The artificial intelligence processes parameters, evaluating scores, context tags, and matching rationale.
                </p>

                <div className="mt-3 flex items-center justify-between bg-slate-950/60 p-2 rounded text-[10px] font-mono border border-slate-900">
                  <span className="text-slate-500">Step 4: Returns JSON</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400 rotate-180" />
                </div>
              </div>

            </div>

            {/* Manual Step Description Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              {[
                { label: "Cycle Overview", step: 0 },
                { label: "1. HTTP Request (Send Params)", step: 1 },
                { label: "2. Controller $\\rightarrow$ Client", step: 2 },
                { label: "3. API Response (Fetch JSON)", step: 3 },
                { label: "4. Render Output (Receive)", step: 4 }
              ].map((obj, i) => (
                <button
                  key={i}
                  onClick={() => setArchitectureStep(obj.step)}
                  className={`p-2 rounded-lg font-mono text-[10px] transition-colors border cursor-pointer ${
                    architectureStep === obj.step
                      ? 'bg-purple-900 text-purple-100 border-purple-700'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>

          {/* Code Workspace: Spring Boot Java Blueprints */}
          <div id="code-workspace" className="bg-slate-900/80 border border-slate-900 rounded-2xl overflow-hidden flex flex-col">
            
            {/* Header of IDE tab */}
            <div className="bg-slate-950 border-b border-slate-850 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Java Spring Boot Source Code Workspace</h3>
                  <p className="text-[11px] text-slate-400">
                    Browse, modify or copy the exact backend codebase blueprints requested.
                  </p>
                </div>
              </div>

              {/* Java class selectors */}
              <div className="flex flex-wrap gap-1.5" id="java-file-selectors">
                {JAVA_SOURCE_FILES.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => setSelectedJavaFile(file)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors border cursor-pointer ${
                      selectedJavaFile.name === file.name
                        ? "bg-purple-900/80 border-purple-700 text-purple-200 font-semibold"
                        : "bg-slate-900 border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </div>

            {/* IDE code workspace */}
            <div className="p-4 bg-slate-950 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900 px-3.5 py-2.5 rounded-lg border border-slate-850">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-slate-300 truncate max-w-xs md:max-w-md">{selectedJavaFile.path}</span>
                </div>
                
                <button
                  onClick={() => handleCopyCode(selectedJavaFile)}
                  className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-purple-300 border border-slate-850 px-2.5 py-1 rounded transition-colors text-[11px] font-medium font-mono cursor-pointer"
                >
                  {copiedFile === selectedJavaFile.name ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Brief File Description */}
              <div className="text-xs text-slate-400 px-1 py-1 leading-relaxed">
                <strong>Description:</strong> {selectedJavaFile.description}
              </div>

              {/* Code window with line numbers */}
              <div className="relative bg-slate-900 rounded-xl border border-slate-850 max-h-[420px] overflow-y-auto">
                <pre className="p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
                  <code>{selectedJavaFile.code}</code>
                </pre>
              </div>
            </div>

            {/* Java deploy advice banner */}
            <div className="bg-slate-950 border-t border-slate-900 p-4 flex items-start gap-3">
              <div className="p-2 bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 rounded-lg shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">How to run in your Java project:</strong> Place these classes in your <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 text-[11px] font-mono">src/main/java</code> directory corresponding to their package paths. Ensure you have <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 text-[11px] font-mono">spring-boot-starter-web</code> and <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 text-[11px] font-mono">jackson-databind</code> in your maven/gradle build config, then run.
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 mt-12 text-center text-xs text-slate-500" id="ras-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 My RAS - Recommendation and Advice System. Designed according to communication workflows.</p>
          <div className="flex gap-4">
            <a href="#ras-main-container" className="hover:text-slate-300 transition-colors">Back to Top</a>
            <span>•</span>
            <span className="text-purple-400 font-semibold font-mono">Java Backend Blueprint Active</span>
          </div>
        </div>
      </footer>

      {/* Floating "Ask Expert" Chat Overlay & FAB */}
      {["movies", "music", "games", "courses", "travel", "book", "food", "shopping"].includes(activeTab) && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
          {/* Chat Window */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-[340px] sm:w-[380px] h-[480px] bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl shadow-purple-950/20 overflow-hidden flex flex-col pointer-events-auto backdrop-blur-md"
                id="ask-expert-chat-window"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-purple-950 border-b border-slate-850 p-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                        {activeTab} Expert Advisor
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        Online & Ready
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Minimize"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Info Tip about Recommendations Context */}
                <div className="bg-purple-950/20 border-b border-purple-900/10 px-4 py-2.5 flex items-start gap-2 text-[10px] text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    Analyzing the <strong>{recommendations.length} recommendations</strong> currently listed on your screen.
                  </span>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col" id="chat-messages-container">
                  {(chatMessages[activeTab] || [
                    { role: "assistant", content: getWelcomeMessage(activeTab) }
                  ]).map((msg, idx) => {
                    const isAssistant = msg.role === "assistant";
                    return (
                      <div
                        key={idx}
                        className={`flex gap-2 max-w-[85%] ${
                          isAssistant ? "self-start" : "self-end flex-row-reverse"
                        }`}
                      >
                        {isAssistant && (
                          <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-purple-400">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className={`p-3 rounded-2xl ${
                            isAssistant
                              ? "bg-slate-900/80 border border-slate-850 text-slate-200 rounded-tl-none"
                              : "bg-purple-900 text-slate-100 rounded-tr-none shadow-md shadow-purple-900/10"
                          }`}
                        >
                          {renderMessageContent(msg.content)}
                        </div>
                      </div>
                    );
                  })}
                  {isChatSending && (
                    <div className="flex gap-2 max-w-[85%] self-start">
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-purple-400">
                        <Bot className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 py-2.5">
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="p-3 bg-slate-900 border-t border-slate-850 flex gap-2 items-center shrink-0 pointer-events-auto"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={`Ask about these ${activeTab}...`}
                    disabled={isChatSending}
                    className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatSending}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      chatInput.trim() && !isChatSending
                        ? "bg-purple-900 border-purple-700 text-purple-200 hover:bg-purple-850 hover:scale-105 active:scale-95"
                        : "bg-slate-950 border-slate-850 text-slate-600 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Action Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-purple-900 to-indigo-950 hover:from-purple-850 hover:to-indigo-900 border border-purple-600/30 text-white font-bold shadow-lg shadow-purple-950/40 cursor-pointer text-xs uppercase tracking-wider font-mono hover:border-purple-500/60"
            id="ask-expert-fab"
          >
            <MessageSquare className="w-4 h-4 text-purple-300" />
            <span>Ask {activeTab} Expert</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
