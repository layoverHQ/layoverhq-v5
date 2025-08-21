"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'bordered' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
}) => {
  const variants = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-md',
    bordered: 'bg-white border-2 border-gray-300',
    interactive: 'bg-white border border-gray-200 hover:border-primary-400 hover:shadow-lg cursor-pointer',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  }

  return (
    <div
      className={cn(
        'rounded-lg transition-all duration-200',
        variants[variant],
        paddings[padding],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn('pb-4', className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3 className={cn('text-xl font-semibold text-gray-900', className)}>
      {children}
    </h3>
  )
}

interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => {
  return (
    <p className={cn('mt-1 text-sm text-gray-600', className)}>
      {children}
    </p>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('', className)}>
      {children}
    </div>
  )
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('pt-4 mt-4 border-t border-gray-100', className)}>
      {children}
    </div>
  )
}