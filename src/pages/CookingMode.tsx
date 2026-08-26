import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, X, Timer, Lightbulb, Play, Pause, RotateCcw, Mic, MicOff, ImageIcon, Loader2, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getRecipeById } from '@/lib/recipe-store';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { matchCommand, COMMAND_LABEL, startWavRecording, type VoiceCommand } from '@/lib/voice-commands';

export default function CookingMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = getRecipeById(id || '');
  const [stepIdx, setStepIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [stepImage, setStepImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const stopRecRef = useRef<null | (() => Promise<Blob>)>(null);


  const step = recipe?.steps[stepIdx];
  const totalSteps = recipe?.steps.length || 0;
  const langCode = recipe?.language === 'hi' ? 'hi-IN' : 'en-US';

  const goNext = useCallback(() => {
    setStepIdx(s => (s < totalSteps - 1 ? s + 1 : s));
  }, [totalSteps]);
  const goPrev = useCallback(() => {
    setStepIdx(s => (s > 0 ? s - 1 : s));
  }, []);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }, [langCode]);

  // Keep latest handlers in a ref so recognition isn't recreated on every step change
  const handlersRef = useRef({ goNext, goPrev, speak, step });
  useEffect(() => {
    handlersRef.current = { goNext, goPrev, speak, step };
  }, [goNext, goPrev, speak, step]);

  // Speak instruction whenever step changes (if voice is on)
  useEffect(() => {
    if (!voiceOn || !step) return;
    speak(step.instruction);
  }, [stepIdx, voiceOn, step, speak]);

  // Load cached step image (no auto-generation — images are on demand to save credits)
  useEffect(() => {
    if (!recipe || !step) return;
    const cacheKey = `cookmate-step-img:${recipe.id}:${step.number}`;
    setStepImage(localStorage.getItem(cacheKey));
    setImageLoading(false);
  }, [recipe?.id, step?.number, recipe, step]);

  const generateStepImage = useCallback(async () => {
    if (!recipe || !step) return;
    const cacheKey = `cookmate-step-img:${recipe.id}:${step.number}`;
    setImageLoading(true);
    const prompt = `${step.imageQuery || step.instruction.split('.')[0]} — for the dish ${recipe.name}`.slice(0, 400);
    const { data, error } = await supabase.functions.invoke('generate-step-image', { body: { prompt } });
    setImageLoading(false);
    if (error || !data?.image) {
      toast.error('Could not generate a photo for this step.');
      return;
    }
    try { localStorage.setItem(cacheKey, data.image); } catch { /* quota */ }
    setStepImage(data.image);
  }, [recipe, step]);


  // Apply a recognized command
  const applyCommand = useCallback((cmd: VoiceCommand) => {
    const h = handlersRef.current;
    if (!cmd) return false;
    switch (cmd) {
      case 'reset-timer':
        if (h.step?.duration) {
          setTimerSeconds(h.step.duration);
          setTimerRunning(false);
        }
        break;
      case 'start-timer':
        setTimerRunning(true);
        break;
      case 'pause-timer':
        setTimerRunning(false);
        break;
      case 'next':
        h.goNext();
        break;
      case 'previous':
        h.goPrev();
        break;
      case 'repeat':
        if (h.step) h.speak(h.step.instruction);
        break;
    }
    setHeard(COMMAND_LABEL[cmd]);
    return true;
  }, []);

  const applyRef = useRef(applyCommand);
  useEffect(() => {
    applyRef.current = applyCommand;
  }, [applyCommand]);

  // Push-to-talk: record a short clip and transcribe with AI (accurate fallback)
  const togglePushToTalk = useCallback(async () => {
    if (transcribing) return;
    if (recording && stopRecRef.current) {
      const stop = stopRecRef.current;
      stopRecRef.current = null;
      setRecording(false);
      setTranscribing(true);
      try {
        const blob = await stop();
        if (blob.size < 2048) {
          toast.error('That was too short — hold the button while you speak.');
          return;
        }
        const form = new FormData();
        form.append('file', blob, 'command.wav');
        form.append('language', recipe?.language === 'hi' ? 'hi' : 'en');
        const { data, error } = await supabase.functions.invoke('transcribe-command', { body: form });
        if (error || !data?.text) {
          toast.error('Could not understand that — try again.');
          return;
        }
        setHeard(`"${data.text}"`);
        if (!applyRef.current(matchCommand(data.text))) {
          toast.error(`Heard "${data.text}" — try "next", "previous" or "repeat".`);
        }
      } catch {
        toast.error('Voice input failed.');
      } finally {
        setTranscribing(false);
      }
      return;
    }
    try {
      stopRecRef.current = await startWavRecording();
      setRecording(true);
      setHeard(null);
    } catch {
      toast.error('Microphone access is needed for voice commands.');
    }
  }, [recording, transcribing, recipe?.language]);

  // Continuous browser recognition with fuzzy matching
  useEffect(() => {
    if (!voiceOn) return;
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Continuous listening isn't supported here — use the push-to-talk button.");
      setVoiceOn(false);
      return;
    }
    let stopped = false;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = langCode;

    rec.onresult = (e: any) => {
      const transcript = String(e.results[e.results.length - 1][0].transcript).trim();
      setHeard(`"${transcript}"`);
      applyRef.current(matchCommand(transcript));
    };
    rec.onerror = (e: any) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast.error('Microphone access denied — allow mic access to use voice commands.');
        stopped = true;
        setVoiceOn(false);
      }
    };
    rec.onend = () => {
      if (!stopped) {
        try { rec.start(); } catch { /* already starting */ }
      }
    };
    try { rec.start(); } catch { /* already started */ }
    return () => {
      stopped = true;
      try { rec.stop(); } catch { /* noop */ }
      window.speechSynthesis.cancel();
    };
  }, [voiceOn, langCode]);

  // Clear the "heard" chip after a moment
  useEffect(() => {
    if (!heard) return;
    const t = setTimeout(() => setHeard(null), 3000);
    return () => clearTimeout(t);
  }, [heard]);


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

      {heard && (
        <div className="px-4 pt-2 text-center text-xs font-medium text-muted-foreground">
          Heard: {heard}
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
            <div className="mb-5 flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-2xl bg-muted shadow-lg">
              {stepImage ? (
                <img
                  src={stepImage}
                  alt={`Step ${step.number}: ${step.instruction.slice(0, 80)}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  {imageLoading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="text-xs">Cooking up a photo…</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 opacity-50" />
                      <Button size="sm" variant="outline" onClick={generateStepImage}>
                        Show photo
                      </Button>
                    </>
                  )}
                </div>

              )}
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
