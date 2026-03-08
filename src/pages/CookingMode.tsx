import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Timer, Lightbulb, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getRecipeById } from '@/lib/recipe-store';

export default function CookingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = getRecipeById(id || '');
  const [stepIdx, setStepIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  const step = recipe?.steps[stepIdx];
  const totalSteps = recipe?.steps.length || 0;

  // Reset timer when step changes
  useEffect(() => {
    setTimerSeconds(step?.duration ?? null);
    setTimerRunning(false);
  }, [stepIdx, step?.duration]);

  // Countdown
  useEffect(() => {
    if (!timerRunning || timerSeconds === null || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev === null || prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!recipe || !step) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Recipe not found.</p>
      </div>
    );
  }

  const progress = ((stepIdx + 1) / totalSteps) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <button onClick={() => navigate(`/recipe/${id}`)} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">
          Step {stepIdx + 1} of {totalSteps}
        </span>
        <div className="w-5" />
      </div>

      <Progress value={progress} className="h-1 rounded-none" />

      {/* Step content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
              {step.number}
            </div>

            <p className="mb-6 text-lg leading-relaxed">{step.instruction}</p>

            {/* Timer */}
            {step.duration && (
              <Card className="mb-5 border-primary/20">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold tabular-nums">
                      {formatTime(timerSeconds ?? step.duration)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setTimerSeconds(step.duration!);
                        setTimerRunning(false);
                      }}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={() => setTimerRunning(!timerRunning)}
                      className="bg-primary"
                    >
                      {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grandma Tip */}
            {step.tip && (
              <Card className="border-accent/30 bg-accent/10">
                <CardContent className="flex gap-3 p-4">
                  <Lightbulb className="h-5 w-5 shrink-0 text-accent-foreground" />
                  <div>
                    <p className="mb-0.5 text-xs font-bold text-accent-foreground">👵 Grandma&apos;s Tip</p>
                    <p className="text-sm leading-relaxed text-accent-foreground/80">{step.tip}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="border-t bg-card/80 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-1 py-6 text-base"
            disabled={stepIdx === 0}
            onClick={() => setStepIdx(s => s - 1)}
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Button>
          {stepIdx < totalSteps - 1 ? (
            <Button
              className="flex-1 gap-1 bg-primary py-6 text-base font-bold shadow-lg shadow-primary/25"
              onClick={() => setStepIdx(s => s + 1)}
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="flex-1 gap-1 bg-secondary py-6 text-base font-bold"
              onClick={() => navigate(`/recipe/${id}`)}
            >
              🎉 Done!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
