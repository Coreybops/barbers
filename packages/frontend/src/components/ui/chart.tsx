import React from 'react'
import { cn } from '../../utils/cn'

interface ChartContainerProps {
  children: React.ReactNode
  className?: string
}

export function ChartContainer({ children, className }: ChartContainerProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className={cn(
            "flex items-center text-xs font-medium",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            <span className={cn(
              "mr-1",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "↗" : "↘"}
            </span>
            {trend.value}%
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground pt-1">{description}</p>
      )}
      {trend && (
        <p className="text-xs text-muted-foreground pt-1">{trend.label}</p>
      )}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showValue?: boolean
  color?: 'primary' | 'success' | 'warning' | 'destructive'
}

export function ProgressBar({ 
  value, 
  max = 100, 
  className, 
  showValue = false,
  color = 'primary'
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-500 ease-out", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}

interface SimpleBarChartProps {
  data: Array<{
    name: string
    value: number
    color?: string
  }>
  className?: string
}

export function SimpleBarChart({ data, className }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-16 text-sm text-muted-foreground">{item.name}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || 'hsl(var(--primary))'
                  }}
                />
              </div>
              <div className="w-12 text-sm font-medium text-right">{item.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface DonutChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  className?: string
  size?: number
}

export function DonutChart({ data, className, size = 120 }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  
  let cumulativePercentage = 0
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            fill="transparent"
          />
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference)
            
            cumulativePercentage += percentage
            
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={item.color}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  type?: 'default' | 'success' | 'warning' | 'destructive'
}

export function ActivityItem({ icon, title, description, time, type = 'default' }: ActivityItemProps) {
  const typeColors = {
    default: 'bg-muted',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  }

  return (
    <div className="flex items-start space-x-3">
      <div className={cn(
        "rounded-full p-2 mt-1",
        typeColors[type]
      )}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{title}</h4>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
    isPositive?: boolean
  }
  chart?: React.ReactNode
  className?: string
}

export function MetricCard({ title, value, change, chart, className }: MetricCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-6 text-card-foreground shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change && (
            <div className="flex items-center space-x-1">
              <span className={cn(
                "text-sm font-medium",
                change.isPositive !== false ? "text-success" : "text-destructive"
              )}>
                {change.isPositive !== false ? "+" : ""}{change.value}%
              </span>
              <span className="text-xs text-muted-foreground">
                from {change.period}
              </span>
            </div>
          )}
        </div>
        {chart && (
          <div className="w-20 h-16">
            {chart}
          </div>
        )}
      </div>
    </div>
  )
}