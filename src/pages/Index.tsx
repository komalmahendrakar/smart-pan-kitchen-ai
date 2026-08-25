import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, Sparkles, Youtube, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { saveRecipe } from '@/lib/recipe-store';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Recipe } from '@/lib/types';

const DAILY_LIMIT = 5;
const todayKey = () => `cookmate-daily:${new Date().toISOString().slice(0, 10)}`;
const getUsedToday = () => Number(localStorage.getItem(todayKey()) || '0');

const Index = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [usedToday, setUsedToday] = useState(getUsedToday);
  const navigate = useNavigate();
  const { toast } = useToast();

  const remaining = Math.max(0, DAILY_LIMIT - usedToday);

  const handleGenerate = async () => {
    if (!url.trim()) {
      toast({ title: 'Please paste a video URL', variant: 'destructive' });
      return;
    }
    if (getUsedToday() >= DAILY_LIMIT) {
      setUsedToday(getUsedToday());
      toast({
        title: 'Daily limit reached',
        description: `You can generate ${DAILY_LIMIT} recipes per day. Try again tomorrow!`,
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: { videoUrl: url, language },
      });
      if (error) throw error;
      if (!data?.recipe) throw new Error('No recipe returned');
      const recipe: Recipe = {
        ...data.recipe,
        id: Date.now().toString(),
        videoUrl: url,
        language,
      };
      saveRecipe(recipe);
      const next = getUsedToday() + 1;
      localStorage.setItem(todayKey(), String(next));
      setUsedToday(next);
      navigate(`/recipe/${recipe.id}`);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Could not generate recipe',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 pb-8 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-md text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <ChefHat className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            CookMate AI
          </h1>
          <p className="text-muted-foreground">
            Your smart cooking assistant — paste a video, get a recipe!
          </p>
        </motion.div>
      </div>

      {/* URL Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mx-auto -mt-2 max-w-md px-4"
      >
        <Card className="border-2 border-primary/20 shadow-xl shadow-primary/5">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Paste a cooking video URL
            </div>
            <div className="mb-3 flex gap-2">
              {([
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिन्दी Hindi' },
              ] as const).map(opt => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLanguage(opt.code)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    language === opt.code
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="YouTube or Instagram URL..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="pl-10"
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="gap-1 rounded-xl bg-primary px-5 font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <>
                    Go <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {remaining > 0
                ? `${remaining} of ${DAILY_LIMIT} recipes left today`
                : 'Daily limit reached — resets tomorrow'}
            </p>

          </CardContent>
        </Card>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mx-auto mt-8 max-w-md px-4"
      >
        <h2 className="mb-4 text-lg font-bold">How it works</h2>
        <div className="space-y-3">
          {[
            { icon: Youtube, title: 'Paste a Video', desc: 'YouTube or Instagram cooking video' },
            { icon: BookOpen, title: 'Get a Recipe', desc: 'AI extracts a structured recipe for you' },
            { icon: Clock, title: 'Cook with Guidance', desc: 'Step-by-step with timers & grandma tips' },
          ].map((feat, i) => (
            <Card key={i} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <feat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{feat.title}</p>
                  <p className="text-sm text-muted-foreground">{feat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
