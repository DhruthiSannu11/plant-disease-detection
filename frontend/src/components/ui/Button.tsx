import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-emerald-600 to-sprout-600 hover:from-emerald-500 hover:to-sprout-500 text-white shadow-glow-emerald border border-emerald-400/30 active:scale-[0.98]',
  secondary:
    'bg-forest-800 hover:bg-forest-700 text-emerald-200 border border-emerald-500/20 active:scale-[0.98]',
  outline:
    'bg-transparent hover:bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 active:scale-[0.98]',
  danger:
    'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-glow-rose border border-rose-400/30 active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-forest-800/40 text-slate-300 hover:text-emerald-300 border-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5 font-semibold',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 select-none ${
        sizeStyles[size]
      } ${variantStyles[variant]} ${
        isDisabled ? 'opacity-50 cursor-not-allowed filter grayscale-[30%]' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
