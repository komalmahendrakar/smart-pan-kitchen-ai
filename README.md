# Grandma's Recipe AI

Build a modern AI-powered web application called CookMate AI – Smart Cooking Assistant.

The application helps users convert cooking videos into step-by-step recipes and guides them while cooking, like a mom or grandma assisting in the kitchen.

The UI should be clean, modern, mobile-friendly, and designed like a cooking assistant app.

MAIN FEATURE

The user can paste a YouTube or Instagram cooking video URL.

The application should:

Extract the transcript from the video.

Use AI to convert the transcript into a structured recipe.

Display the recipe with ingredients, steps, and cooking information.

RECIPE OUTPUT FORMAT

When a video is processed, the app should show:

Recipe Name
Estimated Cooking Time
Difficulty Level

Ingredients List

Step-by-step Cooking Instructions

Nutrition Information:

Calories

Protein

Carbohydrates

Fat

COOKING MODE

Add a “Start Cooking Mode” button.

In cooking mode:

Show only one step at a time

Buttons: Next Step / Previous Step

Show a timer if the step includes cooking duration

Show helpful cooking tips (like a grandma giving advice)

Example tip:
“Cook onions until golden brown for better flavor.”

PANTRY AND MISSING INGREDIENT DETECTION

Add a feature where users can store ingredients they already have in their pantry.

The system compares the recipe ingredients with the pantry list and identifies missing ingredients.

Display two lists:

Available Ingredients
Missing Ingredients

GROCERY INTEGRATION

For missing ingredients add buttons:

“Order from Zepto”
“Search on Blinkit”

Clicking these buttons should open grocery search links for the missing ingredients.

NUTRITION ANALYSIS

Automatically estimate nutrition values of the recipe including:

Calories
Protein
Fat
Carbohydrates

Use AI to estimate these values based on the ingredients.

GRANDMA MODE (AI COOKING ASSISTANT)

Add a feature where AI gives cooking tips during each step.

Examples:
“Add a pinch of sugar to balance tomato acidity.”
“Do not overcook garlic or it will become bitter.”

This should feel like a human cooking assistant.

VOICE FRIENDLY DESIGN (Optional UI support)

Design the interface so it could support voice commands like:

“Next step”
“Repeat step”

MAIN PAGES

Home Page

App title

Input field for video URL

Button: Generate Recipe

Recipe Page

Recipe details

Ingredients

Missing ingredients

Nutrition info

Start Cooking Mode button

Cooking Mode Page

One step at a time

Navigation buttons

Cooking tips

Timer

Pantry Page

User can add ingredients they already have

DESIGN STYLE

Clean kitchen-style UI
Warm colors like cream, orange, and green
Rounded cards for recipe sections
Mobile-first responsive design

TECH STACK

Frontend: React with modern UI components
Use a clean component-based architecture
Prepare the structure so it can integrate with AI APIs and transcript APIs.

Make the interface feel like a smart AI cooking companion.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/222442f5-8cd8-49a1-9f66-736b458e5c18).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
