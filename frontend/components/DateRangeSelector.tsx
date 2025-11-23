"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
}

export function DateRangeSelector({
  dateRange,
  onDateRangeChange,
}: DateRangeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Date Range (Optional)
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "LLL dd, y")} -{" "}
                  {format(dateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(dateRange.from, "LLL dd, y")
              )
            ) : (
              <span>All time (default)</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
      {dateRange && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateRangeChange(undefined)}
          className="w-full"
        >
          Clear date range
        </Button>
      )}
    </div>
  )
}
