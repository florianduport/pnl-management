"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface YearSelectorProps {
  onYearChange: (year: number) => void
  disabled?: boolean
}

export function YearSelector({ onYearChange, disabled = false }: YearSelectorProps) {
  const currentYear = 2025
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)

  const handleYearChange = (year: string) => {
    const newYear = parseInt(year)
    setSelectedYear(newYear)
    onYearChange(newYear)
  }

  const handlePreviousYear = () => {
    if (selectedYear > currentYear) {
      const newYear = selectedYear - 1
      setSelectedYear(newYear)
      onYearChange(newYear)
    }
  }

  const handleNextYear = () => {
    if (selectedYear < currentYear + 5) {
      const newYear = selectedYear + 1
      setSelectedYear(newYear)
      onYearChange(newYear)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {selectedYear > currentYear && (
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousYear}
          disabled={disabled}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      <Select value={selectedYear.toString()} onValueChange={handleYearChange} disabled={disabled}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedYear < currentYear + 5 && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextYear}
          disabled={disabled}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
