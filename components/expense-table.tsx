"use client"

import * as React from "react"
import { Plus, Save, Trash, X, Filter, MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { IncomeData } from "./income-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export interface Expense {
  id: string
  name: string
  categories: string[]
  group: string
  isRecurring: boolean
  monthlyAmount: number[]
  formula?: "Amount" | "Income %" | "Expense %"
  formulaPercentage?: number
  formulaExpenseId?: string
}

export interface ExpenseData {
  expenses: Expense[]
  categories: string[]
  groups: string[]
  yearlyData?: Record<number, {
    incomeData: IncomeData
    expenseData: ExpenseData
  }>
}

interface ExpenseTableProps {
  data: ExpenseData
  onChange: (data: ExpenseData) => void
  isReadOnly?: boolean
  isGlobalView?: boolean
  viewMode?: "month" | "year"
  yearlyData?: Record<number, { incomeData: IncomeData; expenseData: ExpenseData }> | null
  incomeData?: IncomeData
  onExpenseDuplicate?: (expense: Expense, sourceYear: number, targetYear: number) => void
}

export function ExpenseTable({ data, onChange, isReadOnly = false, isGlobalView = false, viewMode = "month", yearlyData = null, incomeData, onExpenseDuplicate }: ExpenseTableProps) {
  const [newExpenseName, setNewExpenseName] = React.useState("")
  const [newExpenseCategory, setNewExpenseCategory] = React.useState<string>("")
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [newExpenseAmount, setNewExpenseAmount] = React.useState(0)
  const [newExpenseIsRecurring, setNewExpenseIsRecurring] = React.useState(true)
  const [newExpenseFormula, setNewExpenseFormula] = React.useState<"Amount" | "Income %" | "Expense %">("Amount")
  const [newExpenseFormulaPercentage, setNewExpenseFormulaPercentage] = React.useState<number>(0)
  const [newExpenseFormulaExpenseId, setNewExpenseFormulaExpenseId] = React.useState<string>("")
  const [isAddingCategory, setIsAddingCategory] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")
  const [isAddingGroup, setIsAddingGroup] = React.useState(false)
  const [newGroup, setNewGroup] = React.useState("")
  const [selectedGroup, setSelectedGroup] = React.useState<string>("Non trié")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = React.useState<string | null>(null)
  const [isEditingCategories, setIsEditingCategories] = React.useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = React.useState(false)
  const [filteredCategories, setFilteredCategories] = React.useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [expenseToDelete, setExpenseToDelete] = React.useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [expenseToEdit, setExpenseToEdit] = React.useState<Expense | null>(null)
  const [editExpenseName, setEditExpenseName] = React.useState("")
  const [editExpenseGroup, setEditExpenseGroup] = React.useState("")
  const [editExpenseFormula, setEditExpenseFormula] = React.useState<"Amount" | "Income %" | "Expense %">("Amount")
  const [editExpenseFormulaPercentage, setEditExpenseFormulaPercentage] = React.useState<number>(0)
  const [editExpenseFormulaExpenseId, setEditExpenseFormulaExpenseId] = React.useState<string>("")
  const [editExpenseAmount, setEditExpenseAmount] = React.useState<number>(0)
  const [isEditingGroup, setIsEditingGroup] = React.useState(false)
  const [editNewGroup, setEditNewGroup] = React.useState("")
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set())
  const [duplicateDialogOpen, setDuplicateDialogOpen] = React.useState(false)
  const [expenseToDuplicate, setExpenseToDuplicate] = React.useState<Expense | null>(null)
  const [sourceYear, setSourceYear] = React.useState<number>(2025)
  const [targetYear, setTargetYear] = React.useState<number>(2025)

  // Initialize groups if not present
  React.useEffect(() => {
    if (!data.groups || data.groups.length === 0) {
      onChange({
        ...data,
        groups: ["Non trié"]
      })
    }
  }, [data, onChange])

  // Ensure all expenses have a group
  React.useEffect(() => {
    const hasExpensesWithoutGroup = data.expenses.some(expense => !expense.group)
    if (hasExpensesWithoutGroup) {
      const updatedExpenses = data.expenses.map(expense => ({
        ...expense,
        group: expense.group || "Non trié"
      }))
      onChange({
        ...data,
        expenses: updatedExpenses
      })
    }
  }, [data, onChange])

  // Recalculer les montants des dépenses quand le CA change
  React.useEffect(() => {
    if (!incomeData) return

    const updatedExpenses = data.expenses.map(expense => {
      if (expense.formula === "Income %" && expense.formulaPercentage) {
        return {
          ...expense,
          monthlyAmount: incomeData.monthlyData.revenue.map(revenue =>
            (revenue * expense.formulaPercentage!) / 100
          )
        }
      }
      return expense
    })

    // Ne mettre à jour que si des changements ont été effectués
    if (JSON.stringify(updatedExpenses) !== JSON.stringify(data.expenses)) {
      onChange({
        ...data,
        expenses: updatedExpenses
      })
    }
  }, [incomeData, data, onChange])

  // Recalculer les montants des dépenses qui utilisent la formule "Expense %"
  React.useEffect(() => {
    const updatedExpenses = data.expenses.map(expense => {
      if (expense.formula === "Expense %" && expense.formulaPercentage && expense.formulaExpenseId) {
        const referenceExpense = data.expenses.find(e => e.id === expense.formulaExpenseId)
        if (referenceExpense) {
          return {
            ...expense,
            monthlyAmount: referenceExpense.monthlyAmount.map(amount =>
              (amount * expense.formulaPercentage!) / 100
            )
          }
        }
      }
      return expense
    })

    // Ne mettre à jour que si des changements ont été effectués
    if (JSON.stringify(updatedExpenses) !== JSON.stringify(data.expenses)) {
      onChange({
        ...data,
        expenses: updatedExpenses
      })
    }
  }, [data.expenses, onChange])

  const addExpense = () => {
    if (!newExpenseName || (newExpenseFormula === "Amount" && !newExpenseAmount)) return

    // S'assurer que le groupe est défini
    const groupToUse = selectedGroup || "Non trié"

    // S'assurer que le groupe existe dans la liste des groupes
    if (!data.groups.includes(groupToUse)) {
      onChange({
        ...data,
        groups: [...data.groups, groupToUse]
      })
    }

    // Calculer les montants mensuels en fonction de la formule
    let monthlyAmounts: number[] = []
    if (newExpenseFormula === "Amount") {
      monthlyAmounts = newExpenseIsRecurring
        ? Array(12).fill(newExpenseAmount)
        : [newExpenseAmount, ...Array(11).fill(0)]
    } else if (newExpenseFormula === "Income %" && incomeData) {
      monthlyAmounts = incomeData.monthlyData.revenue.map(revenue =>
        (revenue * newExpenseFormulaPercentage) / 100
      )
    } else if (newExpenseFormula === "Expense %" && newExpenseFormulaExpenseId) {
      const referenceExpense = data.expenses.find(e => e.id === newExpenseFormulaExpenseId)
      if (referenceExpense) {
        monthlyAmounts = referenceExpense.monthlyAmount.map(amount =>
          (amount * newExpenseFormulaPercentage) / 100
        )
      } else {
        monthlyAmounts = Array(12).fill(0)
      }
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      name: newExpenseName,
      categories: selectedCategories.length > 0 ? selectedCategories : ["Non trié"],
      group: groupToUse,
      isRecurring: newExpenseIsRecurring,
      monthlyAmount: monthlyAmounts,
      formula: newExpenseFormula,
      ...(newExpenseFormula !== "Amount" && {
        formulaPercentage: newExpenseFormulaPercentage,
        ...(newExpenseFormula === "Expense %" && {
          formulaExpenseId: newExpenseFormulaExpenseId
        })
      })
    }

    // Mettre à jour les données
    onChange({
      ...data,
      expenses: [...data.expenses, newExpense],
    })

    // Reset form
    setNewExpenseName("")
    setNewExpenseAmount(0)
    setNewExpenseIsRecurring(true)
    setNewExpenseCategory("")
    setSelectedCategories([])
    setSelectedGroup("Non trié")
    setNewExpenseFormula("Amount")
    setNewExpenseFormulaPercentage(0)
    setNewExpenseFormulaExpenseId("")
    setDialogOpen(false)
  }

  const addCategory = () => {
    if (!newCategory || data.categories.includes(newCategory)) return

    onChange({
      ...data,
      categories: [...data.categories, newCategory],
    })

    setSelectedCategories(prev => [...prev, newCategory])
    setNewExpenseCategory(newCategory)
    setNewCategory("")
    setIsAddingCategory(false)
  }

  const addGroup = () => {
    if (!newGroup || data.groups.includes(newGroup)) return

    const updatedGroups = [...data.groups, newGroup]

    onChange({
      ...data,
      groups: updatedGroups,
    })

    setSelectedGroup(newGroup)
    setNewGroup("")
    setIsAddingGroup(false)
  }

  const addCategoryToExpense = (expenseId: string, category: string) => {
    const updatedExpenses = data.expenses.map((expense) => {
      if (expense.id === expenseId) {
        return {
          ...expense,
          categories: [...expense.categories, category],
        }
      }
      return expense
    })

    onChange({
      ...data,
      expenses: updatedExpenses,
    })
  }

  const removeCategoryFromExpense = (expenseId: string, categoryToRemove: string) => {
    const updatedExpenses = data.expenses.map((expense) => {
      if (expense.id === expenseId) {
        return {
          ...expense,
          categories: expense.categories.filter((category) => category !== categoryToRemove),
        }
      }
      return expense
    })

    onChange({
      ...data,
      expenses: updatedExpenses,
    })
  }

  const updateExpenseGroup = (expenseId: string, group: string) => {
    const updatedExpenses = data.expenses.map((expense) => {
      if (expense.id === expenseId) {
        return {
          ...expense,
          group,
        }
      }
      return expense
    })

    onChange({
      ...data,
      expenses: updatedExpenses,
    })
  }

  const handleDeleteClick = (expenseId: string) => {
    setExpenseToDelete(expenseId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (expenseToDelete) {
      onChange({
        ...data,
        expenses: data.expenses.filter((expense) => expense.id !== expenseToDelete),
      })
      setDeleteDialogOpen(false)
      setExpenseToDelete(null)
    }
  }

  const updateExpenseAmount = (expenseId: string, month: number, amount: number) => {
    const updatedExpenses = data.expenses.map((expense) => {
      if (expense.id === expenseId) {
        const newAmounts = [...expense.monthlyAmount]
        newAmounts[month] = amount

        // If it's a recurring expense, update all months with the same value
        if (expense.isRecurring && month === 0) {
          for (let i = 0; i < 12; i++) {
            newAmounts[i] = amount
          }
        }

        return { ...expense, monthlyAmount: newAmounts }
      }
      return expense
    })

    onChange({
      ...data,
      expenses: updatedExpenses,
    })
  }

  const toggleExpenseRecurring = (expenseId: string, isRecurring: boolean) => {
    const updatedExpenses = data.expenses.map((exp) => {
      if (exp.id === expenseId) {
        let monthlyAmount = [...exp.monthlyAmount]
        if (exp.isRecurring && !isRecurring) {
          // Keep the current values when switching from recurring to non-recurring
        } else if (!exp.isRecurring && isRecurring) {
          // If changing from non-recurring to recurring, set all months to the first month value
          monthlyAmount = Array(12).fill(monthlyAmount[0])
        }
        return {
          ...exp,
          isRecurring,
          monthlyAmount,
        }
      }
      return exp
    })

    onChange({
      ...data,
      expenses: updatedExpenses,
    })
  }

  const calculateMonthlyTotal = (month: number) => {
    return data.expenses.reduce((total, expense) => {
      return total + (expense.monthlyAmount[month] || 0)
    }, 0)
  }

  const calculateTotal = () => {
    return data.expenses.reduce((total, expense) => {
      return total + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0)
    }, 0)
  }

  const handleFilterChange = (category: string) => {
    setFilteredCategories(prev =>
      prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category]
    )
  }

  const handleSelectAll = () => {
    if (filteredCategories.length === data.categories.length) {
      setFilteredCategories([])
    } else {
      setFilteredCategories(data.categories)
    }
  }

  const filteredExpenses = filteredCategories.length
    ? data.expenses.filter(expense => expense.categories.some(category => filteredCategories.includes(category)))
    : data.expenses

  const calculateFilteredTotal = () => {
    return filteredExpenses.reduce((total, expense) => {
      return total + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0)
    }, 0)
  }

  const calculateMonthlyFilteredTotal = (month: number) => {
    return filteredExpenses.reduce((total, expense) => {
      return total + (expense.monthlyAmount[month] || 0)
    }, 0)
  }

  const years = Array.from({ length: 16 }, (_, i) => 2020 + i)

  const openEditDialog = (expense: Expense) => {
    setExpenseToEdit(expense)
    setEditExpenseName(expense.name)
    setEditExpenseGroup(expense.group)
    setEditExpenseFormula(expense.formula || "Amount")
    setEditExpenseFormulaPercentage(expense.formulaPercentage || 0)
    setEditExpenseFormulaExpenseId(expense.formulaExpenseId || "")
    setEditExpenseAmount(expense.monthlyAmount[0] || 0)
    setEditDialogOpen(true)
  }

  const saveEdit = () => {
    if (!expenseToEdit) return

    // Calculer les montants mensuels en fonction de la formule
    let monthlyAmounts: number[] = []
    if (editExpenseFormula === "Amount") {
      monthlyAmounts = expenseToEdit.isRecurring
        ? Array(12).fill(editExpenseAmount)
        : [editExpenseAmount, ...Array(11).fill(0)]
    } else if (editExpenseFormula === "Income %" && incomeData) {
      monthlyAmounts = incomeData.monthlyData.revenue.map(revenue =>
        (revenue * editExpenseFormulaPercentage) / 100
      )
    } else if (editExpenseFormula === "Expense %" && editExpenseFormulaExpenseId) {
      const referenceExpense = data.expenses.find(e => e.id === editExpenseFormulaExpenseId)
      if (referenceExpense) {
        monthlyAmounts = referenceExpense.monthlyAmount.map(amount =>
          (amount * editExpenseFormulaPercentage) / 100
        )
      } else {
        monthlyAmounts = expenseToEdit.monthlyAmount
      }
    }

    const updatedExpenses = data.expenses.map((expense) => {
      if (expense.id === expenseToEdit.id) {
        return {
          ...expense,
          name: editExpenseName,
          group: editExpenseGroup,
          monthlyAmount: monthlyAmounts,
          formula: editExpenseFormula,
          ...(editExpenseFormula !== "Amount" && {
            formulaPercentage: editExpenseFormulaPercentage,
            ...(editExpenseFormula === "Expense %" && {
              formulaExpenseId: editExpenseFormulaExpenseId
            })
          })
        }
      }
      return expense
    })

    onChange({
      ...data,
      expenses: updatedExpenses,
    })

    setEditDialogOpen(false)
    setExpenseToEdit(null)
  }

  const addGroupInEdit = () => {
    if (!editNewGroup || data.groups.includes(editNewGroup)) return

    onChange({
      ...data,
      groups: [...data.groups, editNewGroup],
    })

    setEditExpenseGroup(editNewGroup)
    setEditNewGroup("")
    setIsEditingGroup(false)
  }

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

  const calculateGroupTotal = (group: string, expenses: Expense[], month?: number) => {
    if (month !== undefined) {
      return expenses.reduce((total, expense) => total + (expense.monthlyAmount[month] || 0), 0)
    }
    return expenses.reduce((total, expense) => total + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0), 0)
  }

  const calculateGroupYearlyTotal = (group: string, year: number, expenses: Expense[]) => {
    return yearlyData?.[year]?.expenseData.expenses
      .filter(expense => expenses.some(e => e.id === expense.id))
      .reduce((sum, expense) => sum + expense.monthlyAmount.reduce((monthSum, amount) => monthSum + amount, 0), 0) || 0
  }

  const renderGroupRow = (group: string, expenses: Expense[]) => {
    const isExpanded = expandedGroups.has(group)
    const groupTotal = calculateGroupTotal(group, expenses)
    const yearlyTotal = years.reduce((sum, year) => sum + calculateGroupYearlyTotal(group, year, expenses), 0)

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
        {!isGlobalView && <TableCell />}
        {viewMode === "month" ? (
          months.map((_, index) => (
            <TableCell key={index} className="font-bold">
              {isExpanded ? "" : calculateGroupTotal(group, expenses, index).toLocaleString("fr-FR")}
            </TableCell>
          ))
        ) : (
          years.map((year) => (
            <TableCell key={year} className="font-bold">
              {isExpanded ? "" : calculateGroupYearlyTotal(group, year, expenses).toLocaleString("fr-FR")}
            </TableCell>
          ))
        )}
        <TableCell className="font-bold">
          {isExpanded ? "" : (viewMode === "month" ? groupTotal : yearlyTotal).toLocaleString("fr-FR")}
        </TableCell>
        <TableCell />
      </TableRow>
    )
  }

  const renderGroupSubtotalRow = (group: string, expenses: Expense[]) => {
    const groupTotal = calculateGroupTotal(group, expenses)
    const yearlyTotal = years.reduce((sum, year) => sum + calculateGroupYearlyTotal(group, year, expenses), 0)

    return (
      <TableRow key={`subtotal-${group}`} className="bg-muted/30">
        <TableCell colSpan={1} className="font-bold">
          Sous-total {group}
        </TableCell>
        <TableCell />
        {!isGlobalView && <TableCell />}
        {viewMode === "month" ? (
          months.map((_, index) => (
            <TableCell key={index} className="font-bold">
              {calculateGroupTotal(group, expenses, index).toLocaleString("fr-FR")}
            </TableCell>
          ))
        ) : (
          years.map((year) => (
            <TableCell key={year} className="font-bold">
              {calculateGroupYearlyTotal(group, year, expenses).toLocaleString("fr-FR")}
            </TableCell>
          ))
        )}
        <TableCell className="font-bold">
          {(viewMode === "month" ? groupTotal : yearlyTotal).toLocaleString("fr-FR")}
        </TableCell>
        <TableCell />
      </TableRow>
    )
  }

  // Grouper les dépenses par groupe
  const groupedExpenses = React.useMemo(() => {
    const groups = filteredExpenses.reduce((acc, expense) => {
      if (!acc[expense.group]) {
        acc[expense.group] = []
      }
      acc[expense.group].push(expense)
      return acc
    }, {} as Record<string, Expense[]>)

    // Trier les groupes selon l'ordre défini dans data.groups
    return (data.groups || ["Non trié"]).map(group => ({
      group,
      expenses: groups[group] || []
    }))
  }, [filteredExpenses, data.groups])

  const handleDuplicateClick = (expense: Expense) => {
    setExpenseToDuplicate(expense)
    setSourceYear(2025) // Année par défaut
    setTargetYear(2025) // Année par défaut
    setDuplicateDialogOpen(true)
  }

  const confirmDuplicate = () => {
    if (!expenseToDuplicate || !onExpenseDuplicate) return

    onExpenseDuplicate(expenseToDuplicate, sourceYear, targetYear)
    setDuplicateDialogOpen(false)
    setExpenseToDuplicate(null)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expenses</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant={filteredCategories.length ? "default" : "outline"} onClick={() => setFilterDialogOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          {isReadOnly ? (
            <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">Global view (read-only)</div>
          ) : (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="expense-name"
                      value={newExpenseName}
                      onChange={(e) => setNewExpenseName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-group" className="text-right">
                      Group
                    </Label>
                    {isAddingGroup ? (
                      <div className="col-span-3 flex gap-2">
                        <Input
                          id="new-group"
                          value={newGroup}
                          onChange={(e) => setNewGroup(e.target.value)}
                          className="flex-1"
                          placeholder="New group name"
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
                    <Label htmlFor="expense-category" className="text-right">
                      Categories
                    </Label>
                    {isAddingCategory ? (
                      <div className="col-span-3 flex gap-2">
                        <Input
                          id="new-category"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="flex-1"
                          placeholder="New category name"
                        />
                        <Button size="sm" onClick={addCategory}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsAddingCategory(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="col-span-3 flex gap-2">
                        <Select
                          value={newExpenseCategory}
                          onValueChange={(value) => {
                            if (typeof value === "string") {
                              setNewExpenseCategory(value)
                              setSelectedCategories(prev =>
                                prev.includes(value)
                                  ? prev.filter(cat => cat !== value)
                                  : [...prev, value]
                              )
                            }
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select categories" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.categories.map((category) => (
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
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="expense-formula" className="text-right">
                      Formula
                    </Label>
                    <div className="col-span-3 space-y-4">
                      <Select
                        value={newExpenseFormula}
                        onValueChange={(value: "Amount" | "Income %" | "Expense %") => setNewExpenseFormula(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Amount">Amount</SelectItem>
                          <SelectItem value="Income %">Income %</SelectItem>
                          <SelectItem value="Expense %">Expense %</SelectItem>
                        </SelectContent>
                      </Select>
                      {newExpenseFormula !== "Amount" && (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={newExpenseFormulaPercentage || ""}
                            onChange={(e) => setNewExpenseFormulaPercentage(Number(e.target.value))}
                            placeholder="Percentage"
                            className="flex-1"
                          />
                          {newExpenseFormula === "Expense %" && (
                            <Select
                              value={newExpenseFormulaExpenseId}
                              onValueChange={setNewExpenseFormulaExpenseId}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select expense" />
                              </SelectTrigger>
                              <SelectContent>
                                {data.expenses.map((expense) => (
                                  <SelectItem key={expense.id} value={expense.id}>
                                    {expense.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {newExpenseFormula === "Amount" && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="expense-amount" className="text-right">
                        Amount (€)
                      </Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        value={newExpenseAmount || ""}
                        onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                        className="col-span-3"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Recurring</Label>
                    <div className="flex items-center space-x-2 col-span-3">
                      <Checkbox
                        id="expense-recurring"
                        checked={newExpenseIsRecurring}
                        onCheckedChange={(checked) => setNewExpenseIsRecurring(checked === true)}
                      />
                      <Label htmlFor="expense-recurring">Apply to all months</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addExpense}>Add Expense</Button>
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
                <TableHead className="w-[200px]">Expense</TableHead>
                <TableHead className="w-[150px]">Categories</TableHead>
                {!isGlobalView && <TableHead className="w-[80px]">Recurring</TableHead>}
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
                {!isReadOnly && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedExpenses.map(({ group, expenses }) => (
                <React.Fragment key={group}>
                  {renderGroupRow(group, expenses)}
                  {expandedGroups.has(group) && (
                    <>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {expense.categories.map((category) => (
                                <Badge key={category} variant="outline" className="group relative">
                                  {category}
                                  {!isReadOnly && (
                                    <button
                                      onClick={() => removeCategoryFromExpense(expense.id, category)}
                                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </Badge>
                              ))}
                              {!isReadOnly && (
                                <Select
                                  value={newExpenseCategory}
                                  onValueChange={(value) => {
                                    if (typeof value === "string") {
                                      setNewExpenseCategory(value)
                                      addCategoryToExpense(expense.id, value)
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-6 p-0">
                                    <Plus className="h-3 w-3" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {data.categories
                                      .filter((category) => !expense.categories.includes(category))
                                      .map((category) => (
                                        <SelectItem key={category} value={category}>
                                          {category}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                          {!isGlobalView && (
                            <TableCell>
                              <Checkbox
                                checked={expense.isRecurring}
                                onCheckedChange={(checked) => toggleExpenseRecurring(expense.id, checked as boolean)}
                                disabled={isReadOnly}
                              />
                            </TableCell>
                          )}
                          {viewMode === "month" ? (
                            months.map((_, index) => (
                              <TableCell key={index} className="min-w-[120px]">
                                {isReadOnly ? (
                                  <div className="px-2 py-1 rounded-md bg-muted/50">
                                    {expense.monthlyAmount[index]?.toLocaleString("fr-FR") || 0}
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    value={expense.monthlyAmount[index] || ""}
                                    onChange={(e) => updateExpenseAmount(expense.id, index, Number(e.target.value))}
                                    className="w-full h-8"
                                  />
                                )}
                              </TableCell>
                            ))
                          ) : (
                            years.map((year) => (
                              <TableCell key={year} className="min-w-[120px]">
                                <div className="px-2 py-1 rounded-md bg-muted/50">
                                  {yearlyData?.[year]?.expenseData.expenses.find(e => e.id === expense.id)?.monthlyAmount.reduce((sum, amount) => sum + amount, 0)?.toLocaleString("fr-FR") || 0}
                                </div>
                              </TableCell>
                            ))
                          )}
                          <TableCell className="font-bold">
                            {viewMode === "month" ? (
                              expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0).toLocaleString("fr-FR")
                            ) : (
                              years.reduce((sum, year) => sum + (yearlyData?.[year]?.expenseData.expenses.find(e => e.id === expense.id)?.monthlyAmount.reduce((sum, amount) => sum + amount, 0) || 0), 0).toLocaleString("fr-FR")
                            )}
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
                                  <DropdownMenuItem onClick={() => openEditDialog(expense)}>
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicateClick(expense)}>
                                    Dupliquer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteClick(expense.id)} className="text-destructive">
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {renderGroupSubtotalRow(group, expenses)}
                    </>
                  )}
                </React.Fragment>
              ))}
              {filteredCategories.length > 0 && (
                <TableRow>
                  <TableCell className="font-bold">
                    Sous-total (Filtré)
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  {!isGlobalView && <TableCell />}
                  {viewMode === "month" ? (
                    months.map((_, index) => (
                      <TableCell key={index} className="min-w-[120px] font-bold">
                        {calculateMonthlyFilteredTotal(index).toLocaleString("fr-FR")}
                      </TableCell>
                    ))
                  ) : (
                    years.map((year) => (
                      <TableCell key={year} className="min-w-[120px] font-bold">
                        {yearlyData?.[year]?.expenseData.expenses
                          .filter(expense => filteredExpenses.some(fe => fe.id === expense.id))
                          .reduce((sum, expense) => sum + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0), 0)
                          .toLocaleString("fr-FR") || 0}
                      </TableCell>
                    ))
                  )}
                  <TableCell className="font-bold">
                    {viewMode === "month" ? (
                      calculateFilteredTotal().toLocaleString("fr-FR")
                    ) : (
                      years.reduce((sum, year) => sum + (yearlyData?.[year]?.expenseData.expenses
                        .filter(expense => filteredExpenses.some(fe => fe.id === expense.id))
                        .reduce((expSum, expense) => expSum + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0), 0) || 0), 0)
                        .toLocaleString("fr-FR")
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
              <TableRow>
                <TableCell className="font-bold" colSpan={!isGlobalView ? 3 : 2}>
                  Total
                </TableCell>
                {viewMode === "month" ? (
                  months.map((_, index) => (
                    <TableCell key={index} className="min-w-[120px] font-bold">
                      {calculateMonthlyTotal(index).toLocaleString("fr-FR")}
                    </TableCell>
                  ))
                ) : (
                  years.map((year) => (
                    <TableCell key={year} className="min-w-[120px] font-bold">
                      {yearlyData?.[year]?.expenseData.expenses.reduce((sum, expense) => sum + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0), 0).toLocaleString("fr-FR") || 0}
                    </TableCell>
                  ))
                )}
                <TableCell className="font-bold">
                  {viewMode === "month" ? (
                    calculateTotal().toLocaleString("fr-FR")
                  ) : (
                    years.reduce((sum, year) => sum + (yearlyData?.[year]?.expenseData.expenses.reduce((expSum, expense) => expSum + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0), 0) || 0), 0).toLocaleString("fr-FR")
                  )}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter by category</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={filteredCategories.length === data.categories.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all">All</Label>
            </div>
            {data.categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`filter-${category}`}
                  checked={filteredCategories.includes(category)}
                  onCheckedChange={() => handleFilterChange(category)}
                />
                <Label htmlFor={`filter-${category}`}>{category}</Label>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this expense?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la dépense</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-name" className="text-right">
                Nom
              </Label>
              <Input
                id="edit-expense-name"
                value={editExpenseName}
                onChange={(e) => setEditExpenseName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expense-group" className="text-right">
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
                    value={editExpenseGroup}
                    onValueChange={setEditExpenseGroup}
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
              <Label htmlFor="edit-expense-formula" className="text-right">
                Formule
              </Label>
              <div className="col-span-3 space-y-4">
                <Select
                  value={editExpenseFormula}
                  onValueChange={(value: "Amount" | "Income %" | "Expense %") => setEditExpenseFormula(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amount">Montant</SelectItem>
                    <SelectItem value="Income %">% du CA</SelectItem>
                    <SelectItem value="Expense %">% d'une dépense</SelectItem>
                  </SelectContent>
                </Select>
                {editExpenseFormula === "Amount" && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editExpenseAmount || ""}
                      onChange={(e) => setEditExpenseAmount(Number(e.target.value))}
                      placeholder="Montant"
                      className="flex-1"
                    />
                  </div>
                )}
                {editExpenseFormula !== "Amount" && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editExpenseFormulaPercentage || ""}
                      onChange={(e) => setEditExpenseFormulaPercentage(Number(e.target.value))}
                      placeholder="Pourcentage"
                      className="flex-1"
                    />
                    {editExpenseFormula === "Expense %" && (
                      <Select
                        value={editExpenseFormulaExpenseId}
                        onValueChange={setEditExpenseFormulaExpenseId}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner une dépense" />
                        </SelectTrigger>
                        <SelectContent>
                          {data.expenses
                            .filter(expense => expense.id !== expenseToEdit?.id)
                            .map((expense) => (
                              <SelectItem key={expense.id} value={expense.id}>
                                {expense.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
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
            <DialogTitle>Dupliquer la dépense</DialogTitle>
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

