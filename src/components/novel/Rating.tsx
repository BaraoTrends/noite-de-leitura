import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function Rating({
  value,
  max = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onChange,
}: RatingProps) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => {
        const filled = index < Math.floor(value);
        const partial = index === Math.floor(value) && value % 1 > 0;
        
        return (
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(index)}
            className={cn(
              "relative",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
          >
            <Star
              className={cn(
                sizes[size],
                filled ? "text-gold fill-gold" : "text-muted-foreground"
              )}
            />
            {partial && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${(value % 1) * 100}%` }}>
                <Star className={cn(sizes[size], "text-gold fill-gold")} />
              </div>
            )}
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
