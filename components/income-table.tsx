"use client"

import * as React from "react"
import { Edit2, Save, Plus, X, MoreVertical, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ExpenseData } from "./expense-table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const formatNumber = (value: number) => {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}

export interface Income {
  id: string
  name: string
  categories: string[]
  group: string
  isRecurring: boolean
  monthlyAmount: number[]
  formula: "Amount" | "Per ETP" | "Retention"
  etpRate?: number
  retentionRate?: number
  previousYearIncomeId?: string
  year?: number
  years?: Set<number>
}

export interface IncomeData {
  etpRate: number
  monthlyData: {
    etpCount: number[]
    revenue: number[]
  }
  incomes?: Income[]
  categories?: string[]
  groups?: string[]
}

type EntityType = "École" | "Groupe" | "ESN"

interface IncomeTableProps {
  data: IncomeData
  onChange: (data: IncomeData) => void
  isReadOnly?: boolean
  entityType?: EntityType
  viewMode?: "month" | "year"
  yearlyData?: Record<number, { incomeData: IncomeData; expenseData: ExpenseData }> | null
  onIncomeDuplicate?: (income: Income, sourceYear: number, targetYear: number) => void
  selectedYear?: number
}

export function IncomeTable({ data, onChange, isReadOnly = false, entityType = "Groupe", viewMode = "month", yearlyData = null, onIncomeDuplicate, selectedYear = 2025 }: IncomeTableProps) {
  // Stopper immédiatement si on est en vue annuelle et rendez un composant simplifié
  if ((viewMode as "month" | "year") === "year") {
    return (
      <YearlyIncomeTable
        data={data}
        entityType={entityType}
        yearlyData={yearlyData}
        isReadOnly={isReadOnly}
      />
    )
  }

  // Le reste du composant pour le mode "month" seulement
  const [isEditingRate, setIsEditingRate] = React.useState(false)
  const [etpRate, setEtpRate] = React.useState(data.etpRate)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newIncomeName, setNewIncomeName] = React.useState("")
  const [newIncomeCategory, setNewIncomeCategory] = React.useState<string>("")
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [newIncomeAmount, setNewIncomeAmount] = React.useState(0)
  const [newIncomeIsRecurring, setNewIncomeIsRecurring] = React.useState(true)
  const [isAddingCategory, setIsAddingCategory] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")
  const [isAddingGroup, setIsAddingGroup] = React.useState(false)
  const [newGroup, setNewGroup] = React.useState("")
  const [selectedGroup, setSelectedGroup] = React.useState<string>("Non trié")
  const [formErrors, setFormErrors] = React.useState<{
    name?: string;
    amount?: string;
    categories?: string;
  }>({})
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())
  const [newIncomeFormula, setNewIncomeFormula] = React.useState<"Amount" | "Per ETP" | "Retention">("Amount")
  const [newIncomeEtpRate, setNewIncomeEtpRate] = React.useState(0)
  const [newIncomeRetentionRate, setNewIncomeRetentionRate] = React.useState(0)
  const [newIncomePreviousYearId, setNewIncomePreviousYearId] = React.useState<string>("")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [incomeToDelete, setIncomeToDelete] = React.useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [incomeToEdit, setIncomeToEdit] = React.useState<Income | null>(null)
  const [editIncomeName, setEditIncomeName] = React.useState("")
  const [editIncomeGroup, setEditIncomeGroup] = React.useState("")
  const [editIncomeFormula, setEditIncomeFormula] = React.useState<"Amount" | "Per ETP" | "Retention">("Amount")
  const [editIncomeAmount, setEditIncomeAmount] = React.useState(0)
  const [editIncomeEtpRate, setEditIncomeEtpRate] = React.useState(0)
  const [editIncomeIsRecurring, setEditIncomeIsRecurring] = React.useState(true)
  const [editSelectedCategories, setEditSelectedCategories] = React.useState<string[]>([])
  const [isEditingGroup, setIsEditingGroup] = React.useState(false)
  const [editNewGroup, setEditNewGroup] = React.useState("")
  const [duplicateDialogOpen, setDuplicateDialogOpen] = React.useState(false)
  const [incomeToDuplicate, setIncomeToDuplicate] = React.useState<Income | null>(null)
  const [sourceYear, setSourceYear] = React.useState<number>(2025)
  const [targetYear, setTargetYear] = React.useState<number>(2025)
  const [editIncomeRetentionRate, setEditIncomeRetentionRate] = React.useState(0)
  const [editIncomePreviousYearId, setEditIncomePreviousYearId] = React.useState<string>("")

  // Initialize categories and groups if not present
  React.useEffect(() => {
    if (!data.categories) {
      onChange({
        ...data,
        categories: ["HR", "Facilities", "Marketing", "IT", "Operations", "Education", "R&D"]
      })
    }
    if (!data.groups) {
      onChange({
        ...data,
        groups: ["Non trié"]
      })
    }
    if (!data.incomes) {
      onChange({
        ...data,
        incomes: []
      })
    }
  }, [data, onChange])

  // Mettre à jour les années initiales en fonction de la prop selectedYear
  React.useEffect(() => {
    setSourceYear(selectedYear)
    setTargetYear(selectedYear)
  }, [selectedYear])

  const getEntityLabel = () => {
    switch (entityType) {
      case "École":
        return "Étudiants"
      default:
        return "ETP"
    }
  }

  React.useEffect(() => {
    setEtpRate(data.etpRate)
  }, [data.etpRate])

  const handleEtpRateChange = (value: string) => {
    const rate = Number.parseFloat(value) || 0
    setEtpRate(rate)
  }

  const saveEtpRate = () => {
    setIsEditingRate(false)

    // Recalculate all monthly revenues based on the new ETP rate
    const newMonthlyData = { ...data.monthlyData }
    newMonthlyData.revenue = data.monthlyData.etpCount.map(count => count * etpRate)

    onChange({
      ...data,
      etpRate,
      monthlyData: newMonthlyData,
    })
  }

  const handleEtpCountChange = (month: number, value: string) => {
    const count = Number.parseFloat(value) || 0
    const newMonthlyData = { ...data.monthlyData }
    newMonthlyData.etpCount = [...data.monthlyData.etpCount]
    newMonthlyData.etpCount[month] = count

    // Automatically recalculate revenue based on ETP count and rate
    newMonthlyData.revenue = [...data.monthlyData.revenue]
    newMonthlyData.revenue[month] = count * etpRate

    onChange({
      ...data,
      monthlyData: newMonthlyData,
    })
  }

  const totalEtp = data.monthlyData.etpCount.reduce((sum: number, count: number) => sum + count, 0)
  const totalRevenue = data.monthlyData.revenue.reduce((sum: number, rev: number) => sum + rev, 0)
  const avgEtp = totalEtp / 12

  const years = Array.from({ length: 16 }, (_, i) => 2020 + i)

  const validateForm = () => {
    const errors: typeof formErrors = {}

    if (!newIncomeName.trim()) {
      errors.name = "Le nom est requis"
    }

    if (!newIncomeAmount || newIncomeAmount <= 0) {
      errors.amount = "Le montant doit être supérieur à 0"
    }

    if (selectedCategories.length === 0) {
      errors.categories = "Au moins une catégorie doit être sélectionnée"
    }

    if (newIncomeFormula === "Retention") {
      if (!newIncomeRetentionRate || newIncomeRetentionRate <= 0 || newIncomeRetentionRate > 200) {
        errors.amount = "Le taux de rétention doit être compris entre 0 et 200"
      }
      if (!newIncomePreviousYearId) {
        errors.amount = "Un revenu de l'année précédente doit être sélectionné"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const addIncome = () => {
    if (!validateForm()) return

    // S'assurer que le groupe est défini
    const groupToUse = selectedGroup || "Non trié"

    // S'assurer que le groupe existe dans la liste des groupes
    if (!data.groups?.includes(groupToUse)) {
      onChange({
        ...data,
        groups: [...(data.groups || []), groupToUse]
      })
    }

    // Initialiser les montants mensuels
    let monthlyAmounts: number[] = Array(12).fill(0)

    // Si c'est un revenu de type Retention, copier les montants de l'année précédente
    if (newIncomeFormula === "Retention" && newIncomePreviousYearId && yearlyData) {
      const previousYearData = yearlyData[selectedYear - 1]?.incomeData
      if (previousYearData?.incomes) {
        const previousYearIncome = previousYearData.incomes.find(i => i.id === newIncomePreviousYearId)
        if (previousYearIncome) {
          // Copier les montants mensuels en appliquant le taux de rétention
          monthlyAmounts = previousYearIncome.monthlyAmount.map(amount =>
            amount * (newIncomeRetentionRate || 0) / 100
          )
        }
      }
    } else if (newIncomeIsRecurring) {
      monthlyAmounts = Array(12).fill(newIncomeAmount)
    } else {
      monthlyAmounts = [newIncomeAmount, ...Array(11).fill(0)]
    }

    const newIncome: Income = {
      id: Date.now().toString(),
      name: newIncomeName.trim(),
      categories: selectedCategories,
      group: groupToUse,
      isRecurring: newIncomeIsRecurring,
      monthlyAmount: monthlyAmounts,
      formula: newIncomeFormula,
      etpRate: newIncomeFormula === "Per ETP" ? newIncomeEtpRate :
        newIncomeFormula === "Retention" ? newIncomeAmount : undefined,
      retentionRate: newIncomeFormula === "Retention" ? newIncomeRetentionRate : undefined,
      previousYearIncomeId: newIncomeFormula === "Retention" ? newIncomePreviousYearId : undefined
    }

    // Mettre à jour les données
    onChange({
      ...data,
      incomes: [...(data.incomes || []), newIncome],
    })

    // Reset form
    setNewIncomeName("")
    setNewIncomeAmount(0)
    setNewIncomeIsRecurring(true)
    setNewIncomeCategory("")
    setSelectedCategories([])
    setSelectedGroup("Non trié")
    setNewIncomeFormula("Amount")
    setNewIncomeEtpRate(0)
    setNewIncomeRetentionRate(0)
    setNewIncomePreviousYearId("")
    setFormErrors({})
    setDialogOpen(false)
  }

  const addCategory = () => {
    if (!newCategory || data.categories?.includes(newCategory)) return

    onChange({
      ...data,
      categories: [...(data.categories || []), newCategory],
    })

    setSelectedCategories(prev => [...prev, newCategory])
    setNewIncomeCategory(newCategory)
    setNewCategory("")
    setIsAddingCategory(false)
  }

  const removeCategory = (categoryToRemove: string) => {
    setSelectedCategories(prev => prev.filter(cat => cat !== categoryToRemove))
  }

  const addGroup = () => {
    if (!newGroup || data.groups?.includes(newGroup)) return

    onChange({
      ...data,
      groups: [...(data.groups || []), newGroup],
    })

    setSelectedGroup(newGroup)
    setNewGroup("")
    setIsAddingGroup(false)
  }

  const calculateMonthlyTotal = (month: number) => {
    const customIncomes = data.incomes?.reduce((sum, income) => {
      if (income.formula === "Per ETP") {
        return sum + ((income.monthlyAmount[month] || 0) * (income.etpRate || 0))
      } else if (income.formula === "Retention") {
        return sum + ((income.monthlyAmount[month] || 0) * (income.etpRate || 0))
      }
      return sum + (income.monthlyAmount[month] || 0)
    }, 0) || 0
    return {
      amount: customIncomes,
      count: (data.incomes?.reduce((sum, income) => {
        if (income.formula === "Per ETP") {
          return sum + (income.monthlyAmount[month] || 0)
        } else if (income.formula === "Retention") {
          return sum + (income.monthlyAmount[month] || 0)
        }
        return sum
      }, 0) || 0)
    }
  }

  const calculateTotal = () => {
    const customIncomesTotal = data.incomes?.reduce((sum, income) => {
      if (income.formula === "Per ETP") {
        return sum + income.monthlyAmount.reduce((monthSum, amount) =>
          monthSum + ((amount || 0) * (income.etpRate || 0)), 0)
      } else if (income.formula === "Retention") {
        return sum + income.monthlyAmount.reduce((monthSum, amount) =>
          monthSum + ((amount || 0) * (income.etpRate || 0)), 0)
      }
      return sum + income.monthlyAmount.reduce((monthSum, amount) => monthSum + (amount || 0), 0)
    }, 0) || 0
    return {
      amount: customIncomesTotal,
      count: (data.incomes?.reduce((sum, income) => {
        if (income.formula === "Per ETP") {
          return sum + income.monthlyAmount.reduce((sum, amount) => sum + (amount || 0), 0)
        } else if (income.formula === "Retention") {
          return sum + income.monthlyAmount.reduce((sum, amount) => sum + (amount || 0), 0)
        }
        return sum
      }, 0) || 0)
    }
  }

  const handleIncomeAmountChange = (incomeId: string, month: number, amount: number) => {
    if (!data.incomes) return

    const updatedIncomes = data.incomes.map((income) => {
      if (income.id === incomeId) {
        const newAmounts = [...income.monthlyAmount]
        newAmounts[month] = amount

        // Si c'est un revenu récurrent, mettre à jour tous les mois avec la même valeur
        if (income.isRecurring && month === 0) {
          for (let i = 0; i < 12; i++) {
            newAmounts[i] = amount
          }
        }

        return { ...income, monthlyAmount: newAmounts }
      }
      return income
    })

    onChange({
      ...data,
      incomes: updatedIncomes,
    })
  }

  const handleIncomeEtpRateChange = (incomeId: string, etpRate: number) => {
    if (!data.incomes) return

    const updatedIncomes = data.incomes.map((income) => {
      if (income.id === incomeId) {
        return { ...income, etpRate }
      }
      return income
    })

    onChange({
      ...data,
      incomes: updatedIncomes,
    })
  }

  const toggleIncomeRecurring = (incomeId: string, isRecurring: boolean) => {
    if (!data.incomes) return

    const updatedIncomes = data.incomes.map((income) => {
      if (income.id === incomeId) {
        let monthlyAmount = [...income.monthlyAmount]
        if (income.isRecurring && !isRecurring) {
          // Garder les valeurs actuelles lors du passage de récurrent à non récurrent
        } else if (!income.isRecurring && isRecurring) {
          // Si on passe de non récurrent à récurrent, mettre tous les mois à la valeur du premier mois
          monthlyAmount = Array(12).fill(monthlyAmount[0])
        }
        return {
          ...income,
          isRecurring,
          monthlyAmount,
        }
      }
      return income
    })

    onChange({
      ...data,
      incomes: updatedIncomes,
    })
  }

  // Grouper les revenus par groupe
  const groupedIncomes = React.useMemo(() => {
    const allIncomes = data.incomes || []
    const groups = allIncomes.reduce((acc, income) => {
      if (!acc[income.group]) {
        acc[income.group] = []
      }
      acc[income.group].push(income)
      return acc
    }, {} as Record<string, Income[]>)

    // Trier les groupes selon l'ordre défini dans data.groups
    return (data.groups || ["Non trié"])
      .map(group => ({
        group,
        incomes: groups[group] || []
      }))
      .filter(({ incomes }) => incomes.length > 0)
  }, [data.incomes, data.groups])

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  const calculateGroupTotal = (group: string, incomes: Income[], month?: number) => {
    if (month !== undefined) {
      return {
        amount: incomes.reduce((total, income) => {
          if (income.formula === "Per ETP") {
            return total + ((income.monthlyAmount[month] || 0) * (income.etpRate || 0))
          } else if (income.formula === "Retention") {
            return total + ((income.monthlyAmount[month] || 0) * (income.etpRate || 0))
          }
          return total + (income.monthlyAmount[month] || 0)
        }, 0),
        count: incomes.reduce((total, income) => {
          if (income.formula === "Per ETP") {
            return total + (income.monthlyAmount[month] || 0)
          } else if (income.formula === "Retention") {
            return total + (income.monthlyAmount[month] || 0)
          }
          return total
        }, 0)
      }
    }
    return {
      amount: incomes.reduce((total, income) => {
        if (income.formula === "Per ETP") {
          return total + income.monthlyAmount.reduce((sum, amount) =>
            sum + ((amount || 0) * (income.etpRate || 0)), 0)
        } else if (income.formula === "Retention") {
          return total + income.monthlyAmount.reduce((sum, amount) =>
            sum + ((amount || 0) * (income.etpRate || 0)), 0)
        }
        return total + income.monthlyAmount.reduce((sum, amount) => sum + (amount || 0), 0)
      }, 0),
      count: incomes.reduce((total, income) => {
        if (income.formula === "Per ETP") {
          return total + income.monthlyAmount.reduce((sum, amount) => sum + (amount || 0), 0)
        } else if (income.formula === "Retention") {
          return total + income.monthlyAmount.reduce((sum, amount) => sum + (amount || 0), 0)
        }
        return total
      }, 0)
    }
  }

  const renderGroupRow = (group: string, incomes: Income[]) => {
    const isExpanded = expandedGroups.has(group)
    const groupTotal = calculateGroupTotal(group, incomes)

    return (
      <TableRow key={`group-${group}`} className="bg-muted/50">
        <TableCell colSpan={1} className="font-bold">
          <div className="flex items-center gap-2">
            <button onClick={() => toggleGroup(group)} className="hover:opacity-70">
              {isExpanded ? "▼" : "▶"}
            </button>
            {group}
          </div>
        </TableCell>
        <TableCell />
        <TableCell />
        {months.map((_, index) => {
          const monthlyTotal = calculateGroupTotal(group, incomes, index)
          return (
            <TableCell key={index} className="font-bold">
              {isExpanded ? "" : (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {formatNumber(monthlyTotal.count)} {getEntityLabel()}
                  </div>
                  <div>{monthlyTotal.amount.toLocaleString("fr-FR")} €</div>
                </div>
              )}
            </TableCell>
          )
        })}
        <TableCell className="font-bold">
          {isExpanded ? "" : (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {formatNumber(groupTotal.count)} {getEntityLabel()}
              </div>
              <div>{groupTotal.amount.toLocaleString("fr-FR")} €</div>
            </div>
          )}
        </TableCell>
      </TableRow>
    )
  }

  const renderGroupSubtotalRow = (group: string, incomes: Income[]) => {
    const groupTotal = calculateGroupTotal(group, incomes)

    return (
      <TableRow key={`subtotal-${group}`} className="bg-muted/30">
        <TableCell colSpan={1} className="font-bold">
          Sous-total {group}
        </TableCell>
        <TableCell />
        <TableCell />
        {months.map((_, index) => {
          const monthlyTotal = calculateGroupTotal(group, incomes, index)
          return (
            <TableCell key={index} className="font-bold">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {formatNumber(monthlyTotal.count)} {getEntityLabel()}
                </div>
                <div>{monthlyTotal.amount.toLocaleString("fr-FR")} €</div>
              </div>
            </TableCell>
          )
        })}
        <TableCell className="font-bold">
          <div>
            {groupTotal.amount.toLocaleString("fr-FR")} €
          </div>
        </TableCell>
      </TableRow>
    )
  }

  const handleDeleteClick = (incomeId: string) => {
    setIncomeToDelete(incomeId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (incomeToDelete && data.incomes) {
      onChange({
        ...data,
        incomes: data.incomes.filter((income) => income.id !== incomeToDelete),
      })
      setDeleteDialogOpen(false)
      setIncomeToDelete(null)
    }
  }

  const openEditDialog = (income: Income) => {
    setIncomeToEdit(income)
    setEditIncomeName(income.name)
    setEditIncomeGroup(income.group)
    setEditIncomeFormula(income.formula)
    setEditIncomeAmount(income.formula === "Retention" ? (income.etpRate || 0) : (income.monthlyAmount[0] || 0))
    setEditIncomeEtpRate(income.etpRate || 0)
    setEditIncomeIsRecurring(income.isRecurring)
    setEditSelectedCategories(income.categories)
    setEditIncomeRetentionRate(income.retentionRate || 0)
    setEditIncomePreviousYearId(income.previousYearIncomeId || "")
    setEditDialogOpen(true)
  }

  const saveEdit = () => {
    if (!incomeToEdit || !data.incomes) return

    const updatedIncomes = data.incomes.map((income) => {
      if (income.id === incomeToEdit.id) {
        let updatedMonthlyAmount = []

        if (editIncomeFormula === "Retention" && editIncomePreviousYearId) {
          // Chercher l'income de référence dans les données de l'année précédente
          const previousYearData = yearlyData?.[selectedYear - 1]?.incomeData
          const previousIncome = previousYearData?.incomes?.find(
            (i) => i.id === editIncomePreviousYearId
          )

          if (previousIncome) {
            // Calculer les nouveaux montants mensuels en appliquant le taux de rétention
            updatedMonthlyAmount = previousIncome.monthlyAmount.map(
              amount => (amount * editIncomeRetentionRate) / 100
            )
          } else {
            // Si on ne trouve pas l'income de référence, initialiser à zéro
            updatedMonthlyAmount = Array(12).fill(0)
          }
        } else if (editIncomeFormula === "Amount") {
          // Pour les revenus de type Amount, gérer la récurrence
          updatedMonthlyAmount = editIncomeIsRecurring
            ? Array(12).fill(editIncomeAmount)
            : income.monthlyAmount.map((_, index) => index === 0 ? editIncomeAmount : 0)
        } else {
          // Pour les autres types (Per ETP), garder monthlyAmount comme avant
          updatedMonthlyAmount = editIncomeIsRecurring
            ? Array(12).fill(editIncomeAmount)
            : income.monthlyAmount.map((_, index) => index === 0 ? editIncomeAmount : 0)
        }

        return {
          ...income,
          name: editIncomeName,
          group: editIncomeGroup,
          categories: editSelectedCategories,
          formula: editIncomeFormula,
          isRecurring: editIncomeIsRecurring,
          monthlyAmount: updatedMonthlyAmount,
          etpRate: editIncomeFormula === "Per ETP" ? editIncomeEtpRate :
            editIncomeFormula === "Retention" ? editIncomeAmount :
              undefined,
          retentionRate: editIncomeFormula === "Retention" ? editIncomeRetentionRate : undefined,
          previousYearIncomeId: editIncomeFormula === "Retention" ? editIncomePreviousYearId : undefined
        }
      }
      return income
    })

    onChange({
      ...data,
      incomes: updatedIncomes,
    })

    setEditDialogOpen(false)
    setIncomeToEdit(null)
  }

  const addGroupInEdit = () => {
    if (!editNewGroup || data.groups?.includes(editNewGroup)) return

    onChange({
      ...data,
      groups: [...(data.groups || []), editNewGroup],
    })

    setEditIncomeGroup(editNewGroup)
    setEditNewGroup("")
    setIsEditingGroup(false)
  }

  const handleDuplicateClick = (income: Income) => {
    setIncomeToDuplicate(income)
    setSourceYear(2025) // Année par défaut
    setTargetYear(2025) // Année par défaut
    setDuplicateDialogOpen(true)
  }

  const confirmDuplicate = () => {
    if (!incomeToDuplicate || !onIncomeDuplicate) return
    onIncomeDuplicate(incomeToDuplicate, sourceYear, targetYear)
    setDuplicateDialogOpen(false)
    setIncomeToDuplicate(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Income</CardTitle>
        <div className="flex items-center gap-2">
          {isReadOnly || (viewMode as "month" | "year") === "year" ? (
            <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
              {(viewMode as "month" | "year") === "year" ? "Annual view (read-only)" : "Global view (read-only)"}
            </div>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter un revenu</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations pour ajouter un nouveau revenu.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="income-name" className="text-right">
                      Nom
                    </Label>
                    <div className="col-span-3">
                      <Input
                        id="income-name"
                        value={newIncomeName}
                        onChange={(e) => setNewIncomeName(e.target.value)}
                        className={formErrors.name ? "border-red-500" : ""}
                      />
                      {formErrors.name && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="income-group" className="text-right">
                      Groupe
                    </Label>
                    {isAddingGroup ? (
                      <div className="col-span-3 flex gap-2">
                        <Input
                          id="new-group"
                          value={newGroup}
                          onChange={(e) => setNewGroup(e.target.value)}
                          className="flex-1"
                          placeholder="Nouveau nom de groupe"
                        />
                        <Button size="sm" onClick={addGroup}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsAddingGroup(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="col-span-3 flex gap-2">
                        <Select
                          value={selectedGroup}
                          onValueChange={setSelectedGroup}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(data.groups || ["Non trié"]).map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" onClick={() => setIsAddingGroup(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="income-category" className="text-right">
                      Catégories
                    </Label>
                    <div className="col-span-3">
                      {isAddingCategory ? (
                        <div className="flex gap-2">
                          <Input
                            id="new-category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="flex-1"
                            placeholder="Nouveau nom de catégorie"
                          />
                          <Button size="sm" onClick={addCategory}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsAddingCategory(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Select
                            value={newIncomeCategory}
                            onValueChange={(value) => {
                              if (typeof value === "string") {
                                setNewIncomeCategory(value)
                                setSelectedCategories(prev =>
                                  prev.includes(value)
                                    ? prev.filter(cat => cat !== value)
                                    : [...prev, value]
                                )
                              }
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Sélectionner des catégories" />
                            </SelectTrigger>
                            <SelectContent>
                              {data.categories?.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline" onClick={() => setIsAddingCategory(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {selectedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCategories.map((category) => (
                            <div
                              key={category}
                              className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                            >
                              {category}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => removeCategory(category)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {formErrors.categories && (
                        <p className="text-sm text-red-500 mt-1">{formErrors.categories}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="income-formula" className="text-right">
                      Formule
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={newIncomeFormula}
                        onValueChange={(value: "Amount" | "Per ETP" | "Retention") => setNewIncomeFormula(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Amount">Montant fixe</SelectItem>
                          <SelectItem value="Per ETP">Par ETP</SelectItem>
                          <SelectItem value="Retention">Rétention</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newIncomeFormula === "Amount" ? (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="income-amount" className="text-right">
                        Montant (€)
                      </Label>
                      <div className="col-span-3">
                        <Input
                          id="income-amount"
                          type="number"
                          value={newIncomeAmount || ""}
                          onChange={(e) => setNewIncomeAmount(Number(e.target.value))}
                          className={formErrors.amount ? "border-red-500" : ""}
                        />
                        {formErrors.amount && (
                          <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>
                        )}
                      </div>
                    </div>
                  ) : newIncomeFormula === "Per ETP" ? (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="income-etp-rate" className="text-right">
                          CA par ETP (€)
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="income-etp-rate"
                            type="number"
                            value={newIncomeEtpRate || ""}
                            onChange={(e) => setNewIncomeEtpRate(Number(e.target.value))}
                            className={formErrors.amount ? "border-red-500" : ""}
                          />
                          {formErrors.amount && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="income-etp-count" className="text-right">
                          Nombre d'ETP
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="income-etp-count"
                            type="number"
                            value={newIncomeAmount || ""}
                            onChange={(e) => setNewIncomeAmount(Number(e.target.value))}
                            className={formErrors.amount ? "border-red-500" : ""}
                            step="0.1"
                          />
                          {formErrors.amount && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="income-retention-rate" className="text-right">
                          Taux de rétention (%)
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="income-retention-rate"
                            type="number"
                            min="0"
                            max="200"
                            value={newIncomeRetentionRate || ""}
                            onChange={(e) => setNewIncomeRetentionRate(Number(e.target.value))}
                            className={formErrors.amount ? "border-red-500" : ""}
                          />
                          {formErrors.amount && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="previousYearIncome">Revenu année précédente</Label>
                        <div className="col-span-3 flex items-center gap-2">
                          <Select
                            value={newIncomePreviousYearId}
                            onValueChange={setNewIncomePreviousYearId}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Sélectionner un revenu" />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const previousYearData = yearlyData?.[selectedYear - 1]?.incomeData;
                                if (!previousYearData?.incomes?.length) {
                                  return (
                                    <SelectItem value="no-data" disabled>
                                      Aucun revenu disponible pour l'année {selectedYear - 1}
                                    </SelectItem>
                                  );
                                }
                                const eligibleIncomes = previousYearData.incomes.filter(income =>
                                  income.formula === "Per ETP" || income.formula === "Retention"
                                );
                                if (eligibleIncomes.length === 0) {
                                  return (
                                    <SelectItem value="no-data" disabled>
                                      Aucun revenu de type "Par ETP" ou "Rétention" disponible pour l'année {selectedYear - 1}
                                    </SelectItem>
                                  );
                                }
                                return eligibleIncomes.map((income) => (
                                  <SelectItem key={income.id} value={income.id}>
                                    {income.name} ({income.formula === "Per ETP" ? "Par ETP" : "Rétention"})
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="income-amount" className="text-right">
                          Montant (€)
                        </Label>
                        <div className="col-span-3">
                          <Input
                            id="income-amount"
                            type="number"
                            value={newIncomeAmount || ""}
                            onChange={(e) => setNewIncomeAmount(Number(e.target.value))}
                            className={formErrors.amount ? "border-red-500" : ""}
                          />
                          {formErrors.amount && (
                            <p className="text-sm text-red-500 mt-1">{formErrors.amount}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Récurrent</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Checkbox
                        id="income-recurring"
                        checked={newIncomeIsRecurring}
                        onCheckedChange={(checked) => setNewIncomeIsRecurring(checked === true)}
                      />
                      <Label htmlFor="income-recurring">Appliquer à tous les mois</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addIncome}>Ajouter</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Metric</TableHead>
                {viewMode === "month" && (
                  <>
                    <TableHead className="w-[150px]">Categories</TableHead>
                    <TableHead className="w-[80px]">Recurring</TableHead>
                  </>
                )}
                {viewMode === "month" ? (
                  months.map((month) => (
                    <TableHead key={month} className="min-w-[120px]">{month}</TableHead>
                  ))
                ) : (
                  years.map((year) => (
                    <TableHead key={year} className="min-w-[120px]">{year}</TableHead>
                  ))
                )}
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewMode === "month" ? (
                <>
                  {groupedIncomes.map(({ group, incomes }) => (
                    <React.Fragment key={group}>
                      {renderGroupRow(group, incomes)}
                      {expandedGroups.has(group) && (
                        <>
                          {incomes.map((income: Income) => (
                            <TableRow key={income.id}>
                              <TableCell className="font-medium">
                                <div className="space-y-1">
                                  {income.name}
                                  {income.formula === "Retention" && (
                                    <div className="text-xs text-muted-foreground">
                                      {income.retentionRate}% de rétention
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {income.categories.map((category) => (
                                    <div
                                      key={category}
                                      className="px-2 py-1 rounded-md bg-secondary text-sm"
                                    >
                                      {category}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {income.formula === "Amount" && (
                                  <Checkbox
                                    checked={income.isRecurring}
                                    onCheckedChange={(checked) => toggleIncomeRecurring(income.id, checked as boolean)}
                                    disabled={isReadOnly}
                                  />
                                )}
                              </TableCell>
                              {months.map((_, index) => {
                                const yearIncome = data.incomes?.find(i => i.id === income.id)
                                if (!yearIncome) {
                                  return (
                                    <TableCell key={index} className="min-w-[120px]">
                                      <div className="space-y-1">
                                        <div className="px-2 py-1 rounded-md bg-muted/50">
                                          0 €
                                        </div>
                                      </div>
                                    </TableCell>
                                  )
                                }

                                const yearlyAmount = yearIncome.monthlyAmount[index] || 0
                                return (
                                  <TableCell key={index} className="min-w-[120px]">
                                    <div className="space-y-1">
                                      {yearIncome.formula === "Per ETP" && (
                                        <div className="text-xs text-muted-foreground">
                                          {isReadOnly ? (
                                            formatNumber(yearlyAmount)
                                          ) : (
                                            <Input
                                              type="number"
                                              value={yearlyAmount || ""}
                                              onChange={(e) => handleIncomeAmountChange(income.id, index, Number(e.target.value))}
                                              className="w-full"
                                              step="0.1"
                                            />
                                          )} {getEntityLabel()}
                                        </div>
                                      )}
                                      {yearIncome.formula === "Retention" && (
                                        <div className="space-y-1">
                                          <Input
                                            type="text"
                                            value={(() => {
                                              const previousYearData = yearlyData?.[selectedYear - 1]?.incomeData;
                                              if (!previousYearData?.incomes?.length) return "0";

                                              const previousYearIncome = previousYearData.incomes.find(i => i.id === yearIncome.previousYearIncomeId);
                                              if (!previousYearIncome) return "0";

                                              const previousYearAmount = previousYearIncome.monthlyAmount[index] || 0;
                                              const retentionAmount = previousYearAmount * (yearIncome.retentionRate || 0) / 100;

                                              return formatNumber(retentionAmount);
                                            })()}
                                            readOnly
                                            className="w-full"
                                          />
                                        </div>
                                      )}
                                      {yearIncome.formula === "Per ETP" ? (
                                        <div className="px-2 py-1 rounded-md bg-muted/50">
                                          {(yearlyAmount * (yearIncome.etpRate || 0)).toLocaleString("fr-FR")} €
                                        </div>
                                      ) : yearIncome.formula === "Retention" ? (
                                        <div className="px-2 py-1 rounded-md bg-muted/50">
                                          {(yearlyAmount * (yearIncome.etpRate || 0)).toLocaleString("fr-FR")} €
                                        </div>
                                      ) : (
                                        isReadOnly ? (
                                          <div className="px-2 py-1 rounded-md bg-muted/50">
                                            {yearlyAmount.toLocaleString("fr-FR")} €
                                          </div>
                                        ) : (
                                          <Input
                                            type="number"
                                            value={yearlyAmount || ""}
                                            onChange={(e) => handleIncomeAmountChange(income.id, index, Number(e.target.value))}
                                            className="w-full"
                                          />
                                        )
                                      )}
                                    </div>
                                  </TableCell>
                                )
                              })}
                              <TableCell className="font-bold">
                                {(() => {
                                  if (income.formula === "Per ETP") {
                                    return income.monthlyAmount.reduce((sum, monthlyAmount, index) =>
                                      sum + (monthlyAmount * (income.etpRate || 0)), 0).toLocaleString("fr-FR") + " €"
                                  } else if (income.formula === "Retention") {
                                    return income.monthlyAmount.reduce((sum, monthlyAmount) =>
                                      sum + (monthlyAmount * (income.etpRate || 0)), 0).toLocaleString("fr-FR") + " €"
                                  }
                                  return income.monthlyAmount.reduce((sum, monthlyAmount) => sum + monthlyAmount, 0).toLocaleString("fr-FR") + " €"
                                })()}
                              </TableCell>
                              {!isReadOnly && (
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => openEditDialog(income)}>
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDuplicateClick(income)}>
                                        Dupliquer
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteClick(income.id)} className="text-destructive">
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                          {renderGroupSubtotalRow(group, incomes)}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Total Revenue (€)</TableCell>
                    <TableCell />
                    <TableCell />
                    {months.map((_, index) => (
                      <TableCell key={index} className="min-w-[120px] font-bold">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(calculateMonthlyTotal(index).count)} {getEntityLabel()}
                          </div>
                          <div>{calculateMonthlyTotal(index).amount.toLocaleString("fr-FR")} €</div>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="font-bold">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                          {formatNumber(calculateTotal().count)} {getEntityLabel()}
                        </div>
                        <div>{calculateTotal().amount.toLocaleString("fr-FR")} €</div>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell className="font-bold">Total Revenue (€)</TableCell>
                  <TableCell />
                  <TableCell />
                  {months.map((_, index) => (
                    <TableCell key={index} className="min-w-[120px] font-bold">
                      {calculateMonthlyTotal(index).amount.toLocaleString("fr-FR")}
                    </TableCell>
                  ))}
                  <TableCell className="font-bold">{calculateTotal().amount.toLocaleString("fr-FR")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer ce revenu ?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Non
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Oui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le revenu</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-income-name" className="text-right">
                Nom
              </Label>
              <Input
                id="edit-income-name"
                value={editIncomeName}
                onChange={(e) => setEditIncomeName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-income-group" className="text-right">
                Groupe
              </Label>
              {isEditingGroup ? (
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="edit-new-group"
                    value={editNewGroup}
                    onChange={(e) => setEditNewGroup(e.target.value)}
                    className="flex-1"
                    placeholder="Nouveau groupe"
                  />
                  <Button size="sm" onClick={addGroupInEdit}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingGroup(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="col-span-3 flex gap-2">
                  <Select
                    value={editIncomeGroup}
                    onValueChange={setEditIncomeGroup}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(data.groups || ["Non trié"]).map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingGroup(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-income-formula" className="text-right">
                Formule
              </Label>
              <div className="col-span-3">
                <Select
                  value={editIncomeFormula}
                  onValueChange={(value: "Amount" | "Per ETP" | "Retention") => setEditIncomeFormula(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amount">Montant fixe</SelectItem>
                    <SelectItem value="Per ETP">Par ETP</SelectItem>
                    <SelectItem value="Retention">Rétention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editIncomeFormula === "Amount" ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-income-amount" className="text-right">
                  Montant (€)
                </Label>
                <Input
                  id="edit-income-amount"
                  type="number"
                  value={editIncomeAmount || ""}
                  onChange={(e) => setEditIncomeAmount(Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
            ) : editIncomeFormula === "Per ETP" ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-income-etp-rate" className="text-right">
                    CA par ETP (€)
                  </Label>
                  <Input
                    id="edit-income-etp-rate"
                    type="number"
                    value={editIncomeEtpRate || ""}
                    onChange={(e) => setEditIncomeEtpRate(Number(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-income-etp-count" className="text-right">
                    Nombre d'ETP
                  </Label>
                  <Input
                    id="edit-income-etp-count"
                    type="number"
                    value={editIncomeAmount || ""}
                    onChange={(e) => setEditIncomeAmount(Number(e.target.value))}
                    className="col-span-3"
                    step="0.1"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-income-retention-rate" className="text-right">
                    Taux de rétention (%)
                  </Label>
                  <Input
                    id="edit-income-retention-rate"
                    type="number"
                    min="0"
                    max="200"
                    value={editIncomeRetentionRate || ""}
                    onChange={(e) => setEditIncomeRetentionRate(Number(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-previousYearIncome">Revenu année précédente</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Select
                      value={editIncomePreviousYearId}
                      onValueChange={setEditIncomePreviousYearId}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sélectionner un revenu" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const previousYearData = yearlyData?.[selectedYear - 1]?.incomeData;
                          if (!previousYearData?.incomes?.length) {
                            return (
                              <SelectItem value="no-data" disabled>
                                Aucun revenu disponible pour l'année {selectedYear - 1}
                              </SelectItem>
                            );
                          }
                          const eligibleIncomes = previousYearData.incomes.filter(income =>
                            income.formula === "Per ETP" || income.formula === "Retention"
                          );
                          if (eligibleIncomes.length === 0) {
                            return (
                              <SelectItem value="no-data" disabled>
                                Aucun revenu de type "Par ETP" ou "Rétention" disponible pour l'année {selectedYear - 1}
                              </SelectItem>
                            );
                          }
                          return eligibleIncomes.map((income) => (
                            <SelectItem key={income.id} value={income.id}>
                              {income.name} ({income.formula === "Per ETP" ? "Par ETP" : "Rétention"})
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-income-amount" className="text-right">
                    Montant (€)
                  </Label>
                  <Input
                    id="edit-income-amount"
                    type="number"
                    value={editIncomeAmount || ""}
                    onChange={(e) => setEditIncomeAmount(Number(e.target.value))}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Récurrent</Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Checkbox
                  id="edit-income-recurring"
                  checked={editIncomeIsRecurring}
                  onCheckedChange={(checked) => setEditIncomeIsRecurring(checked === true)}
                />
                <Label htmlFor="edit-income-recurring">Appliquer à tous les mois</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dupliquer le revenu</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Année source</Label>
                <Select value={sourceYear.toString()} onValueChange={(value) => setSourceYear(Number(value))}>
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label>Année cible</Label>
                <Select value={targetYear.toString()} onValueChange={(value) => setTargetYear(Number(value))}>
                  <SelectTrigger>
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
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmDuplicate}>Dupliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// Composant séparé pour la vue annuelle, sans aucune interaction avec le state parent
function YearlyIncomeTable({ data, entityType, yearlyData, isReadOnly }: {
  data: IncomeData
  entityType?: EntityType
  yearlyData?: Record<number, { incomeData: IncomeData; expenseData: ExpenseData }> | null
  isReadOnly: boolean
}) {
  const years = Array.from({ length: 16 }, (_, i) => 2020 + i)
  const yearlyViewData = React.useMemo(() => {
    return years.map(year => {
      const yearData = yearlyData?.[year]?.incomeData
      return {
        year,
        incomes: yearData?.incomes || [],
        amount: 0,
        count: 0
      }
    })
  }, [years, yearlyData])

  const yearlyTotals = React.useMemo(() => {
    return yearlyViewData.map(yearData => {
      const totalAmount = (yearData.incomes?.reduce((acc, income) => {
        const yearlyAmount = income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)

        // S'assurer que etpRate est disponible, même pour les années où il pourrait manquer
        let incomeEtpRate = income.etpRate;
        if (!incomeEtpRate && yearlyData) {
          // Chercher dans toutes les années pour trouver le même income avec etpRate défini
          Object.values(yearlyData).forEach(yearlyDataItem => {
            if (yearlyDataItem?.incomeData?.incomes) {
              const sameIncome = yearlyDataItem.incomeData.incomes.find(i => i.id === income.id && i.etpRate);
              if (sameIncome && sameIncome.etpRate) {
                incomeEtpRate = sameIncome.etpRate;
              }
            }
          });
        }
        incomeEtpRate = incomeEtpRate || 0;

        if (income.formula === "Per ETP") {
          return acc + (yearlyAmount * incomeEtpRate)
        } else if (income.formula === "Retention") {
          return acc + (yearlyAmount * incomeEtpRate)
        }
        return acc + yearlyAmount
      }, 0) || 0)

      const totalCount = (yearData.incomes?.reduce((acc, income) => {
        if (income.formula === "Per ETP") {
          return acc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
        } else if (income.formula === "Retention") {
          return acc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
        }
        return acc
      }, 0) || 0)

      return {
        year: yearData.year,
        amount: totalAmount,
        count: totalCount
      }
    })
  }, [yearlyViewData, yearlyData])

  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())

  // Fonction pour obtenir le label de l'entité
  const getEntityLabel = () => {
    switch (entityType) {
      case "École":
        return "Étudiants"
      default:
        return "ETP"
    }
  }

  // Grouper les revenus par groupe
  const groupedIncomes = React.useMemo(() => {
    const allIncomes = yearlyViewData.reduce((acc, yearData) => {
      yearData.incomes.forEach(income => {
        if (!acc[income.group]) {
          acc[income.group] = {}
        }
        if (!acc[income.group][yearData.year]) {
          acc[income.group][yearData.year] = {
            year: yearData.year,
            amount: 0,
            count: 0,
            incomes: []
          }
        }
        acc[income.group][yearData.year].incomes.push(income)
      })
      return acc
    }, {} as Record<string, Record<number, { year: number; amount: number; count: number; incomes: Income[] }>>)

    // Récupérer tous les incomes uniques de toutes les années en se basant sur le nom et le groupe
    const uniqueIncomes = new Map<string, Income>()
    yearlyViewData.forEach(yearData => {
      yearData.incomes.forEach(income => {
        const key = `${income.group}-${income.name}`
        if (!uniqueIncomes.has(key)) {
          uniqueIncomes.set(key, income)
        }
      })
    })

    return Object.entries(allIncomes).map(([group, yearData]) => ({
      group,
      yearData,
      uniqueIncomes: Array.from(uniqueIncomes.values()).filter(income => income.group === group)
    }))
  }, [yearlyViewData, yearlyData])

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Income</CardTitle>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
            Annual view (read-only)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Metric</TableHead>
                {years.map((year) => (
                  <TableHead key={year} className="min-w-[120px]">{year}</TableHead>
                ))}
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedIncomes.map(({ group, yearData, uniqueIncomes }) => (
                <React.Fragment key={group}>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleGroup(group)} className="hover:opacity-70">
                          {expandedGroups.has(group) ? "▼" : "▶"}
                        </button>
                        {group}
                      </div>
                    </TableCell>
                    {years.map((year) => {
                      const currentYearData = yearData[year]
                      const yearTotal = currentYearData?.incomes?.reduce((acc, income) => {
                        const yearlyAmount = income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                        if (income.formula === "Per ETP") {
                          return acc + (yearlyAmount * (income.etpRate || 0))
                        } else if (income.formula === "Retention") {
                          return acc + (yearlyAmount * (income.etpRate || 0))
                        }
                        return acc + yearlyAmount
                      }, 0) || 0

                      const yearCount = currentYearData?.incomes?.reduce((acc, income) => {
                        if (income.formula === "Per ETP") {
                          return acc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                        } else if (income.formula === "Retention") {
                          return acc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                        }
                        return acc
                      }, 0) || 0

                      return (
                        <TableCell key={year} className="min-w-[120px]">
                          {!expandedGroups.has(group) && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                {formatNumber(yearCount)} {getEntityLabel()}
                              </div>
                              <div className="px-2 py-1 rounded-md bg-muted/50">
                                {yearTotal.toLocaleString("fr-FR")} €
                              </div>
                            </div>
                          )}
                        </TableCell>
                      )
                    })}
                    <TableCell className="font-bold">
                      {!expandedGroups.has(group) && (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {formatNumber(years.reduce((acc, year) => {
                              const currentYearData = yearData[year]
                              return acc + (currentYearData?.incomes?.reduce((yearAcc, income) => {
                                if (income.formula === "Per ETP") {
                                  return yearAcc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                                } else if (income.formula === "Retention") {
                                  return yearAcc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                                }
                                return yearAcc
                              }, 0) || 0)
                            }, 0))} {getEntityLabel()}
                          </div>
                          <div>
                            {years.reduce((acc, year) => {
                              const currentYearData = yearData[year]
                              return acc + (currentYearData?.incomes?.reduce((yearAcc, income) => {
                                const yearlyAmount = income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                                if (income.formula === "Per ETP") {
                                  return yearAcc + (yearlyAmount * (income.etpRate || 0))
                                } else if (income.formula === "Retention") {
                                  return yearAcc + (yearlyAmount * (income.etpRate || 0))
                                }
                                return yearAcc + yearlyAmount
                              }, 0) || 0)
                            }, 0).toLocaleString("fr-FR")} €
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedGroups.has(group) && (
                    <>
                      {uniqueIncomes.map((baseIncome: Income) => (
                        <TableRow key={`${baseIncome.group}-${baseIncome.name}`}>
                          <TableCell className="font-medium">
                            <div className="space-y-1">
                              {baseIncome.name}
                            </div>
                          </TableCell>
                          {years.map((year) => {
                            const currentYearData = yearData[year]
                            const currentIncome = currentYearData?.incomes.find(i =>
                              i.name === baseIncome.name && i.group === baseIncome.group
                            )

                            if (!currentIncome) {
                              return (
                                <TableCell key={year} className="min-w-[120px]">
                                  <div className="px-2 py-1 rounded-md bg-muted/50">
                                    0 €
                                  </div>
                                </TableCell>
                              )
                            }

                            // S'assurer que etpRate existe toujours sur l'objet, même pour les années différentes
                            const incomeEtpRate = currentIncome.etpRate || baseIncome.etpRate || 0

                            const yearlyAmount = currentIncome.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                            let calculatedAmount = 0
                            let calculatedCount = 0

                            if (currentIncome.formula === "Per ETP") {
                              calculatedAmount = yearlyAmount * incomeEtpRate
                              calculatedCount = yearlyAmount
                            } else if (currentIncome.formula === "Retention") {
                              calculatedAmount = yearlyAmount * incomeEtpRate
                              calculatedCount = yearlyAmount
                            } else {
                              calculatedAmount = yearlyAmount
                            }

                            return (
                              <TableCell key={year} className="min-w-[120px]">
                                <div className="space-y-1">
                                  {(currentIncome.formula === "Per ETP" || currentIncome.formula === "Retention") && (
                                    <div className="text-xs text-muted-foreground">
                                      {formatNumber(calculatedCount)} {getEntityLabel()}
                                    </div>
                                  )}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="px-2 py-1 rounded-md bg-muted/50 cursor-help">
                                          {calculatedAmount.toLocaleString("fr-FR")} €
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="space-y-1 text-sm">
                                          <div>Formule : {currentIncome.formula === "Per ETP" ? "Par ETP" :
                                            currentIncome.formula === "Retention" ? "Rétention" : "Montant fixe"}</div>
                                          {(currentIncome.formula === "Per ETP" || currentIncome.formula === "Retention") && (
                                            <div>Taux ETP : {incomeEtpRate.toLocaleString("fr-FR")} €</div>
                                          )}
                                          {currentIncome.formula === "Retention" && (
                                            <div>Taux de rétention : {currentIncome.retentionRate}%</div>
                                          )}
                                          <div>Calcul : {(() => {
                                            if (currentIncome.formula === "Per ETP") {
                                              return `${formatNumber(yearlyAmount)} ETP × ${incomeEtpRate.toLocaleString("fr-FR")} €`
                                            } else if (currentIncome.formula === "Retention") {
                                              return `${formatNumber(yearlyAmount)} ETP × ${incomeEtpRate.toLocaleString("fr-FR")} €`
                                            }
                                            return `${yearlyAmount.toLocaleString("fr-FR")} €`
                                          })()}</div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {currentIncome.formula === "Retention" && (
                                    <div className="text-xs text-muted-foreground">
                                      {currentIncome.retentionRate}% de rétention
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            )
                          })}
                          <TableCell className="font-bold">
                            <div className="space-y-1">
                              {(baseIncome.formula === "Per ETP" || baseIncome.formula === "Retention") && (
                                <div className="text-xs text-muted-foreground">
                                  {formatNumber(Object.values(yearData).reduce((acc, data) => {
                                    const currentIncome = data?.incomes?.find(i => i.id === baseIncome.id)
                                    if (!currentIncome) return acc
                                    if (currentIncome.formula === "Per ETP") {
                                      return acc + currentIncome.monthlyAmount.reduce((acc, a) => acc + a, 0)
                                    } else if (currentIncome.formula === "Retention") {
                                      return acc + currentIncome.monthlyAmount.reduce((acc, a) => acc + a, 0)
                                    }
                                    return acc
                                  }, 0))} {getEntityLabel()}
                                </div>
                              )}
                              <div>
                                {Object.values(yearData).reduce((acc, data) => {
                                  const currentIncome = data?.incomes?.find(i => i.id === baseIncome.id)
                                  if (!currentIncome) return acc
                                  const yearlyAmount = currentIncome.monthlyAmount.reduce((acc, a) => acc + a, 0)
                                  if (currentIncome.formula === "Per ETP") {
                                    return acc + (yearlyAmount * (currentIncome.etpRate || 0))
                                  } else if (currentIncome.formula === "Retention") {
                                    return acc + (yearlyAmount * (currentIncome.etpRate || 0))
                                  }
                                  return acc + yearlyAmount
                                }, 0).toLocaleString("fr-FR")} €
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-bold">
                          Sous-total {group}
                        </TableCell>
                        {years.map((year) => {
                          const currentYearData = yearData[year]

                          // Calculer le total pour ce groupe et cette année avec le taux correct
                          const yearTotal = currentYearData?.incomes?.reduce((acc, income) => {
                            const yearlyAmount = income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                            // S'assurer que etpRate existe toujours sur l'objet
                            const incomeEtpRate = income.etpRate ||
                              uniqueIncomes.find(i => i.id === income.id)?.etpRate || 0

                            if (income.formula === "Per ETP") {
                              return acc + (yearlyAmount * incomeEtpRate)
                            } else if (income.formula === "Retention") {
                              return acc + (yearlyAmount * incomeEtpRate)
                            }
                            return acc + yearlyAmount
                          }, 0) || 0

                          const yearCount = currentYearData?.incomes?.reduce((acc, income) => {
                            if (income.formula === "Per ETP") {
                              return acc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                            } else if (income.formula === "Retention") {
                              return acc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                            }
                            return acc
                          }, 0) || 0

                          return (
                            <TableCell key={year} className="min-w-[120px]">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">
                                  {formatNumber(yearCount)} {getEntityLabel()}
                                </div>
                                <div className="px-2 py-1 rounded-md bg-muted/50">
                                  {yearTotal.toLocaleString("fr-FR")} €
                                </div>
                              </div>
                            </TableCell>
                          )
                        })}
                        <TableCell className="font-bold">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(years.reduce((acc, year) => {
                                const currentYearData = yearData[year]
                                return acc + (currentYearData?.incomes?.reduce((yearAcc, income) => {
                                  if (income.formula === "Per ETP") {
                                    return yearAcc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                                  } else if (income.formula === "Retention") {
                                    return yearAcc + income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                                  }
                                  return yearAcc
                                }, 0) || 0)
                              }, 0))} {getEntityLabel()}
                            </div>
                            <div>
                              {years.reduce((acc, year) => {
                                const currentYearData = yearData[year]
                                return acc + (currentYearData?.incomes?.reduce((yearAcc, income) => {
                                  const yearlyAmount = income.monthlyAmount.reduce((acc, amount) => acc + amount, 0)
                                  // S'assurer que etpRate existe toujours sur l'objet
                                  const incomeEtpRate = income.etpRate ||
                                    uniqueIncomes.find(i => i.id === income.id)?.etpRate || 0

                                  if (income.formula === "Per ETP") {
                                    return yearAcc + (yearlyAmount * incomeEtpRate)
                                  } else if (income.formula === "Retention") {
                                    return yearAcc + (yearlyAmount * incomeEtpRate)
                                  }
                                  return yearAcc + yearlyAmount
                                }, 0) || 0)
                              }, 0).toLocaleString("fr-FR")} €
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </React.Fragment>
              ))}
              <TableRow>
                <TableCell className="font-bold">Total Revenue (€)</TableCell>
                {yearlyTotals.map((total) => (
                  <TableCell key={total.year} className="font-bold">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(total.count)} {getEntityLabel()}
                      </div>
                      <div>{total.amount.toLocaleString("fr-FR")} €</div>
                    </div>
                  </TableCell>
                ))}
                <TableCell className="font-bold">
                  <div>
                    {yearlyTotals.reduce((sum, total) => sum + total.amount, 0).toLocaleString("fr-FR")} €
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


