export interface FoodItem {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize: string;
  description?: string;
}

export interface MealPlanning {
  breakfast: FoodItem[];
  lunch: FoodItem[];
  dinner: FoodItem[];
}

export interface MealLog {
  id: string;
  timestamp: string; // ISO String or Date
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

export interface UserProfile {
  name: string;
  calorieGoal: number;
  favoriteFoods: FoodItem[];
  mealsHistory: MealLog[];
}
