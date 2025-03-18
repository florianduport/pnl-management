"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, MoreVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export interface Scenario {
  id: string
  name: string
}

interface ScenarioSelectorProps {
  scenarios: Scenario[]
  currentScenario: Scenario
  onScenarioChange: (scenario: Scenario) => void
  onScenarioAdd: (name: string) => void
  onScenarioEdit: (id: string, name: string) => void
  onScenarioDelete: (id: string) => void
}

export function ScenarioSelector({
  scenarios,
  currentScenario,
  onScenarioChange,
  onScenarioAdd,
  onScenarioEdit,
  onScenarioDelete,
}: ScenarioSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [newScenarioName, setNewScenarioName] = React.useState("")
  const [editingScenario, setEditingScenario] = React.useState<Scenario | null>(null)

  const handleAddScenario = () => {
    if (newScenarioName.trim()) {
      onScenarioAdd(newScenarioName.trim())
      setNewScenarioName("")
      setDialogOpen(false)
    }
  }

  const handleEditScenario = () => {
    if (editingScenario && newScenarioName.trim()) {
      onScenarioEdit(editingScenario.id, newScenarioName.trim())
      setNewScenarioName("")
      setEditDialogOpen(false)
      setEditingScenario(null)
    }
  }

  const openEditDialog = (scenario: Scenario) => {
    setEditingScenario(scenario)
    setNewScenarioName(scenario.name)
    setEditDialogOpen(true)
  }

  const handleDeleteScenario = (scenario: Scenario) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le scénario "${scenario.name}" ?`)) {
      onScenarioDelete(scenario.id)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium">Scénario:</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[240px] justify-between">
            {currentScenario.name}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un scénario..." />
            <CommandList>
              <CommandEmpty>Aucun scénario trouvé.</CommandEmpty>
              <CommandGroup>
                {scenarios.map((scenario) => (
                  <CommandItem
                    key={scenario.id}
                    value={scenario.id}
                    className="flex items-center justify-between"
                    onSelect={() => {
                      onScenarioChange(scenario)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn("mr-2 h-4 w-4", currentScenario.id === scenario.id ? "opacity-100" : "opacity-0")}
                      />
                      {scenario.name}
                    </div>
                    {scenarios.length > 1 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(scenario)}>
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteScenario(scenario)}
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setDialogOpen(true)
                    setOpen(false)
                  }}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un scénario
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau scénario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scenario-name" className="text-right">
                Nom
              </Label>
              <Input
                id="scenario-name"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                className="col-span-3"
                placeholder="Nom du scénario"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddScenario}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le scénario</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-scenario-name" className="text-right">
                Nom
              </Label>
              <Input
                id="edit-scenario-name"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                className="col-span-3"
                placeholder="Nom du scénario"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditScenario}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

