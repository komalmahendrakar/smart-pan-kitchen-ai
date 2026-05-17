import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Timer, Lightbulb, Play, Pause, RotateCcw, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getRecipeById } from '@/lib/recipe-store';
import { toast } from 'sonner';

export default function CookingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = getRecipeById(id || '');
  const [stepIdx, setStepIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);

  const step = recipe?.steps[stepIdx];
  const totalSteps = recipe?.steps.length || 0;
  const langCode = recipe?.language === 'hi' ? 'hi-IN' : 'en-US';

  const goNext = useCallback(() => {
    setStepIdx(s => (s < totalSteps - 1 ? s + 1 : s));
  }, [totalSteps]);
  const goPrev = useCallback(() => {
    setStepIdx(s => (s > 0 ? s - 1 : s));
  }, []);
  const repeatStep = useCallback(() => {
    if (!step) return;
    const u = new SpeechSynthesisUtterance(step.instruction);
    u.lang = langCode;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [step, langCode]);

  // Speak instruction whenever step changes (if voice is on)
  useEffect(() => {
    if (!voiceOn || !step) return;
    const u = new SpeechSynthesisUtterance(step.instruction);
    u.lang = langCode;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [stepIdx, voiceOn, step, langCode]);

  // Voice recognition
  useEffect(() => {
    if (!voiceOn) return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice commands aren't supported in this browser. Try Chrome.");
      setVoiceOn(false);
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = langCode;

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .slice(-1)
        .map((r: any) => r[0].transcript.toLowerCase().trim())
        .join(' ');
      const isNext = /\b(next|forward|continue)\b/.test(transcript) || /आगे|अगला|next/i.test(transcript);
      const isPrev = /\b(previous|back|go back)\b/.test(transcript) || /पीछे|पिछला|वापस/i.test(transcript);
      const isRepeat = /\b(repeat|again|say again)\b/.test(transcript) || /दोबारा|फिर से|दोहराओ/i.test(transcript);
      const isStart = /\b(start timer|start the timer|begin timer)\b/.test(transcript) || /टाइमर चालू|टाइमर शुरू/i.test(transcript);
      const isPause = /\b(pause|stop timer|pause timer)\b/.test(transcript) || /रोको|रुको|टाइमर बंद/i.test(transcript);
      const isReset = /\b(reset timer|restart timer)\b/.test(transcript) || /टाइमर रीसेट|फिर से टाइमर/i.test(transcript);
      if (isNext) goNext();
      else if (isPrev) goPrev();
      else if (isRepeat) repeatStep();
      else if (isStart) setTimerRunning(true);
      else if (isPause) setTimerRunning(false);
      else if (isReset) {
        if (step?.duration) {
          setTimerSeconds(step.duration);
          setTimerRunning(false);
        }
      }
    };
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        toast.error('Microphone access denied');
        setVoiceOn(false);
      }
    };
    rec.onend = () => {
      // auto-restart while voice is on
      if (voiceOn) {
        try { rec.start(); } catch {}
      }
    };
    try { rec.start(); } catch {}
    return () => {
      try { rec.stop(); } catch {}
      window.speechSynthesis.cancel();
    };
  }, [voiceOn, goNext, goPrev, repeatStep, step, langCode]);

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground">
          We couldn't find this recipe — it may have been cleared from your device.
        </p>
        <Button onClick={() => navigate('/')} className="bg-primary">
          Generate a new recipe
        </Button>
      </div>
    );
  }

  const progress = ((stepIdx + 1) / totalSteps) * 100;

  const imagePrompt = encodeURIComponent(
    `${step.imageQuery || step.instruction.split('.')[0]} — overhead food photography, ${recipe.name}, warm natural light, appetizing, realistic`
  );
  const stepImage = `https://image.pollinations.ai/prompt/${imagePrompt}?width=768&height=512&nologo=true&seed=${recipe.id}-${step.number}`;

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
        <button
          onClick={() => setVoiceOn(v => !v)}
          aria-label="Toggle voice commands"
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            voiceOn ? 'bg-primary text-primary-foreground animate-pulse' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {voiceOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </button>
      </div>

      <Progress value={progress} className="h-1 rounded-none" />

      {voiceOn && (
        <div className="bg-primary/10 px-4 py-2 text-center text-xs text-primary">
          🎙️ {recipe.language === 'hi'
            ? 'सुन रहे हैं — कहें "अगला", "पिछला", "दोबारा", "टाइमर चालू", "रोको"'
            : 'Listening — say "next", "previous", "repeat", "start timer", "pause"'}
        </div>
      )}

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
            <div className="mb-5 overflow-hidden rounded-2xl bg-muted shadow-lg">
              <img
                src={stepImage}
                alt={`Step ${step.number}: ${step.instruction.slice(0, 80)}`}
                className="aspect-[3/2] w-full object-cover"
                loading="lazy"
                onError={(e) => { (e.currentTarget.style.display = 'none'); }}
              />
            </div>

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
