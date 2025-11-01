import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        ref={ref}
        className={cn(
          'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-blue-500' : 'bg-gray-200',
          className
        )}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
