import React from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-card',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800 shadow-sm',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary active:bg-gray-100',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800 shadow-sm'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2 min-h-[40px]',
    md: 'px-5 py-2.5 text-base gap-2 min-h-[48px]',
    lg: 'px-7 py-3 text-lg gap-3 min-h-[56px]',
    xl: 'px-9 py-4 text-xl gap-3 min-h-[64px]'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed'
  const loadingClasses = 'cursor-wait'
  const fullWidthClasses = fullWidth ? 'w-full' : ''

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && disabledClasses,
    loading && loadingClasses,
    fullWidthClasses,
    className
  ].filter(Boolean).join(' ')

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick()
    }
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon size={size === 'sm' ? 18 : size === 'lg' ? 24 : size === 'xl' ? 28 : 20} />
      ) : null}
      
      {children}
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={size === 'sm' ? 18 : size === 'lg' ? 24 : size === 'xl' ? 28 : 20} />
      )}
    </button>
  )
}