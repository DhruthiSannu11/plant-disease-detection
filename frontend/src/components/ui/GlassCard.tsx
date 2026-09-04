import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  header,
  footer,
}) => {
  return (
    <div
      className={`glass-card rounded-2xl p-6 ${
        hoverEffect ? 'glass-card-hover' : ''
      } ${className}`}
    >
      {header && <div className="mb-4 pb-3 border-b border-emerald-500/10">{header}</div>}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-3 border-t border-emerald-500/10">{footer}</div>}
    </div>
  );
};
