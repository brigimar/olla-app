// components/ui/Rating.tsx
import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

const RATING_SIZES = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const Rating = ({
  value,
  max = 5,
  size = 'md',
  readOnly = false,
  onRate,
  className,
}: RatingProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue !== null && !readOnly ? hoverValue : value;
  const sizeClasses = RATING_SIZES[size];

  const handleStarClick = (index: number) => {
    if (!readOnly && onRate) {
      onRate(index + 1);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < max; i++) {
      const starValue = i + 1;
      let IconComponent = Star;
      let isFilled = false;

      if (displayValue >= starValue) {
        isFilled = true;
      } else if (displayValue > i && displayValue < starValue) {
        IconComponent = StarHalf;
        isFilled = true;
      }

      stars.push(
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => !readOnly && setHoverValue(starValue)}
          onMouseLeave={() => !readOnly && setHoverValue(null)}
          className={cn(
            'transition-colors focus:outline-none',
            isFilled ? 'text-accent' : 'text-gray-300',
            !readOnly && 'cursor-pointer hover:text-accent'
          )}
          aria-label={`Rate ${starValue} stars`}
        >
          <IconComponent className={sizeClasses} fill={isFilled ? 'currentColor' : 'none'} />
        </button>
      );
    }
    return stars;
  };

  return (
    <div className={cn('flex items-center gap-1', className)} role="radiogroup">
      {renderStars()}
    </div>
  );
};

export { Rating };
