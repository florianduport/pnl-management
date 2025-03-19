"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface YearSelectorProps {
  onYearChange: (year: number) => void
  onYearDuplicate?: (sourceYear: number, targetYear: number) => void
  disabled?: boolean
}

export function YearSelector({ onYearChange, onYearDuplicate, disabled = false }: YearSelectorProps) {
  const currentYear = 2025
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [targetYear, setTargetYear] = useState<number | null>(null)

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

  const handleDuplicate = () => {
    if (onYearDuplicate && targetYear !== null) {
      onYearDuplicate(selectedYear, targetYear)
      setDuplicateDialogOpen(false)
      setTargetYear(null)
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
            <SelectItem
              key={year}
              value={year.toString()}
              className="flex items-center justify-between"
            >
              <span>{year}</span>
              {onYearDuplicate && year !== selectedYear && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setTargetYear(year)
                      setDuplicateDialogOpen(true)
                    }}>
                      Dupliquer depuis {selectedYear}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer les données d'une année</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Année source</div>
              <div className="text-sm text-muted-foreground">{selectedYear}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Année cible</div>
              <div className="text-sm text-muted-foreground">{targetYear}</div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleDuplicate}>Dupliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
