import { Recipe } from './types';

const mockRecipes: Record<string, Recipe> = {
  'butter-chicken': {
    id: 'butter-chicken',
    name: 'Butter Chicken (Murgh Makhani)',
    videoUrl: '',
    cookingTime: '45 mins',
    difficulty: 'Medium',
    servings: 4,
    ingredients: [
      { name: 'Chicken thighs', quantity: '500', unit: 'g' },
      { name: 'Yogurt', quantity: '1', unit: 'cup' },
      { name: 'Butter', quantity: '3', unit: 'tbsp' },
      { name: 'Onion', quantity: '2', unit: 'large' },
      { name: 'Tomato puree', quantity: '1', unit: 'cup' },
      { name: 'Cream', quantity: '1/2', unit: 'cup' },
      { name: 'Ginger garlic paste', quantity: '2', unit: 'tbsp' },
      { name: 'Garam masala', quantity: '1', unit: 'tsp' },
      { name: 'Turmeric', quantity: '1/2', unit: 'tsp' },
      { name: 'Red chili powder', quantity: '1', unit: 'tsp' },
      { name: 'Salt', quantity: '', unit: 'to taste' },
      { name: 'Kasuri methi', quantity: '1', unit: 'tsp' },
      { name: 'Sugar', quantity: '1', unit: 'tsp' },
      { name: 'Oil', quantity: '2', unit: 'tbsp' },
    ],
    steps: [
      {
        number: 1,
        instruction: 'Marinate chicken with yogurt, turmeric, red chili powder, and salt. Let it rest for at least 30 minutes.',
        duration: 1800,
        tip: 'Marinating overnight in the fridge gives the best flavor – patience pays off, beta!',
      },
      {
        number: 2,
        instruction: 'Heat oil and butter in a pan. Add the marinated chicken pieces and cook until golden brown on both sides.',
        duration: 480,
        tip: 'Don\'t move the chicken too much – let it get a nice sear for that restaurant-style taste.',
      },
      {
        number: 3,
        instruction: 'Remove chicken and set aside. In the same pan, add chopped onions and cook until golden.',
        duration: 420,
        tip: 'Cook onions on medium heat until they turn deep golden brown – this is the secret to rich gravy!',
      },
      {
        number: 4,
        instruction: 'Add ginger garlic paste and sauté for 2 minutes until the raw smell disappears.',
        duration: 120,
        tip: 'Keep stirring constantly so the garlic doesn\'t burn – burnt garlic makes everything bitter.',
      },
      {
        number: 5,
        instruction: 'Add tomato puree, garam masala, and remaining spices. Cook until oil separates from the masala.',
        duration: 600,
        tip: 'When oil floats on top of the masala, that\'s when you know it\'s perfectly cooked!',
      },
      {
        number: 6,
        instruction: 'Add the chicken back, pour in cream, and add kasuri methi and sugar. Simmer for 10 minutes.',
        duration: 600,
        tip: 'A pinch of sugar balances the acidity of tomatoes – grandma\'s secret trick!',
      },
      {
        number: 7,
        instruction: 'Garnish with a swirl of cream and kasuri methi. Serve hot with naan or rice.',
        tip: 'Crush the kasuri methi between your palms before adding – it releases more aroma!',
      },
    ],
    nutrition: {
      calories: 485,
      protein: 32,
      carbohydrates: 18,
      fat: 34,
    },
  },
  'pasta-arrabbiata': {
    id: 'pasta-arrabbiata',
    name: 'Spicy Pasta Arrabbiata',
    videoUrl: '',
    cookingTime: '25 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: [
      { name: 'Penne pasta', quantity: '250', unit: 'g' },
      { name: 'Olive oil', quantity: '3', unit: 'tbsp' },
      { name: 'Garlic', quantity: '4', unit: 'cloves' },
      { name: 'Red chili flakes', quantity: '1', unit: 'tsp' },
      { name: 'Canned tomatoes', quantity: '400', unit: 'g' },
      { name: 'Fresh basil', quantity: '1', unit: 'bunch' },
      { name: 'Parmesan cheese', quantity: '50', unit: 'g' },
      { name: 'Salt', quantity: '', unit: 'to taste' },
      { name: 'Black pepper', quantity: '', unit: 'to taste' },
    ],
    steps: [
      {
        number: 1,
        instruction: 'Bring a large pot of salted water to boil. Cook penne according to package directions until al dente.',
        duration: 600,
        tip: 'Salt the pasta water generously – it should taste like the sea! This is your only chance to season the pasta itself.',
      },
      {
        number: 2,
        instruction: 'While pasta cooks, heat olive oil in a large pan over medium heat. Add sliced garlic and chili flakes.',
        duration: 120,
        tip: 'Slice garlic thin so it cooks evenly. The moment it turns golden, move to the next step – don\'t let it burn!',
      },
      {
        number: 3,
        instruction: 'Add canned tomatoes, crush them with a spoon, and simmer for 10 minutes until sauce thickens.',
        duration: 600,
        tip: 'Let the sauce bubble away – the longer it simmers, the deeper the flavor gets.',
      },
      {
        number: 4,
        instruction: 'Drain pasta (save a cup of pasta water). Toss pasta into the sauce with a splash of pasta water.',
        tip: 'Pasta water is liquid gold! The starch helps the sauce cling to every piece of pasta.',
      },
      {
        number: 5,
        instruction: 'Garnish with fresh basil leaves and grated Parmesan. Serve immediately.',
        tip: 'Always add basil at the very end – heat destroys its beautiful fragrance.',
      },
    ],
    nutrition: {
      calories: 420,
      protein: 15,
      carbohydrates: 58,
      fat: 16,
    },
  },
};

export function generateMockRecipe(videoUrl: string): Recipe {
  // Simulate generating a recipe from a video URL
  const recipes = Object.values(mockRecipes);
  const randomIndex = Math.floor(Math.random() * recipes.length);
  const recipe = { ...recipes[randomIndex], videoUrl, id: Date.now().toString() };
  return recipe;
}

export { mockRecipes };
