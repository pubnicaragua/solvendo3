import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ValidationErrorProps {
  message: string
  className?: string
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ 
  message,
  className = ''
}) => {
  if (!message) return null
  
  return (
    <div className={`flex items-center gap-2 text-red-600 text-sm mt-1 ${className}`}>
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  )
}