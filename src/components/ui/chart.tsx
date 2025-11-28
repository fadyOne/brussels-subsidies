import { cn } from "@/lib/utils"
import * as React from "react"

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

function ChartContainer({ className, ...props }: ChartContainerProps) {
  return (
    <div
      className={cn("w-full", className)}
      {...props}
    />
  )
}

export { ChartContainer, type ChartConfig }
