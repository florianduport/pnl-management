"use client"

import * as React from "react"
import { Plus, Save, Trash, X, Filter } from "lucide-react"

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

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export interface Expense {
  id: string
  name: string
  categories: string[]
  isRecurring: boolean
  monthlyAmount: number[]
}

export interface ExpenseData {
  expenses: Expense[]
  categories: string[]
}

interface ExpenseTableProps {
  data: ExpenseData
  onChange: (data: ExpenseData) => void
  isReadOnly?: boolean
  isGlobalView?: boolean
  viewMode?: "month" | "year"
  yearlyData?: Record<number, { incomeData: IncomeData; expenseData: ExpenseData }> | null
}

export function ExpenseTable({ data, onChange, isReadOnly = false, isGlobalView = false, viewMode = "month", yearlyData = null }: ExpenseTableProps) {
  const [newExpenseName, setNewExpenseName] = React.useState("")
  const [newExpenseCategory, setNewExpenseCategory] = React.useState<string>("")
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [newExpenseAmount, setNewExpenseAmount] = React.useState(0)
  const [newExpenseIsRecurring, setNewExpenseIsRecurring] = React.useState(true)
  const [isAddingCategory, setIsAddingCategory] = React.useState(false)
  const [newCategory, setNewCategory] = React.useState("")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedExpenseId, setSelectedExpenseId] = React.useState<string | null>(null)
  const [isEditingCategories, setIsEditingCategories] = React.useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = React.useState(false)
  const [filteredCategories, setFilteredCategories] = React.useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [expenseToDelete, setExpenseToDelete] = React.useState<string | null>(null)

  const addExpense = () => {
    if (!newExpenseName) return

    const newExpense: Expense = {
      id: Date.now().toString(),
      name: newExpenseName,
      categories: selectedCategories,
      isRecurring: newExpenseIsRecurring,
      monthlyAmount: newExpenseIsRecurring ? Array(12).fill(newExpenseAmount) : Array(12).fill(0),
    }

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

  const removeExpense = (id: string) => {
    setExpenseToDelete(id)
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

  const years = [2025, 2026, 2027, 2028, 2029, 2030]

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
              {filteredExpenses.map((expense) => (
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
                      <Button variant="ghost" size="sm" onClick={() => removeExpense(expense.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredCategories.length > 0 && (
                <TableRow>
                  <TableCell className="font-bold">
                    Sous-total (Filtré)
                  </TableCell>
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
                <TableCell className="font-bold">
                  Total
                </TableCell>
                <TableCell />
                {!isGlobalView && <TableCell />}
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
    </Card>
  )
}

