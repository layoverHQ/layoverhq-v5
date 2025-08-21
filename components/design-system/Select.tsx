"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  hint?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full px-4 py-3 pr-10 border rounded-lg appearance-none bg-white',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'text-gray-900 cursor-pointer',
              error ? 'border-error-500 focus:ring-error-500' : 'border-gray-300 focus:ring-primary-500',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
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

Select.displayName = 'Select'