import React, { useState } from "react";
import { FoodItem, MealPlanning, UserProfile } from "../types";
import { COMMON_FOOD_ITEMS } from "../data";
import { Utensils, Search, PlusCircle, Trash, Award, Flame, Wheat, Activity, Leaf, MessageSquareCode } from "lucide-react";

interface MealPlannerTabProps {
  profile: UserProfile;
  plannedMeals: MealPlanning;
  onUpdatePlannedMeals: (updated: MealPlanning) => void;
}

export default function MealPlannerTab({ profile, plannedMeals, onUpdatePlannedMeals }: MealPlannerTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [tempFoodDetail, setTempFoodDetail] = useState<FoodItem | null>(null);

  // Quick helper to handle custom server-side search directly
  const handleCustomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setAnalyzing(true);
    setSearchError("");
    setTempFoodDetail(null);

    try {
      const response = await fetch("/api/nutrition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error("Unable to analyze nutrition. Please try again with a descriptive food name.");
      }

      const data = await response.json();
      if (data.isValidFood === false) {
        setSearchError("Wait, that doesn't look like an edible item. Write a clear food or plate description.");
      } else {
        setTempFoodDetail({
          name: data.name,
          calories: Number(data.calories) || 0,
          protein: Number(data.protein) || 0,
          carbs: Number(data.carbs) || 0,
          fat: Number(data.fat) || 0,
          fiber: Number(data.fiber) || 0,
          servingSize: data.servingSize,
          description: data.description || "",
        });
      }
    } catch (err: any) {
      setSearchError(err.message || "Something went wrong querying GenZNutriAI.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Add a food item to a specific meal key
  const addFoodToMeal = (mealKey: "breakfast" | "lunch" | "dinner", item: FoodItem) => {
    const updated = { ...plannedMeals };
    updated[mealKey] = [...updated[mealKey], { ...item, id: Math.random().toString(36).substr(2, 9) }];
    onUpdatePlannedMeals(updated);
  };

  // Remove a food item from a specific meal key
  const removeFoodFromMeal = (mealKey: "breakfast" | "lunch" | "dinner", index: number) => {
    const updated = { ...plannedMeals };
    const list = [...updated[mealKey]];
    list.splice(index, 1);
    updated[mealKey] = list;
    onUpdatePlannedMeals(updated);
  };

  // Clears planned meals for the whole day
  const clearAllPlanning = () => {
    onUpdatePlannedMeals({
      breakfast: [],
      lunch: [],
      dinner: [],
    });
  };

  // Mathematical Aggregators for Meal statistics
  const getMealMacros = (items: FoodItem[]) => {
    return items.reduce(
      (acc, curr) => {
        acc.calories += curr.calories;
        acc.protein += curr.protein;
        acc.carbs += curr.carbs;
        acc.fat += curr.fat;
        acc.fiber += curr.fiber;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  };

  const breakfastMacros = getMealMacros(plannedMeals.breakfast);
  const lunchMacros = getMealMacros(plannedMeals.lunch);
  const dinnerMacros = getMealMacros(plannedMeals.dinner);

  // Day cumulative total outputs
  const dayCalories = breakfastMacros.calories + lunchMacros.calories + dinnerMacros.calories;
  const dayProtein = breakfastMacros.protein + lunchMacros.protein + dinnerMacros.protein;
  const dayCarbs = breakfastMacros.carbs + lunchMacros.carbs + dinnerMacros.carbs;
  const dayFat = breakfastMacros.fat + lunchMacros.fat + dinnerMacros.fat;
  const dayFiber = breakfastMacros.fiber + lunchMacros.fiber + dinnerMacros.fiber;

  const renderMealColumn = (mealName: string, mealKey: "breakfast" | "lunch" | "dinner", items: FoodItem[], macros: any) => {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 md:p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex justify-between items-center pb-3 border-b border-neutral-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <h4 className="text-md font-bold text-black font-sans capitalize">{mealName}</h4>
            </div>
            <span className="text-xs font-mono font-bold bg-neutral-100 px-2 py-1 rounded text-black border border-neutral-200">
              {macros.calories} kcal
            </span>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 bg-neutral-50 rounded-xl border-dashed border border-neutral-200 mb-4">
              <p className="text-xs text-neutral-400 font-mono">No foods planned</p>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-sans text-xs font-semibold text-neutral-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      {item.servingSize} • {item.calories} kcal
                    </p>
                    {/* Tiny macros info */}
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                      P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                    </p>
                  </div>
                  <button
                    onClick={() => removeFoodFromMeal(mealKey, idx)}
                    className="p-1 text-neutral-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nutritional Subtotals display for this meal */}
        <div className="bg-neutral-50 hover:bg-neutral-100 transition-colors p-3 rounded-xl border border-neutral-200 mt-2">
          <p className="text-[10px] font-mono font-bold uppercase text-neutral-400 mb-2">Meal Macros Subtotal</p>
          <div className="grid grid-cols-4 gap-1 text-center">
            <div className="bg-white py-1 rounded border border-neutral-200">
              <span className="block text-[8px] font-mono text-neutral-400">Pro</span>
              <span className="text-[10px] font-bold text-black font-sans">{macros.protein.toFixed(1)}g</span>
            </div>
            <div className="bg-white py-1 rounded border border-neutral-200">
              <span className="block text-[8px] font-mono text-neutral-400">Carb</span>
              <span className="text-[10px] font-bold text-black font-sans">{macros.carbs.toFixed(1)}g</span>
            </div>
            <div className="bg-white py-1 rounded border border-neutral-200">
              <span className="block text-[8px] font-mono text-neutral-400">Fat</span>
              <span className="text-[10px] font-bold text-black font-sans">{macros.fat.toFixed(1)}g</span>
            </div>
            <div className="bg-white py-1 rounded border border-neutral-200">
              <span className="block text-[8px] font-mono text-neutral-400">Fib</span>
              <span className="text-[10px] font-bold text-black font-sans">{macros.fiber.toFixed(1)}g</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* Dynamic Summary Panel for Daily Cumulative Targets */}
      <div className="bg-black text-white rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row gap-6 justify-between items-center shadow-md">
        <div className="space-y-2 text-center lg:text-left">
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <Award className="text-green-500" size={24} />
            <h3 className="text-lg font-black font-sans uppercase tracking-tight">Daily Meal Planner Workspace</h3>
          </div>
          <p className="text-xs text-neutral-300 max-w-lg leading-relaxed font-sans">
            Add items to Breakfast, Lunch, and Dinner. GenZNutriAI summarizes values and benchmarks your macro distributions dynamically for the upcoming day to help you stay structural!
          </p>
        </div>

        {/* Aggregated Nutrition Ring Slabs */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="bg-neutral-905 bg-neutral-900 px-4 py-3 border border-neutral-850 rounded-xl text-center">
            <div className="flex items-center gap-1 justify-center text-xs font-mono text-neutral-400 mb-0.5">
              <Flame size={12} className="text-orange-400" />
              CALORIES
            </div>
            <div className="text-xl font-black text-white font-sans">
              {dayCalories} <span className="text-xs text-neutral-400 font-normal">kcal</span>
            </div>
            <div className="text-[10px] font-mono text-green-500 mt-0.5">
              Goal: {profile.calorieGoal} kcal
            </div>
          </div>

          <div className="bg-neutral-900 px-3.5 py-2.5 border border-neutral-850 rounded-xl text-center min-w-[70px]">
            <span className="block text-[9px] font-mono text-neutral-400 uppercase">Protein</span>
            <span className="text-sm font-black text-green-500 font-sans">{dayProtein.toFixed(1)}g</span>
          </div>

          <div className="bg-neutral-900 px-3.5 py-2.5 border border-neutral-850 rounded-xl text-center min-w-[70px]">
            <span className="block text-[9px] font-mono text-neutral-400 uppercase">Carbs</span>
            <span className="text-sm font-black text-white font-sans">{dayCarbs.toFixed(1)}g</span>
          </div>

          <div className="bg-neutral-900 px-3.5 py-2.5 border border-neutral-850 rounded-xl text-center min-w-[70px]">
            <span className="block text-[9px] font-mono text-neutral-400 uppercase">Fat</span>
            <span className="text-sm font-black text-white font-sans">{dayFat.toFixed(1)}g</span>
          </div>

          <div className="bg-neutral-900 px-3.5 py-2.5 border border-neutral-850 rounded-xl text-center min-w-[70px]">
            <span className="block text-[9px] font-mono text-neutral-400 uppercase">Fiber</span>
            <span className="text-sm font-black text-green-500 font-sans">{dayFiber.toFixed(1)}g</span>
          </div>
        </div>

        {dayCalories > 0 && (
          <div className="w-full lg:w-auto text-center lg:text-right">
            <button
              onClick={clearAllPlanning}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 font-mono text-[10px] text-rose-400 border border-neutral-700 uppercase font-bold rounded-lg cursor-pointer transition-colors"
            >
              Clear Entire Plan
            </button>
          </div>
        )}
      </div>

      {/* Main Responsive Grid layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Columns (8 cols) - 3 meal slots */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderMealColumn("Breakfast 🍳", "breakfast", plannedMeals.breakfast, breakfastMacros)}
          {renderMealColumn("Lunch 🥗", "lunch", plannedMeals.lunch, lunchMacros)}
          {renderMealColumn("Dinner 🍽️", "dinner", plannedMeals.dinner, dinnerMacros)}
        </div>

        {/* Right Column (4 cols) - Live Fast-selection library finder */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
          
          {/* Gemini quick interactive assistant search slot */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-black font-extrabold flex items-center gap-1">
              <MessageSquareCode size={14} className="text-green-600" />
              Dynamic Intelligent Search
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Find custom food descriptions via Gemini, and add them directly to your plans!
            </p>

            <form onSubmit={handleCustomSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 2 fried eggs with sourdough"
                className="flex-1 text-xs py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
              />
              <button
                type="submit"
                disabled={analyzing}
                className="p-2 bg-black hover:bg-neutral-800 text-white rounded-lg cursor-pointer transition-all flex items-center justify-center disabled:opacity-55"
              >
                {analyzing ? (
                  <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Search size={14} />
                )}
              </button>
            </form>

            {searchError && (
              <p className="text-[10px] text-rose-600 font-mono italic leading-tight">{searchError}</p>
            )}

            {tempFoodDetail && (
              <div className="p-3.5 bg-green-50/70 border border-green-200 rounded-xl space-y-2">
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <span className="block text-[8px] font-mono text-green-700 uppercase font-bold tracking-widest">Identified Meal</span>
                    <h5 className="font-sans font-bold text-xs text-neutral-900 leading-tight">{tempFoodDetail.name}</h5>
                    <p className="text-[10px] text-neutral-400 font-mono">Portion: {tempFoodDetail.servingSize}</p>
                  </div>
                  <span className="text-xs font-bold text-black font-sans bg-white border border-neutral-200 px-1.5 py-0.5 rounded">
                    {tempFoodDetail.calories} kcal
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-neutral-600">
                  <span className="bg-white/80 p-1 rounded text-center">P: {tempFoodDetail.protein}g</span>
                  <span className="bg-white/80 p-1 rounded text-center">C: {tempFoodDetail.carbs}g</span>
                  <span className="bg-white/80 p-1 rounded text-center">F: {tempFoodDetail.fat}g</span>
                </div>

                {/* Sub-selector buttons to directly inject into breakfast/lunch/dinner slots */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      if (tempFoodDetail) {
                        addFoodToMeal("breakfast", tempFoodDetail);
                        setTempFoodDetail(null);
                        setSearchQuery("");
                      }
                    }}
                    className="py-1 bg-black hover:bg-neutral-800 text-white font-mono text-[8px] uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
                  >
                    + Breakfast
                  </button>
                  <button
                    onClick={() => {
                      if (tempFoodDetail) {
                        addFoodToMeal("lunch", tempFoodDetail);
                        setTempFoodDetail(null);
                        setSearchQuery("");
                      }
                    }}
                    className="py-1 bg-black hover:bg-neutral-800 text-white font-mono text-[8px] uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
                  >
                    + Lunch
                  </button>
                  <button
                    onClick={() => {
                      if (tempFoodDetail) {
                        addFoodToMeal("dinner", tempFoodDetail);
                        setTempFoodDetail(null);
                        setSearchQuery("");
                      }
                    }}
                    className="py-1 bg-black hover:bg-neutral-800 text-white font-mono text-[8px] uppercase tracking-wider font-bold rounded transition-colors cursor-pointer"
                  >
                    + Dinner
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Picker: Favorite entries list */}
          <div className="space-y-2 border-t border-neutral-100 pt-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
              <span>Your Favorite Presets</span>
              <span className="bg-green-100 text-green-800 text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
                {profile.favoriteFoods.length} Items
              </span>
            </h4>

            {profile.favoriteFoods.length === 0 ? (
              <p className="text-[10px] text-neutral-400 italic font-mono bg-neutral-50 px-3 py-2.5 rounded-lg">
                Mark items as favorites in the Tracker tab to see them here for faster meal planning.
              </p>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {profile.favoriteFoods.map((item, index) => (
                  <div key={item.name + "-fav-" + index} className="p-2 border border-neutral-200 bg-neutral-50 rounded-lg flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <p className="font-sans font-bold text-[11px] text-neutral-800 truncate">{item.name}</p>
                      <p className="text-[9px] text-neutral-400 font-mono">
                        {item.calories} kcal • P: {item.protein}g
                      </p>
                    </div>

                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => addFoodToMeal("breakfast", item)}
                        className="p-1 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200 rounded text-[9px] font-mono font-bold cursor-pointer"
                        title="Add to Breakfast"
                      >
                        B
                      </button>
                      <button
                        onClick={() => addFoodToMeal("lunch", item)}
                        className="p-1 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200 rounded text-[9px] font-mono font-bold cursor-pointer"
                        title="Add to Lunch"
                      >
                        L
                      </button>
                      <button
                        onClick={() => addFoodToMeal("dinner", item)}
                        className="p-1 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200 rounded text-[9px] font-mono font-bold cursor-pointer"
                        title="Add to Dinner"
                      >
                        D
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Picker: Commonly Eaten database with fast add inputs */}
          <div className="space-y-2 border-t border-neutral-100 pt-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
              <span>Common Foods Library</span>
              <span className="text-[10px] font-mono text-neutral-400">Default presets</span>
            </h4>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {COMMON_FOOD_ITEMS.map((item, index) => (
                <div key={item.name + "-db-" + index} className="p-2 border border-neutral-200 bg-neutral-50 rounded-lg flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <p className="font-sans font-bold text-[11px] text-neutral-800 truncate">{item.name}</p>
                    <p className="text-[9px] text-neutral-400 font-mono">
                      {item.calories} kcal • P: {item.protein}g
                    </p>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => addFoodToMeal("breakfast", item)}
                      className="p-1 bg-neutral-200 text-neutral-700 hover:bg-black hover:text-white rounded text-[9px] font-mono font-bold cursor-pointer"
                      title="Add to Breakfast"
                    >
                      +B
                    </button>
                    <button
                      onClick={() => addFoodToMeal("lunch", item)}
                      className="p-1 bg-neutral-200 text-neutral-700 hover:bg-black hover:text-white rounded text-[9px] font-mono font-bold cursor-pointer"
                      title="Add to Lunch"
                    >
                      +L
                    </button>
                    <button
                      onClick={() => addFoodToMeal("dinner", item)}
                      className="p-1 bg-neutral-200 text-neutral-700 hover:bg-black hover:text-white rounded text-[9px] font-mono font-bold cursor-pointer"
                      title="Add to Dinner"
                    >
                      +D
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
