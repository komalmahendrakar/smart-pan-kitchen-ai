export interface Recipe {
  id: string;
  name: string;
  videoUrl: string;
  cookingTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  nutrition: NutritionInfo;
  imageUrl?: string;
  language?: 'en' | 'hi';
}

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

export interface CookingStep {
  number: number;
  instruction: string;
  duration?: number; // in seconds
  tip?: string;
  imageQuery?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface PantryItem {
  id: string;
  name: string;
  addedAt: string;
}
