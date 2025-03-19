"use client"

import * as React from "react"
import { Edit2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ExpenseData } from "./expense-table"

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export interface IncomeData {
  etpRate: number
  monthlyData: {
    etpCount: number[]
    revenue: number[]
  }
}

type EntityType = "École" | "Groupe" | "ESN"

interface IncomeTableProps {
  data: IncomeData
  onChange: (data: IncomeData) => void
  isReadOnly?: boolean
  entityType?: EntityType
  viewMode?: "month" | "year"
  yearlyData?: Record<number, { incomeData: IncomeData; expenseData: ExpenseData }> | null
}

export function IncomeTable({ data, onChange, isReadOnly = false, entityType = "Groupe", viewMode = "month", yearlyData = null }: IncomeTableProps) {
  const [isEditingRate, setIsEditingRate] = React.useState(false)
  const [etpRate, setEtpRate] = React.useState(data.etpRate)

  const getEntityLabel = () => {
    switch (entityType) {
      case "École":
        return "Étudiant"
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Income</CardTitle>
        {isReadOnly && (
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">Global view (read-only)</div>
        )}
      </CardHeader>
      <CardContent>
        {viewMode !== "year" && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="font-medium">CA per {getEntityLabel()}:</div>
            {isEditingRate && !isReadOnly ? (
              <>
                <Input
                  type="number"
                  value={etpRate}
                  onChange={(e) => handleEtpRateChange(e.target.value)}
                  className="w-32"
                />
                <Button size="sm" variant="outline" onClick={saveEtpRate}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <div className="font-bold">{etpRate.toLocaleString("fr-FR")} €</div>
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingRate(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        )}

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
              {viewMode === "month" ? (
                <>
                  {isReadOnly ? (
                    <>
                      <TableRow>
                        <TableCell className="font-medium">ETP Count</TableCell>
                        {months.map((_, index) => (
                          <TableCell key={index} className="min-w-[120px]">
                            <div className="px-2 py-1 rounded-md bg-muted/50">
                              {entityType !== "École" ? data.monthlyData.etpCount[index]?.toFixed(1) || "0.0" : "0.0"}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="font-bold">{entityType !== "École" ? avgEtp.toFixed(1) : "0.0"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Student Count</TableCell>
                        {months.map((_, index) => (
                          <TableCell key={index} className="min-w-[120px]">
                            <div className="px-2 py-1 rounded-md bg-muted/50">
                              {entityType === "École" ? data.monthlyData.etpCount[index]?.toFixed(1) || "0.0" : "0.0"}
                            </div>
                          </TableCell>
                        ))}
                        <TableCell className="font-bold">{entityType === "École" ? avgEtp.toFixed(1) : "0.0"}</TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell className="font-medium">{getEntityLabel()} Count</TableCell>
                      {months.map((_, index) => (
                        <TableCell key={index} className="min-w-[120px]">
                          <Input
                            type="number"
                            value={data.monthlyData.etpCount[index] || ""}
                            onChange={(e) => handleEtpCountChange(index, e.target.value)}
                            className="w-full h-8"
                            step="0.1"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="font-bold">{avgEtp.toFixed(1)}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className="font-medium">Revenue (€)</TableCell>
                    {months.map((_, index) => (
                      <TableCell key={index} className="min-w-[120px]">
                        <div className="px-2 py-1 rounded-md bg-muted/50">
                          {data.monthlyData.revenue[index]?.toLocaleString("fr-FR") || 0}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="font-bold">{totalRevenue.toLocaleString("fr-FR")}</TableCell>
                  </TableRow>
                </>
              ) : (
                <>
                  <TableRow>
                    <TableCell className="font-medium">{getEntityLabel()} Count</TableCell>
                    {years.map((year) => (
                      <TableCell key={year} className="min-w-[120px]">
                        <div className="px-2 py-1 rounded-md bg-muted/50">
                          {yearlyData?.[year]?.incomeData.monthlyData.etpCount[0]?.toFixed(1) || "0.0"}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="font-bold">
                      {years.reduce((sum, year) => sum + (yearlyData?.[year]?.incomeData.monthlyData.etpCount[0] || 0), 0).toFixed(1)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Revenue (€)</TableCell>
                    {years.map((year) => (
                      <TableCell key={year} className="min-w-[120px]">
                        <div className="px-2 py-1 rounded-md bg-muted/50">
                          {yearlyData?.[year]?.incomeData.monthlyData.revenue.reduce((sum, rev) => sum + rev, 0)?.toLocaleString("fr-FR") || 0}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="font-bold">
                      {years.reduce((sum, year) => sum + (yearlyData?.[year]?.incomeData.monthlyData.revenue.reduce((sum, rev) => sum + rev, 0) || 0), 0).toLocaleString("fr-FR")}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

