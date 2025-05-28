
import * as React from "react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerWithPresetsProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

const presetOptions = [
  {
    label: "Today",
    value: "today",
    getDateRange: () => {
      const today = new Date();
      return { from: today, to: today };
    }
  },
  {
    label: "Yesterday", 
    value: "yesterday",
    getDateRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: yesterday, to: yesterday };
    }
  },
  {
    label: "Last Week",
    value: "last-week", 
    getDateRange: () => {
      const today = new Date();
      const lastWeekStart = startOfWeek(subDays(today, 7));
      const lastWeekEnd = endOfWeek(subDays(today, 7));
      return { from: lastWeekStart, to: lastWeekEnd };
    }
  },
  {
    label: "This Month",
    value: "this-month",
    getDateRange: () => {
      const today = new Date();
      return { from: startOfMonth(today), to: endOfMonth(today) };
    }
  },
  {
    label: "Custom Range",
    value: "custom",
    getDateRange: () => undefined
  }
];

export function DateRangePickerWithPresets({
  date,
  onDateChange,
  className,
}: DateRangePickerWithPresetsProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<string>("custom");
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  // Determine which preset is currently selected based on the date range
  React.useEffect(() => {
    if (!date?.from || !date?.to) {
      setSelectedPreset("custom");
      return;
    }

    const matchingPreset = presetOptions.find(preset => {
      if (preset.value === "custom") return false;
      const presetRange = preset.getDateRange();
      if (!presetRange) return false;
      
      return (
        format(date.from!, "yyyy-MM-dd") === format(presetRange.from, "yyyy-MM-dd") &&
        format(date.to!, "yyyy-MM-dd") === format(presetRange.to, "yyyy-MM-dd")
      );
    });

    setSelectedPreset(matchingPreset?.value || "custom");
  }, [date]);

  const handlePresetSelect = (value: string) => {
    setSelectedPreset(value);
    
    if (value === "custom") {
      setIsCalendarOpen(true);
      return;
    }

    const preset = presetOptions.find(p => p.value === value);
    if (preset) {
      const dateRange = preset.getDateRange();
      if (dateRange) {
        onDateChange(dateRange);
      }
    }
  };

  const formatDateRange = () => {
    if (!date?.from) return "Select date range";
    
    if (date.from && date.to) {
      if (format(date.from, "yyyy-MM-dd") === format(date.to, "yyyy-MM-dd")) {
        return format(date.from, "MMM dd, yyyy");
      }
      return `${format(date.from, "MMM dd, yyyy")} - ${format(date.to, "MMM dd, yyyy")}`;
    }
    
    return format(date.from, "MMM dd, yyyy");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Select value={selectedPreset} onValueChange={handlePresetSelect}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presetOptions.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedPreset === "custom" && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <div className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(newDate) => {
                onDateChange(newDate);
                if (newDate?.from && newDate?.to) {
                  setIsCalendarOpen(false);
                }
              }}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      )}

      {selectedPreset !== "custom" && (
        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
          {formatDateRange()}
        </div>
      )}
    </div>
  );
}
