import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      numberOfMonths={1}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-border"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7 w-full",
        head_cell:
          "text-muted-foreground text-center text-[0.75rem] font-medium uppercase tracking-wide",
        row: "grid grid-cols-7 w-full mt-2 gap-1",
        cell: "relative text-center text-sm p-0 focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 mx-auto p-0 font-normal aria-selected:opacity-100 rounded-md"
        ),
        day_range_start:
          "day-range-start bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-l-md",
        day_range_end:
          "day-range-end bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-r-md",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground font-bold",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-primary/20 aria-selected:text-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      modifiersClassNames={{
        selected: "bg-primary text-primary-foreground",
        today: "bg-accent text-accent-foreground font-bold",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_start: "bg-primary text-primary-foreground !rounded-l-md",
        range_end: "bg-primary text-primary-foreground !rounded-r-md",
        range_middle: "bg-primary/20 text-foreground",
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
