import { PantryItem } from './types';

const PANTRY_KEY = 'cookmate-pantry';

export function getPantry(): PantryItem[] {
  const data = localStorage.getItem(PANTRY_KEY);
  return data ? JSON.parse(data) : [];
}

export function addToPantry(name: string): PantryItem {
  const pantry = getPantry();
  const item: PantryItem = {
    id: Date.now().toString(),
    name: name.toLowerCase().trim(),
    addedAt: new Date().toISOString(),
  };
  pantry.push(item);
  localStorage.setItem(PANTRY_KEY, JSON.stringify(pantry));
  return item;
}

export function removeFromPantry(id: string): void {
  const pantry = getPantry().filter(item => item.id !== id);
  localStorage.setItem(PANTRY_KEY, JSON.stringify(pantry));
}

export function isInPantry(ingredientName: string): boolean {
  const pantry = getPantry();
  const name = ingredientName.toLowerCase().trim();
  return pantry.some(item =>
    name.includes(item.name) || item.name.includes(name)
  );
}
