

## CookMate AI – Smart Cooking Assistant

A warm, kitchen-themed cooking assistant app that converts video URLs into structured recipes and guides users through cooking step-by-step.

### Pages & Navigation

- **Home Page** – Hero with app branding, video URL input, and "Generate Recipe" button
- **Recipe Page** – Full recipe display with ingredients, steps, nutrition, missing ingredients detection
- **Cooking Mode** – Fullscreen step-by-step guide with timer, tips, and navigation
- **Pantry Page** – Manage ingredients you have at home
- Bottom tab navigation (mobile-friendly)

### Core Features

1. **Video URL Input** – Paste YouTube/Instagram URL → generates a mock structured recipe (simulated extraction, ready for future API integration)
2. **Recipe Display** – Recipe name, cooking time, difficulty, ingredients list, step-by-step instructions, nutrition info (calories, protein, carbs, fat)
3. **Cooking Mode** – One step at a time with Next/Previous buttons, countdown timer for timed steps, "Grandma tips" for each step
4. **Pantry Management** – Add/remove ingredients stored in localStorage, auto-compare with recipe to show Available vs Missing ingredients
5. **Grocery Links** – "Order from Zepto" / "Search on Blinkit" buttons for missing ingredients (opens external search links)
6. **Nutrition Panel** – Estimated nutrition breakdown displayed as visual cards

### Design

- Warm color palette: cream backgrounds, orange accents, green highlights
- Rounded cards, soft shadows, kitchen-inspired icons
- Mobile-first responsive layout
- Large touch targets for cooking mode (hands might be messy!)
- Voice-command-ready UI labels (visual only, no actual voice processing)

### Data

- All data stored in localStorage (pantry, recent recipes)
- Mock recipe data with realistic sample recipes for demo
- Architecture prepared for future Lovable AI integration

