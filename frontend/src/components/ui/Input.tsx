// components/ui/Input.tsx
import { forwardRef, InputHTMLAttributes, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search';
  error?: boolean;
  onSearch?: (value: string) => void;
  hasIcon?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      variant = 'default',
      error = false,
      disabled = false,
      hasIcon = false,
      onSearch,
      onChange,
      value,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const showPlaceholder = !isFocused && (!value || value === '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      if (onSearch && variant === 'search') {
        onSearch(e.target.value);
      }
    };

    return (
      <div className="relative">
        {hasIcon && variant === 'search' && (
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none',
              error && 'text-red-500'
            )}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={showPlaceholder ? placeholder : ''}
          className={cn(
            'w-full rounded-full border px-4 py-2 text-sm transition-colors',
            variant === 'search' && hasIcon && 'pl-10',
            error
              ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-red-500/20'
              : 'border-gray-300 focus:border-primary focus:ring-primary/20',
            disabled && 'cursor-not-allowed bg-gray-100 opacity-70',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };