import React from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface InputProps {
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  value: string
  onChange: (value: string) => void
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  error?: string
  required?: boolean
  disabled?: boolean
  autoFocus?: boolean
  onEnter?: () => void
  className?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  icon: Icon,
  iconPosition = 'left',
  error,
  required = false,
  disabled = false,
  autoFocus = false,
  onEnter,
  className = ''
}) => {
  const inputClasses = [
    'w-full px-5 py-3 text-gray-900 bg-white border rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500',
    Icon && iconPosition === 'left' ? 'pl-12' : '',
    Icon && iconPosition === 'right' ? 'pr-12' : '',
    error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200',
    disabled ? 'bg-gray-50 cursor-not-allowed opacity-50' : 'hover:border-gray-400',
    className
  ].filter(Boolean).join(' ')

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter()
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          className={inputClasses}
        />
        
        {Icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Icon className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}