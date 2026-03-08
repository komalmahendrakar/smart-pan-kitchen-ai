import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ShoppingBasket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPantry, addToPantry, removeFromPantry } from '@/lib/pantry';
import { PantryItem } from '@/lib/types';

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    setItems(getPantry());
  }, []);

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    const item = addToPantry(name);
    setItems(prev => [...prev, item]);
    setInput('');
  };

  const handleRemove = (id: string) => {
    removeFromPantry(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-gradient-to-br from-secondary/10 via-background to-accent/10 px-4 pb-6 pt-8">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex items-center gap-2">
            <ShoppingBasket className="h-6 w-6 text-secondary" />
            <h1 className="text-2xl font-bold">My Pantry</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Add ingredients you have at home. We&apos;ll match them with recipes!
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">
        {/* Add input */}
        <div className="mb-5 flex gap-2">
          <Input
            placeholder="Add an ingredient..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd} className="gap-1 bg-secondary hover:bg-secondary/90">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <ShoppingBasket className="mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">Your pantry is empty</p>
              <p className="text-sm">Add ingredients you have at home</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {items.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card>
                    <CardContent className="flex items-center justify-between p-3">
                      <span className="text-sm font-medium capitalize">{item.name}</span>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {items.length} ingredient{items.length !== 1 ? 's' : ''} in your pantry
        </p>
      </div>
    </div>
  );
}
