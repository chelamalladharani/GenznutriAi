import React, { useState } from "react";
import { UserProfile, FoodItem, MealLog } from "../types";
import { User, Target, Trash2, Heart, Shield, Info, Sparkles } from "lucide-react";

interface ProfileTabProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  dailyConsumed: number;
}

export default function ProfileTab({ profile, onUpdateProfile, dailyConsumed }: ProfileTabProps) {
  const [tempName, setTempName] = useState(profile.name);
  const [tempGoal, setTempGoal] = useState(profile.calorieGoal);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Triggered when clicking 'Save Profile' below input fields 
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: tempName || "Nutri Enthusiast",
      calorieGoal: Number(tempGoal) || 2000,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const removeFavorite = (foodName: string) => {
    const updatedFavs = profile.favoriteFoods.filter((f) => f.name !== foodName);
    onUpdateProfile({
      ...profile,
      favoriteFoods: updatedFavs,
    });
  };

  // Percentage for the calorie indicator
  const goalPercent = Math.min(Math.round((dailyConsumed / profile.calorieGoal) * 100), 200);

  // Simple ring configuration
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = Math.max(0, circumference - (Math.min(goalPercent, 100) / 100) * circumference);

  return (
    <div className="space-y-12">
      {/* Visual Header Grid for Profile & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* User Settings Form */}
        <div className="md:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-neutral-100 rounded-lg text-black">
                <User size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">User Account</h2>
                <p className="text-xs text-neutral-500 font-mono">Customize your GenzNutriAI experience</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-neutral-500 mb-1.5 font-semibold">Your Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full text-sm py-2.5 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 font-sans font-medium text-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-500 mb-1.5 font-semibold">Daily Calorie Goal (kcal)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(Number(e.target.value))}
                    placeholder="e.g. 2000"
                    min="500"
                    max="10000"
                    className="w-full text-sm py-2.5 px-3 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 font-sans font-medium text-black transition-colors"
                  />
                </div>
              </div>

              {/* SAVED PROFILE BUTTON BELOW INPUT FIELDS - triggers handleSave */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full md:w-auto px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-600 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Target size={14} className="text-green-500" />
                  Save Profile
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-mono flex items-center gap-2">
                  <Sparkles size={14} className="text-green-600" />
                  Profile settings written successfully to browser local persistence!
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Visual Calorie Goal Progress Indicator */}
        <div className="md:col-span-5 bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-center items-center text-center">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-6">Daily Target Analysis</h3>

          {/* Calorie Progress Ring & Counters */}
          <div className="relative flex items-center justify-center mb-6">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              {/* Background ring */}
              <circle
                stroke="#f3f4f6"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Progress ring colored green */}
              <circle
                stroke={dailyConsumed > profile.calorieGoal ? "#ef4444" : "#16a34a"}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-500"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-black font-sans">{goalPercent}%</span>
              <span className="text-[10px] text-neutral-400 font-mono uppercase font-bold">Filled</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-sans font-semibold text-neutral-900">
              <span className="text-green-600 font-extrabold">{dailyConsumed} kcal</span> consumed
            </div>
            <div className="text-xs font-mono text-neutral-500">
              Daily Target: <span className="font-bold text-black">{profile.calorieGoal} kcal</span>
            </div>
            {dailyConsumed > profile.calorieGoal ? (
              <p className="text-rose-600 text-[11px] font-mono mt-2">⚠️ You have exceeded your daily goal</p>
            ) : (
              <p className="text-green-600 text-[11px] font-mono mt-2">🍏 Maintaining calorie status surplus/deficit</p>
            )}
          </div>
        </div>

      </div>

      {/* Favorite Foods Section with Macro summaries & Delete buttons */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Heart size={20} className="text-green-600 fill-green-600" />
          <h3 className="text-lg font-bold text-neutral-900 font-sans tracking-tight">Favorite Nutrition Presets</h3>
        </div>

        {profile.favoriteFoods.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-neutral-100 rounded-xl bg-neutral-50/50">
            <p className="text-sm text-neutral-500">No favorite food items configured yet.</p>
            <p className="text-xs text-neutral-400 font-mono mt-1">Click the heart icon when analyzing nutrition to add presets here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.favoriteFoods.map((item, index) => (
              <div
                key={item.name + "-" + index}
                className="p-4 rounded-xl border border-neutral-200 hover:border-green-600 bg-neutral-50/70 hover:bg-neutral-50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-neutral-900 leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-neutral-400 font-mono">{item.servingSize}</p>
                    </div>
                    {/* Delete button next to favorite item */}
                    <button
                      onClick={() => removeFavorite(item.name)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Remove from Favorite Foods"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="bg-white px-2 py-1.5 rounded border border-neutral-200 inline-block mb-3">
                    <span className="text-xs font-bold text-black font-sans">{item.calories} kcal</span>
                  </div>
                </div>

                {/* Macro summary grid block */}
                <div className="grid grid-cols-3 gap-1.5 text-center bg-white p-2 rounded-lg border border-neutral-150">
                  <div className="text-[10px] font-mono">
                    <div className="text-neutral-400 font-medium">Protein</div>
                    <div className="text-neutral-900 font-bold text-[11px] text-green-600">{item.protein}g</div>
                  </div>
                  <div className="text-[10px] font-mono">
                    <div className="text-neutral-400 font-medium">Carbs</div>
                    <div className="text-neutral-900 font-bold text-[11px]">{item.carbs}g</div>
                  </div>
                  <div className="text-[10px] font-mono">
                    <div className="text-neutral-400 font-medium">Fat</div>
                    <div className="text-neutral-900 font-bold text-[11px]">{item.fat}g</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Terms, About & Privacy Footer block with Founder name Chelamalla Praveen */}
      <div className="pt-8 border-t border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-neutral-50 rounded-2xl border border-neutral-200 p-6 md:p-8">
          
          {/* About Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-green-600" />
              <h4 className="text-sm font-bold font-sans uppercase tracking-wider text-black">About GenZNutriAI</h4>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              GenZNutriAI was architected to bypass legacy clunky calorie calculators with artificial-intelligence-driven natural dialogue parsing. Powered by Google Gemini, the platform dynamically recognizes custom-written food descriptions, lists of ingredients, state portions, or snacks, instantly producing accurate macronutrient graphs so you can track in real-time.
            </p>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              Our unique approach combines seamless macro logging, smart daily target ring progression, and instant meal structure planning under a modern high-contrast aesthetic.
            </p>
          </div>

          {/* Privacy Policy and Terms of Use */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-green-600" />
                <h4 className="text-sm font-bold font-sans uppercase tracking-wider text-black">Privacy Policy & Terms</h4>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans mt-1.5">
                We strictly preserve absolute offline-first integrity: your custom name, daily logs, favorite snacks, and tailored meal structures are stored with secure persistence mechanisms entirely directly within browser local storage memory. No third-party data tracking, advertising cookies, or unauthorized marketing profiling occurs.
              </p>
              <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                Gemini API analytical queries are executed safely through the server back-end to eliminate API token leakage, meaning your usage remains fully sandbox-protected.
              </p>
            </div>

            {/* FOUNDER CREDENTIAL AT THE ABSOLUTE BOTTOM */}
            <div className="pt-4 border-t border-neutral-200/80 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-[10px] font-mono text-neutral-400">© 2026 GenZNutriAI. Active Sandbox Environment.</span>
              <div className="text-xs font-mono text-neutral-700 bg-white/80 py-1 px-2.5 rounded border border-neutral-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Founder: <span className="font-extrabold text-black">Chelamalla Praveen</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
