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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export interface Entity {
  value: string
  label: string
  type?: "Groupe" | "ESN" | "École"
}

interface EntitySelectorProps {
  entities: Entity[]
  selectedEntity: Entity
  onEntityChange: (entity: Entity) => void
  onEntityAdd?: (entity: Entity) => void
  onEntityEdit?: (oldValue: string, entity: Entity) => void
  onEntityDelete?: (value: string) => void
  onEntityDuplicate?: (entity: Entity) => void
}

export function EntitySelector({ entities, selectedEntity, onEntityChange, onEntityAdd, onEntityEdit, onEntityDelete, onEntityDuplicate }: EntitySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("global")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [newEntityName, setNewEntityName] = React.useState("")
  const [newEntityType, setNewEntityType] = React.useState<"Groupe" | "ESN" | "École">("ESN")
  const [editingEntity, setEditingEntity] = React.useState<Entity | null>(null)

  const handleAddEntity = () => {
    if (newEntityName.trim() && onEntityAdd) {
      const newEntity: Entity = {
        value: newEntityName.toLowerCase().replace(/\s+/g, "-"),
        label: newEntityName.trim(),
        type: newEntityType,
      }
      onEntityAdd(newEntity)
      setNewEntityName("")
      setDialogOpen(false)
    }
  }

  const handleEditEntity = () => {
    if (editingEntity && newEntityName.trim() && onEntityEdit) {
      const updatedEntity: Entity = {
        value: newEntityName.toLowerCase().replace(/\s+/g, "-"),
        label: newEntityName.trim(),
        type: newEntityType,
      }
      onEntityEdit(editingEntity.value, updatedEntity)
      setEditingEntity(null)
      setNewEntityName("")
      setEditDialogOpen(false)
    }
  }

  const openEditDialog = (entity: Entity) => {
    setEditingEntity(entity)
    setNewEntityName(entity.label)
    setNewEntityType(entity.type || "ESN")
    setEditDialogOpen(true)
  }

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium">Entité:</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[240px] justify-between">
            {value ? entities.find((entity) => entity.value === value)?.label : "Sélectionner une entité..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher une entité..." />
            <CommandList>
              <CommandEmpty>Aucune entité trouvée.</CommandEmpty>
              <CommandGroup>
                {entities.map((entity) => (
                  <CommandItem
                    key={entity.value}
                    value={entity.value}
                    className="flex items-center justify-between"
                    onSelect={(currentValue) => {
                      if (currentValue === "add-entity") {
                        setDialogOpen(true)
                        setOpen(false)
                        return
                      }
                      const selectedEntity = entities.find((e) => e.value === currentValue)
                      if (selectedEntity) {
                        onEntityChange(selectedEntity)
                      }
                      setValue(currentValue)
                      setOpen(false)
                    }}
                  >
                    <div className="flex items-center">
                      <Check className={cn("mr-2 h-4 w-4", value === entity.value ? "opacity-100" : "opacity-0")} />
                      <span>{entity.label}</span>
                      {entity.type && <span className="ml-2 text-xs text-muted-foreground">({entity.type})</span>}
                    </div>
                    {entity.value !== "global" && (onEntityEdit || onEntityDelete || onEntityDuplicate) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onEntityDuplicate && (
                            <DropdownMenuItem onClick={() => onEntityDuplicate(entity)}>
                              Dupliquer
                            </DropdownMenuItem>
                          )}
                          {onEntityEdit && (
                            <DropdownMenuItem onClick={() => openEditDialog(entity)}>
                              Modifier
                            </DropdownMenuItem>
                          )}
                          {onEntityDelete && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onEntityDelete(entity.value)}
                            >
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {onEntityAdd && (
                <CommandGroup>
                  <CommandItem
                    value="add-entity"
                    onSelect={() => {
                      setDialogOpen(true)
                      setOpen(false)
                    }}
                    className="text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une entité
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {onEntityAdd && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une nouvelle entité</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entity-name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="entity-name"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="col-span-3"
                  placeholder="Nom de l'entité"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <RadioGroup
                  className="col-span-3"
                  value={newEntityType}
                  onValueChange={(value) => setNewEntityType(value as "Groupe" | "ESN" | "École")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Groupe" id="groupe" />
                    <Label htmlFor="groupe">Groupe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ESN" id="esn" />
                    <Label htmlFor="esn">ESN</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="École" id="ecole" />
                    <Label htmlFor="ecole">École</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddEntity}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {onEntityEdit && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'entité</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-entity-name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="edit-entity-name"
                  value={newEntityName}
                  onChange={(e) => setNewEntityName(e.target.value)}
                  className="col-span-3"
                  placeholder="Nom de l'entité"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <RadioGroup
                  className="col-span-3"
                  value={newEntityType}
                  onValueChange={(value) => setNewEntityType(value as "Groupe" | "ESN" | "École")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Groupe" id="edit-groupe" />
                    <Label htmlFor="edit-groupe">Groupe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ESN" id="edit-esn" />
                    <Label htmlFor="edit-esn">ESN</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="École" id="edit-ecole" />
                    <Label htmlFor="edit-ecole">École</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditEntity}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

