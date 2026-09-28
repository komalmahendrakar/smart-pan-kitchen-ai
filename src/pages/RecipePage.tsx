import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, BarChart3, ChefHat, Check, X, ExternalLink, ArrowLeft, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRecipeById } from '@/lib/recipe-store';
import { isInPantry } from '@/lib/pantry';
import { Ingredient } from '@/lib/types';

const difficultyColor = {
  Easy: 'bg-secondary text-secondary-foreground',
  Medium: 'bg-accent text-accent-foreground',
  Hard: 'bg-destructive text-destructive-foreground',
};

export default function RecipePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = getRecipeById(id || '');

  if (!recipe) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Recipe not found.</p>
      </div>
    );
  }

  const available = recipe.ingredients.filter(i => isInPantry(i.name));
  const missing = recipe.ingredients.filter(i => !isInPantry(i.name));

  const grocerySearch = (name: string, store: 'zepto' | 'blinkit') => {
    const q = encodeURIComponent(name);
    const urls = {
      zepto: `https://www.zeptonow.com/search?query=${q}`,
      blinkit: `https://blinkit.com/s/?q=${q}`,
    };
    window.open(urls[store], '_blank');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 pb-6 pt-4">
        <button onClick={() => navigate('/')} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold leading-tight">{recipe.name}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{recipe.cookingTime}</Badge>
            <Badge className={difficultyColor[recipe.difficulty]}>{recipe.difficulty}</Badge>
            <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-0.5">
              <button aria-label="Fewer servings" onClick={() => setServings(s => Math.max(1, s - 1))} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"><Minus className="h-3 w-3" /></button>
              <span className="flex items-center gap-1 px-1 text-xs font-semibold"><Users className="h-3 w-3" />{servings} servings</span>
              <button aria-label="More servings" onClick={() => setServings(s => Math.min(50, s + 1))} className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"><Plus className="h-3 w-3" /></button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-4">
        {/* Start Cooking */}
        <Button
          onClick={() => navigate(`/cook/${recipe.id}`)}
          className="w-full gap-2 rounded-xl bg-primary py-6 text-lg font-bold shadow-lg shadow-primary/25"
        >
          <Play className="h-5 w-5" /> Start Cooking Mode
        </Button>

        {/* Nutrition */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" /> Nutrition (per serving)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: 'Calories', value: recipe.nutrition.calories, unit: 'kcal', color: 'bg-primary/10 text-primary' },
                { label: 'Protein', value: recipe.nutrition.protein, unit: 'g', color: 'bg-secondary/10 text-secondary' },
                { label: 'Carbs', value: recipe.nutrition.carbohydrates, unit: 'g', color: 'bg-accent/20 text-accent-foreground' },
                { label: 'Fat', value: recipe.nutrition.fat, unit: 'g', color: 'bg-destructive/10 text-destructive' },
              ].map(n => (
                <div key={n.label} className={`rounded-xl p-3 ${n.color}`}>
                  <p className="text-lg font-bold">{n.value}</p>
                  <p className="text-xs">{n.unit}</p>
                  <p className="mt-0.5 text-[10px] font-medium opacity-70">{n.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🥗 Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {available.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-secondary">✓ In Your Pantry</p>
                <ul className="space-y-1.5">
                  {available.map((ing, i) => (
                    <IngredientRow key={i} ing={ing} inPantry />
                  ))}
                </ul>
              </div>
            )}
            <div>
              {available.length > 0 && <p className="mb-2 text-xs font-semibold text-destructive">✗ Missing</p>}
              <ul className="space-y-1.5">
                {missing.map((ing, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <IngredientRow ing={ing} inPantry={false} />
                    <div className="flex gap-1">
                      <button
                        onClick={() => grocerySearch(ing.name, 'zepto')}
                        className="rounded-lg bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/20"
                      >
                        Zepto
                      </button>
                      <button
                        onClick={() => grocerySearch(ing.name, 'blinkit')}
                        className="rounded-lg bg-secondary/10 px-2 py-1 text-[10px] font-semibold text-secondary hover:bg-secondary/20"
                      >
                        Blinkit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Steps Preview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📝 Steps ({recipe.steps.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recipe.steps.map(step => (
              <div key={step.number} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {step.number}
                </div>
                <p className="text-sm leading-relaxed">{step.instruction}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IngredientRow({ ing, inPantry }: { ing: Ingredient; inPantry: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {inPantry ? (
        <Check className="h-4 w-4 text-secondary" />
      ) : (
        <X className="h-4 w-4 text-destructive/60" />
      )}
      <span className="text-sm">
        {ing.quantity} {ing.unit} <span className="font-medium">{ing.name}</span>
      </span>
    </div>
  );
}
