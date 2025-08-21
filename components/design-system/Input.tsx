"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, Check } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  icon?: React.ReactNode
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, icon, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 border rounded-lg transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'placeholder:text-gray-400',
              icon && 'pl-10',
              error && 'border-error-500 focus:ring-error-500',
              success && 'border-success-500 focus:ring-success-500',
              !error && !success && 'border-gray-300 focus:ring-primary-500',
              className
            )}
            {...props}
          />
          
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-error-500" />
          )}
          
          {success && !error && (
            <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-success-500" />
          )}
        </div>
        
        {hint && !error && (
          <p className="mt-1 text-sm text-gray-500">{hint}</p>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-error-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'