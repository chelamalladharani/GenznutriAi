import React, { useState, useEffect } from "react";
import { FoodItem, UserProfile, MealLog, MealPlanning } from "./types";
import { COMMON_FOOD_ITEMS } from "./data";
import ProfileTab from "./components/ProfileTab";
import MealPlannerTab from "./components/MealPlannerTab";
import {
  Flame,
  Search,
  Plus,
  BookOpen,
  History,
  TrendingUp,
  Heart,
  User,
  Trash2,
  Calendar,
  Sparkles,
  Info,
  Check,
  Apple
} from "lucide-react";

export default function App() {
  // Active state trackers
  const [activeTab, setActiveTab] = useState<"tracker" | "planner" | "profile">("tracker");
  const [searchQuery, setSearchQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [analyzedItem, setAnalyzedItem] = useState<FoodItem | null>(null);

  // Active temporary meal log items (accumulator for the day before log submission)
  const [currentMealItems, setCurrentMealItems] = useState<FoodItem[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");

  // User Profile with Persistence
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("genznutria_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading profile localstorage", e);
      }
    }
    return {
      name: "Challenger",
      calorieGoal: 2000,
      favoriteFoods: [],
      mealsHistory: [],
    };
  });

  // Planned meals persistent workspace
  const [plannedMeals, setPlannedMeals] = useState<MealPlanning>(() => {
    const saved = localStorage.getItem("genznutria_plans");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading meal plans localstorage", e);
      }
    }
    return {
      breakfast: [],
      lunch: [],
      dinner: [],
    };
  });

  // Keep localstorage synchronized on updates
  useEffect(() => {
    localStorage.setItem("genznutria_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("genznutria_plans", JSON.stringify(plannedMeals));
  }, [plannedMeals]);

  // Handle analytical requests to Express API proxy (calling Gemini SDK behind proxy)
  const handleAnalyzeFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setAnalyzing(true);
    setSearchError("");
    setAnalyzedItem(null);

    try {
      const response = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error("Unable to analyze nutrition. Please write a recognized edible ingredient or dish.");
      }

      const parsed = await response.json();
      if (parsed.isValidFood === false) {
        setSearchError("Wait, that doesn't look like food. Describe a genuine edible ingredient or meal combination!");
      } else {
        setAnalyzedItem({
          name: parsed.name,
          calories: Number(parsed.calories) || 0,
          protein: Number(parsed.protein) || 0,
          carbs: Number(parsed.carbs) || 0,
          fat: Number(parsed.fat) || 0,
          fiber: Number(parsed.fiber) || 0,
          servingSize: parsed.servingSize,
          description: parsed.description || "",
        });
      }
    } catch (err: any) {
      setSearchError(err.message || "Failed to analyze food details. Try again in a moment.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Add analyzed food item to active day list
  const addFoodToCurrentTracker = (item: FoodItem) => {
    setCurrentMealItems((prev) => [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }]);
  };

  // Safe toggler for favorite foods
  const toggleFavorite = (item: FoodItem) => {
    const exists = profile.favoriteFoods.some((f) => f.name.toLowerCase() === item.name.toLowerCase());
    let updatedFavs = [];
    if (exists) {
      updatedFavs = profile.favoriteFoods.filter((f) => f.name.toLowerCase() !== item.name.toLowerCase());
    } else {
      updatedFavs = [...profile.favoriteFoods, item];
    }
    setProfile({
      ...profile,
      favoriteFoods: updatedFavs,
    });
  };

  // Save the temporary list of active tracker foods into history
  const saveCurrentLogsToHistory = () => {
    if (currentMealItems.length === 0) return;

    const totalCals = currentMealItems.reduce((acc, c) => acc + c.calories, 0);
    const totalProt = currentMealItems.reduce((acc, c) => acc + c.protein, 0);
    const totalCarb = currentMealItems.reduce((acc, c) => acc + c.carbs, 0);
    const totalFat = currentMealItems.reduce((acc, c) => acc + c.fat, 0);
    const totalFib = currentMealItems.reduce((acc, c) => acc + c.fiber, 0);

    const newLog: MealLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      mealType: selectedMealType,
      foodItems: currentMealItems,
      totalCalories: totalCals,
      totalProtein: totalProt,
      totalCarbs: totalCarb,
      totalFat: totalFat,
      totalFiber: totalFib,
    };

    setProfile({
      ...profile,
      mealsHistory: [newLog, ...profile.mealsHistory],
    });

    // Reset current active workspace
    setCurrentMealItems([]);
    alert("Superb! Meal logged to history workflow successfully.");
  };

  const removeHistoryItem = (logId: string) => {
    setProfile({
      ...profile,
      mealsHistory: profile.mealsHistory.filter((log) => log.id !== logId),
    });
  };

  // Daily statistics for active items currently in tracker, plus everything logged today
  const getTodayLoggedCalories = () => {
    const todayStr = new Date().toDateString();
    
    // Add up calories from logs submitted today
    const historicToday = profile.mealsHistory
      .filter((log) => new Date(log.timestamp).toDateString() === todayStr)
      .reduce((sum, log) => sum + log.totalCalories, 0);

    // Add up active non-submitted items inside current session
    const currentActive = currentMealItems.reduce((sum, item) => sum + item.calories, 0);

    return historicToday + currentActive;
  };

  const deleteCurrentTrackerItem = (index: number) => {
    const updated = [...currentMealItems];
    updated.splice(index, 1);
    setCurrentMealItems(updated);
  };

  const todayConsumed = getTodayLoggedCalories();

  return (
    <div className="min-h-screen bg-white text-black font-sans antialiased flex flex-col">
      {/* Dynamic Navigation Bar (Responsively adapts to mobile) */}
      <header className="border-b border-neutral-200 sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Brand centering green emblem */}
          <div className="flex items-center gap-2.5">
            <img 
              src="/src/assets/images/gz_logo_1779594483331.png" 
              alt="GenZNutriAI Logo" 
              className="w-10 h-10 object-contain rounded-xl border border-neutral-100 p-0.5 shadow-2xs shrink-0 bg-white"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="font-mono text-[9px] font-extrabold text-green-600 block leading-none tracking-widest uppercase">
                AI Powered Nutrition
              </span>
              <h1 className="text-xl font-black text-black font-sans leading-none tracking-tight">
                GenZNutriAI
              </h1>
            </div>
          </div>

          {/* Persistent Stats Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] text-neutral-400 font-mono">DAILY CONSUMED</span>
              <span className="text-sm font-extrabold text-black">
                {todayConsumed} / {profile.calorieGoal} kcal
              </span>
            </div>

            {/* Global navigation tabs matching strict white & black theme with green accent highlights */}
            <nav className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
              <button
                onClick={() => setActiveTab("tracker")}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "tracker"
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                <TrendingUp size={12} />
                Tracker
              </button>
              <button
                onClick={() => setActiveTab("planner")}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "planner"
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                <Calendar size={12} />
                Planner
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "profile"
                    ? "bg-black text-white"
                    : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                }`}
              >
                <User size={13} />
                Profile
              </button>
            </nav>
          </div>

        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB 1: INSTANT NUTRITION TRACKER */}
        {activeTab === "tracker" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Interactive Search Hero with White Background & High Contrast elements */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 md:p-10 text-center space-y-6 max-w-4xl mx-auto shadow-xs">
              <div className="inline-flex py-1 px-3 bg-green-50 rounded-full border border-green-200 text-green-700 text-xs font-mono font-bold uppercase tracking-wider items-center gap-1.5">
                <Sparkles size={12} className="text-green-600" />
                Next-Gen Caloric Intelligence
              </div>
              <h2 className="text-2xl md:text-4xl font-black text-black tracking-tight leading-tight">
                Any Food. Any Portion. <br />
                <span className="text-green-600 text-3xl md:text-5xl">Parsed Instantly.</span>
              </h2>
              <p className="text-sm text-neutral-500 max-w-xl mx-auto font-sans leading-relaxed">
                Describe a single snack, full ingredients sheet, or entire takeout dish. Our backend queries deep Gemini models to provide macro estimates instantly.
              </p>

              {/* Analyzer Query Form */}
              <form onSubmit={handleAnalyzeFood} className="max-w-2xl mx-auto relative flex flex-col sm:flex-row gap-2.5 pt-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. 150g grilled chicken, half cup boiled basmati rice and avocado slice"
                    className="w-full text-sm pl-10 pr-3 py-3.5 bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 font-sans text-black"
                  />
                </div>
                <button
                  type="submit"
                  disabled={analyzing}
                  className="px-6 py-3.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  {analyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Flame size={14} className="text-green-500" />
                      Get Nutrition
                    </>
                  )}
                </button>
              </form>

              {searchError && (
                <div className="max-w-xl mx-auto p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-mono">
                  📊 {searchError}
                </div>
              )}

              {/* Parsed Result Display Screen */}
              {analyzedItem && (
                <div className="max-w-2xl mx-auto bg-neutral-50 border border-neutral-200 rounded-2xl p-6 text-left space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3 border-b border-neutral-200">
                    <div>
                      <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                        AI Verified Servings
                      </span>
                      <h3 className="text-lg font-black text-black leading-tight mt-1">{analyzedItem.name}</h3>
                      <p className="text-xs text-neutral-500 font-mono">Analyzed serve size: {analyzedItem.servingSize}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(analyzedItem)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                          profile.favoriteFoods.some((f) => f.name.toLowerCase() === analyzedItem.name.toLowerCase())
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-white text-neutral-400 border-neutral-200 hover:text-rose-500"
                        }`}
                        title="Favorite Food Preset"
                      >
                        <Heart size={16} fill={profile.favoriteFoods.some((f) => f.name.toLowerCase() === analyzedItem.name.toLowerCase()) ? "currentColor" : "none"} />
                      </button>

                      <div className="bg-black text-white px-3 py-1.5 rounded-xl text-center">
                        <span className="block text-[8px] font-mono text-neutral-400 leading-none">ENERGY</span>
                        <span className="text-base font-black font-sans">{analyzedItem.calories} kcal</span>
                      </div>
                    </div>
                  </div>

                  {analyzedItem.description && (
                    <p className="text-xs text-neutral-650 text-neutral-550 border-neutral-100 italic bg-white p-3 rounded-lg border">
                      {analyzedItem.description}
                    </p>
                  )}

                  {/* Core Macronutrient Metrics Meter grid */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-1">
                    <div className="bg-white p-3 rounded-xl border border-neutral-200">
                      <span className="block text-[9px] font-mono text-neutral-400 font-bold">Protein</span>
                      <span className="text-sm font-extrabold text-green-600">{analyzedItem.protein}g</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-neutral-200">
                      <span className="block text-[9px] font-mono text-neutral-400 font-bold">Carbs</span>
                      <span className="text-sm font-extrabold text-neutral-800">{analyzedItem.carbs}g</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-neutral-200">
                      <span className="block text-[9px] font-mono text-neutral-400 font-bold">Fat</span>
                      <span className="text-sm font-extrabold text-neutral-800">{analyzedItem.fat}g</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-neutral-200">
                      <span className="block text-[9px] font-mono text-neutral-400 font-bold">Fiber</span>
                      <span className="text-sm font-extrabold text-green-600">{analyzedItem.fiber}g</span>
                    </div>
                  </div>

                  {/* Add action buttons */}
                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => {
                        addFoodToCurrentTracker(analyzedItem);
                        setAnalyzedItem(null);
                        setSearchQuery("");
                      }}
                      className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-mono text-xs font-bold uppercase rounded-xl tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      Add to Log Builder
                    </button>
                    <button
                      onClick={() => setAnalyzedItem(null)}
                      className="px-4 py-3 bg-neutral-250 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-mono text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Quick-select commonly eaten foods & Current logger builder block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Section: Daily Log Accumulator Builder (7 cols) */}
              <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                      <BookOpen size={20} className="text-green-600" />
                      Log Builder Workspace
                    </h3>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5">Collect items inside here to record your meals</p>
                  </div>

                  {currentMealItems.length > 0 && (
                    <button
                      onClick={() => setCurrentMealItems([])}
                      className="text-xs text-rose-600 font-mono hover:underline cursor-pointer"
                    >
                      Clear Accumulator
                    </button>
                  )}
                </div>

                {currentMealItems.length === 0 ? (
                  <div className="text-center py-16 bg-neutral-50/50 rounded-xl border-dashed border-2 border-neutral-200">
                    <p className="text-sm text-neutral-400">Your log builder is currently empty.</p>
                    <p className="text-xs text-neutral-400 font-mono mt-1">Look up foods with AI or click dynamic items in the common library below!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Item list inside today workspace */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {currentMealItems.map((item, index) => (
                        <div key={item.id || index} className="p-3 bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 transition-all rounded-xl flex justify-between items-center gap-2">
                          <div>
                            <p className="font-sans font-bold text-xs text-neutral-900">{item.name}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              Portion: {item.servingSize} • <span className="text-black font-semibold">{item.calories} kcal</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-400 bg-white border px-1.5 py-0.5 rounded">
                              P: {item.protein} | C: {item.carbs}
                            </span>
                            <button
                              onClick={() => deleteCurrentTrackerItem(index)}
                              className="p-1 px-1.5 text-neutral-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selector & Submission Segment */}
                    <div className="pt-4 border-t border-neutral-100 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                        <div className="flex items-center gap-1.5 self-start sm:self-center">
                          <label className="text-xs font-mono font-bold text-neutral-500 uppercase mr-1">Meal category:</label>
                          <select
                            value={selectedMealType}
                            onChange={(e: any) => setSelectedMealType(e.target.value)}
                            className="bg-neutral-100 border border-neutral-300 text-xs py-1 px-2.5 rounded-md font-mono font-bold focus:outline-none text-black"
                          >
                            <option value="breakfast">Breakfast 🍳</option>
                            <option value="lunch">Lunch 🥗</option>
                            <option value="dinner">Dinner 🍽️</option>
                            <option value="snack">Snack 🧁</option>
                          </select>
                        </div>

                        {/* Totals */}
                        <div className="text-right">
                          <span className="text-[10px] text-neutral-450 font-mono block">ACCUMULATIVE VALUE</span>
                          <span className="text-lg font-black text-black">
                            {currentMealItems.reduce((s, i) => s + i.calories, 0)} kcal
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={saveCurrentLogsToHistory}
                        className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Check size={14} className="text-green-500" />
                        Write and Lock Active Log to History
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Section: Common Foods Library (5 cols) */}
              <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-200">
                  <div className="p-1.5 bg-green-100 text-green-700 rounded-lg">
                    <Apple size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest leading-none">Common Library</h3>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Quick selections</p>
                  </div>
                </div>

                {/* Common Food List */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {COMMON_FOOD_ITEMS.map((item, index) => (
                    <div
                      key={item.name + "-com-" + index}
                      className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                    >
                      <div>
                        <h4 className="font-sans font-bold text-xs text-neutral-900">{item.name}</h4>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {item.servingSize} • <span className="text-black font-semibold">{item.calories} kcal</span>
                        </p>
                        <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                          Protein: {item.protein}g | Carbs: {item.carbs}g | Fat: {item.fat}g
                        </p>
                      </div>

                      <div className="flex gap-1 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => toggleFavorite(item)}
                          className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                            profile.favoriteFoods.some((f) => f.name.toLowerCase() === item.name.toLowerCase())
                              ? "bg-rose-50 border-rose-200 text-rose-600"
                              : "bg-white border-neutral-300 text-neutral-400 hover:text-rose-500"
                          }`}
                          title={profile.favoriteFoods.some((f) => f.name.toLowerCase() === item.name.toLowerCase()) ? "Remove Favorite" : "Favorite"}
                        >
                          <Heart size={11} fill={profile.favoriteFoods.some((f) => f.name.toLowerCase() === item.name.toLowerCase()) ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => addFoodToCurrentTracker(item)}
                          className="px-2.5 py-1.5 bg-black hover:bg-neutral-800 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          + Log
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* History of logged meals and their nutritional information */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <History size={20} className="text-green-600" />
                  <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Your History of Logged Meals</h3>
                </div>
                <span className="text-xs font-mono bg-neutral-100 border border-neutral-200 text-neutral-600 px-2.5 py-1 rounded-md font-bold">
                  {profile.mealsHistory.length} Recorded Entries
                </span>
              </div>

              {profile.mealsHistory.length === 0 ? (
                <div className="text-center py-12 bg-neutral-50/50 rounded-xl">
                  <p className="text-sm text-neutral-550 text-neutral-450 italic font-mono">No previous meal histories tracked in database yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.mealsHistory.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors bg-neutral-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold bg-black text-white py-0.5 px-2 rounded capitalize">
                            {log.mealType}
                          </span>
                          <span className="text-xs text-neutral-500 font-mono">
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-black text-black">
                              {log.totalCalories} kcal
                            </span>
                            <span className="block text-[8px] font-mono text-neutral-400">Total</span>
                          </div>
                          <button
                            onClick={() => removeHistoryItem(log.id)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove log entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Food items parsed sub-list */}
                      <div className="bg-white/75 border border-neutral-150 p-2.5 rounded-lg text-xs space-y-1">
                        <span className="block text-[9px] font-mono text-neutral-400 uppercase font-semibold">Packed Dishes included:</span>
                        {log.foodItems.map((item, idX) => (
                          <div key={idX} className="flex justify-between items-center text-[11px] text-neutral-700">
                            <span>• {item.name} ({item.servingSize})</span>
                            <span className="font-mono text-neutral-500 font-bold">{item.calories} kcal</span>
                          </div>
                        ))}
                      </div>

                      {/* Cumulative macro values for easy history display */}
                      <div className="grid grid-cols-4 gap-1 text-center bg-white/75 border border-neutral-200 p-2 rounded-lg">
                        <div className="text-[10px] font-mono select-none">
                          <span className="text-neutral-400 text-[8px] block uppercase font-bold">Protein</span>
                          <span className="text-green-700 font-extrabold">{log.totalProtein.toFixed(1)}g</span>
                        </div>
                        <div className="text-[10px] font-mono select-none">
                          <span className="text-neutral-400 text-[8px] block uppercase font-bold">Carbs</span>
                          <span className="text-neutral-800 font-bold">{log.totalCarbs.toFixed(1)}g</span>
                        </div>
                        <div className="text-[10px] font-mono select-none">
                          <span className="text-neutral-400 text-[8px] block uppercase font-bold">Fat</span>
                          <span className="text-neutral-900 font-bold">{log.totalFat.toFixed(1)}g</span>
                        </div>
                        <div className="text-[10px] font-mono select-none">
                          <span className="text-neutral-400 text-[8px] block uppercase font-bold">Fiber</span>
                          <span className="text-green-700 font-extrabold">{log.totalFiber.toFixed(1)}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: MEAL PLANNER */}
        {activeTab === "planner" && (
          <div className="animate-fadeIn">
            <MealPlannerTab
              profile={profile}
              plannedMeals={plannedMeals}
              onUpdatePlannedMeals={setPlannedMeals}
            />
          </div>
        )}

        {/* TAB 3: ACCOUNT & USER PROFILE AND PRIVACY */}
        {activeTab === "profile" && (
          <div className="animate-fadeIn">
            <ProfileTab
              profile={profile}
              onUpdateProfile={setProfile}
              dailyConsumed={todayConsumed}
            />
          </div>
        )}

      </main>

      {/* Styled minimalistic dark workspace footers */}
      <footer className="bg-neutral-50 border-t border-neutral-200 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center text-green-600">
              <Apple size={13} />
            </div>
            <span className="text-xs font-bold text-black font-sans">
              GenZNutriAI Workspace
            </span>
          </div>

          <div className="text-[11px] text-neutral-400 font-mono">
            Powered by Google Gemini-3.5-Flash. Active LocalStorage Client DB.
          </div>
        </div>
      </footer>
    </div>
  );
}
