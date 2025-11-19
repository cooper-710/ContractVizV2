import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../ui/utils';

interface SBButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export function SBButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  className,
  children,
  disabled,
  ...props
}: SBButtonProps) {
  const variants = {
    primary: 'bg-[#004B73] text-white hover:bg-[#003B5C] active:bg-[#002F4A] disabled:bg-[#004B73]/20 disabled:text-[#A3A8B0] navy-glow',
    secondary: 'bg-[#17181B] text-[#ECEDEF] border border-[rgba(255,255,255,0.14)] hover:bg-[#1F2023] active:bg-[#17181B] disabled:bg-[#17181B]/20 disabled:text-[#A3A8B0]',
    ghost: 'bg-transparent text-[#ECEDEF] hover:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.08)] disabled:text-[#A3A8B0]',
    danger: 'bg-[#DC2626] text-[#ECEDEF] hover:bg-[#B91C1C] active:bg-[#991B1B] disabled:bg-[#DC2626]/20 disabled:text-[#A3A8B0]',
  };

  const sizes = {
    sm: 'h-8 px-3 gap-1.5 text-sm',
    md: 'h-10 px-4 gap-2',
    lg: 'h-12 px-6 gap-2.5',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[10px] transition-all duration-[180ms] cubic-bezier(0.2,0.8,0.2,1) font-medium',
        variants[variant],
        sizes[size],
        disabled && 'cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />}
      {!isLoading && icon && iconPosition === 'left' && icon}
      {children}
      {!isLoading && icon && iconPosition === 'right' && icon}
    </button>
  );
}
