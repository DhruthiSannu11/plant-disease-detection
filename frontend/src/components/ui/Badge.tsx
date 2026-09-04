import React from 'react';

export type BadgeVariant = 
  | 'low' 
  | 'moderate' 
  | 'high' 
  | 'severe' 
  | 'critical' 
  | 'healthy' 
  | 'sprout' 
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  healthy: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  severe: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  critical: 'bg-rose-600/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
  sprout: 'bg-sprout-500/15 text-sprout-400 border-sprout-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  neutral: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  icon,
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm transition-colors ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="inline-block">{icon}</span>}
      {children}
    </span>
  );
};
