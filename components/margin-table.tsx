"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { IncomeData } from "./income-table"
import type { ExpenseData } from "./expense-table"

interface MarginTableProps {
  incomeData: IncomeData
  expenseData: ExpenseData
  viewMode?: "month" | "year"
  yearlyData?: Record<number, { incomeData: IncomeData; expenseData: ExpenseData }> | null
}

export function MarginTable({ incomeData, expenseData, viewMode = "month", yearlyData = null }: MarginTableProps) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const years = Array.from({ length: 16 }, (_, i) => 2020 + i)

  const calculateMonthlyMargin = (month: number) => {
    const revenue = incomeData.monthlyData.revenue[month] || 0
    const expenses = expenseData.expenses.reduce((total, expense) => {
      return total + (expense.monthlyAmount[month] || 0)
    }, 0)

    return revenue - expenses
  }

  const calculateMonthlyMarginPercentage = (month: number) => {
    const revenue = incomeData.monthlyData.revenue[month] || 0
    const margin = calculateMonthlyMargin(month)

    if (revenue === 0) return 0
    return (margin / revenue) * 100
  }

  const calculateYearlyMargin = (year: number) => {
    const revenue = yearlyData?.[year]?.incomeData.monthlyData.revenue.reduce((sum, rev) => sum + rev, 0) || 0
    const expenses = yearlyData?.[year]?.expenseData.expenses.reduce((total, expense) => {
      return total + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0)
    }, 0) || 0

    return revenue - expenses
  }

  const calculateYearlyMarginPercentage = (year: number) => {
    const revenue = yearlyData?.[year]?.incomeData.monthlyData.revenue.reduce((sum, rev) => sum + rev, 0) || 0
    const margin = calculateYearlyMargin(year)

    if (revenue === 0) return 0
    return (margin / revenue) * 100
  }

  const calculateTotalRevenue = () => {
    if (viewMode === "month") {
      return incomeData.monthlyData.revenue.reduce((sum, rev) => sum + rev, 0)
    } else {
      return years.reduce((sum, year) => sum + (yearlyData?.[year]?.incomeData.monthlyData.revenue.reduce((sum, rev) => sum + rev, 0) || 0), 0)
    }
  }

  const calculateTotalExpenses = () => {
    if (viewMode === "month") {
      return expenseData.expenses.reduce((total, expense) => {
        return total + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0)
      }, 0)
    } else {
      return years.reduce((sum, year) => sum + (yearlyData?.[year]?.expenseData.expenses.reduce((expSum, expense) => expSum + expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0), 0) || 0), 0)
    }
  }

  const calculateTotalMargin = () => {
    return calculateTotalRevenue() - calculateTotalExpenses()
  }

  const calculateTotalMarginPercentage = () => {
    const revenue = calculateTotalRevenue()
    const margin = calculateTotalMargin()

    if (revenue === 0) return 0
    return (margin / revenue) * 100
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Margin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Metric</TableHead>
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
              <TableRow>
                <TableCell className="font-medium">Margin (€)</TableCell>
                {viewMode === "month" ? (
                  months.map((_, index) => (
                    <TableCell
                      key={index}
                      className={`min-w-[120px] ${calculateMonthlyMargin(index) < 0 ? "text-destructive font-medium" : ""}`}
                    >
                      {calculateMonthlyMargin(index).toLocaleString("fr-FR")}
                    </TableCell>
                  ))
                ) : (
                  years.map((year) => (
                    <TableCell
                      key={year}
                      className={`min-w-[120px] ${calculateYearlyMargin(year) < 0 ? "text-destructive font-medium" : ""}`}
                    >
                      {calculateYearlyMargin(year).toLocaleString("fr-FR")}
                    </TableCell>
                  ))
                )}
                <TableCell className={calculateTotalMargin() < 0 ? "text-destructive font-bold" : "font-bold"}>
                  {calculateTotalMargin().toLocaleString("fr-FR")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Margin (%)</TableCell>
                {viewMode === "month" ? (
                  months.map((_, index) => (
                    <TableCell
                      key={index}
                      className={`min-w-[120px] ${calculateMonthlyMarginPercentage(index) < 0 ? "text-destructive font-medium" : ""}`}
                    >
                      {calculateMonthlyMarginPercentage(index).toFixed(1)}%
                    </TableCell>
                  ))
                ) : (
                  years.map((year) => (
                    <TableCell
                      key={year}
                      className={`min-w-[120px] ${calculateYearlyMarginPercentage(year) < 0 ? "text-destructive font-medium" : ""}`}
                    >
                      {calculateYearlyMarginPercentage(year).toFixed(1)}%
                    </TableCell>
                  ))
                )}
                <TableCell
                  className={calculateTotalMarginPercentage() < 0 ? "text-destructive font-bold" : "font-bold"}
                >
                  {calculateTotalMarginPercentage().toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
