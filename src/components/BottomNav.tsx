import { Home, ChefHat, ShoppingBasket } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/pantry', label: 'Pantry', icon: ShoppingBasket },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide nav in cooking mode
  if (location.pathname.startsWith('/cook/')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-5 py-2 text-xs font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
