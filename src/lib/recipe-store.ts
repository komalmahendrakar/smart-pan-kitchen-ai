import { Recipe } from './types';

const RECIPES_KEY = 'cookmate-recipes';

export function saveRecipe(recipe: Recipe): void {
  const recipes = getSavedRecipes();
  recipes.unshift(recipe);
  localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes.slice(0, 20)));
}

export function getSavedRecipes(): Recipe[] {
  const data = localStorage.getItem(RECIPES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getRecipeById(id: string): Recipe | undefined {
  return getSavedRecipes().find(r => r.id === id);
}
