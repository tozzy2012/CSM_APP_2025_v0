import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
    value?: number[]
    defaultValue?: number[]
    onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
        const [localValue, setLocalValue] = React.useState(defaultValue?.[0] ?? value?.[0] ?? 0)

        React.useEffect(() => {
            if (value !== undefined && value.length > 0) {
                setLocalValue(value[0])
            }
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = parseFloat(e.target.value)
            setLocalValue(newValue)
            if (onValueChange) {
                onValueChange([newValue])
            }
        }

        return (
            <input
                type="range"
                ref={ref}
                className={cn(
                    "w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
                    className
                )}
                min={min}
                max={max}
                step={step}
                value={localValue}
                onChange={handleChange}
                {...props}
            />
        )
    }
)
Slider.displayName = "Slider"

export { Slider }
