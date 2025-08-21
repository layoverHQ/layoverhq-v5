import * as React from "react"

export interface ColorPickerProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ value, onChange, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="color"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={className}
        {...props}
      />
    )
  },
)

ColorPicker.displayName = "ColorPicker"
