"use client"

import { useState, useEffect } from "react"
import { BarChart, LineChart } from "recharts"
import { Bar, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import Link from "next/link"
import { Calendar, CalendarDays } from "lucide-react"

import { EntitySelector, type Entity } from "@/components/entity-selector"
import { ScenarioSelector, type Scenario } from "@/components/scenario-selector"
import { YearSelector } from "@/components/year-selector"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { db, type DbData } from "@/lib/db"
import { Income, IncomeData } from "@/components/income-table"
import { ExpenseData } from "@/components/expense-table"
import { ScenarioData } from "@/lib/db"

interface YearData {
  year: number
  revenue: number
  margin: number
  marginPercentage: number
  etp: number
  students: number
  [key: string]: number
}

interface MonthlyData {
  month: string
  revenue: number
  margin: number
  etp: number
  students: number
  [key: string]: number | string
}

interface YearlyData {
  incomeData: IncomeData
  expenseData: ExpenseData
}

interface EntityData {
  years: Record<string, YearlyData>
}

interface LocalScenarioData {
  entities: Entity[]
  entityData: Record<string, EntityData>
}

export default function DashboardPage() {
  const [selectedEntity, setSelectedEntity] = useState<Entity>({ value: "global", label: "Global (Groupe CLAD)" })
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [currentScenario, setCurrentScenario] = useState<Scenario>({ id: "default", name: "Prévisionnel classique" })
  const [scenarioData, setScenarioData] = useState<Record<string, LocalScenarioData>>({})
  const [dbData, setDbData] = useState<DbData | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [viewMode, setViewMode] = useState<"month" | "year">("month")

  useEffect(() => {
    const loadData = async () => {
      const data = await db.getData()
      setDbData(data)
      setScenarios(data.scenarios)
      setCurrentScenario(data.scenarios[0])
      setScenarioData(data.scenarioData)
    }
    loadData()
  }, [])

  const handleEntityChange = (entity: Entity) => {
    setSelectedEntity(entity)
  }

  const handleScenarioChange = (scenario: Scenario) => {
    setCurrentScenario(scenario)
  }

  const handleScenarioAdd = (name: string) => {
    const newScenario: Scenario = { id: `scenario-${Date.now()}`, name }
    setScenarios([...scenarios, newScenario])
    setCurrentScenario(newScenario)
  }

  const handleScenarioEdit = (id: string, name: string) => {
    setScenarios(scenarios.map(scenario =>
      scenario.id === id ? { ...scenario, name } : scenario
    ))
  }

  const handleScenarioDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce scénario ?")) {
      setScenarios(scenarios.filter(scenario => scenario.id !== id))
      if (currentScenario?.id === id) {
        setCurrentScenario(scenarios[0])
      }
    }
  }

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
  }

  const handleYearDuplicate = (sourceYear: number, targetYear: number) => {
    if (!currentScenario) return

    const updatedScenarioData = { ...scenarioData }
    const currentScenarioData = updatedScenarioData[currentScenario.id]

    Object.keys(currentScenarioData.entityData).forEach((entityKey) => {
      const entityData = currentScenarioData.entityData[entityKey]
      const sourceYearData = entityData.years[sourceYear.toString()]

      if (sourceYearData) {
        const targetYearData = {
          incomeData: {
            etpRate: sourceYearData.incomeData.etpRate,
            monthlyData: {
              etpCount: [...sourceYearData.incomeData.monthlyData.etpCount],
              revenue: [...sourceYearData.incomeData.monthlyData.revenue],
            },
          },
          expenseData: {
            expenses: sourceYearData.expenseData.expenses.map(expense => ({
              ...expense,
              monthlyAmount: [...expense.monthlyAmount],
            })),
            categories: [...sourceYearData.expenseData.categories],
            groups: [...sourceYearData.expenseData.groups],
          },
        }

        entityData.years[targetYear.toString()] = targetYearData
      }
    })

    setScenarioData(updatedScenarioData)
  }

  const formatEuro = (value: number) => `${value.toLocaleString('fr-FR')} €`
  const formatPercentage = (value: number) => `${value}%`

  // Normaliser les clés des entités pour correspondre aux clés utilisées dans les graphiques
  const normalizeEntityKey = (key: string) => {
    const keyMap: Record<string, string> = {
      "global": "global",
      "groupe-clad": "global",
      "programisto": "programisto",
      "la-horde": "laHorde",
      "ecole-de-turing": "ecoleDeTuring",
      "genly": "genly",
      "vortex": "vortex"
    }
    return keyMap[key] || key
  }

  // Calculer les données pour les graphiques
  const getChartData = () => {
    if (!currentScenario || !scenarioData[currentScenario.id]) return []

    const years = Array.from({ length: 16 }, (_, i) => 2020 + i)
    const entityData = scenarioData[currentScenario.id].entityData
    const expensesByGroup: Record<string, number> = {}

    return years.map(year => {
      const data: YearData = {
        year,
        revenue: 0,
        margin: 0,
        marginPercentage: 0,
        etp: 0,
        students: 0
      }

      if (selectedEntity.value === "global") {
        // Pour l'entité globale, on somme les revenus et effectifs de toutes les entités
        Object.entries(entityData).forEach(([entityKey, entity]) => {
          if (entity.years[year.toString()]) {
            const yearData = entity.years[year.toString()]
            const revenue = yearData.incomeData.monthlyData.revenue.reduce((sum: number, rev: number) => sum + rev, 0)
            const customIncomes = yearData.incomeData.incomes?.reduce((sum: number, income: Income) => {
              if (income.formula === "Per ETP") {
                return sum + income.monthlyAmount.reduce((monthSum: number, amount: number) =>
                  monthSum + ((amount || 0) * (income.etpRate || 0)), 0)
              }
              return sum + income.monthlyAmount.reduce((monthSum: number, amount: number) => monthSum + (amount || 0), 0)
            }, 0) || 0

            // Calculer les dépenses par groupe
            yearData.expenseData.expenses.forEach(expense => {
              const group = expense.group || "Non trié"
              const expenseTotal = expense.monthlyAmount.reduce((a: number, b: number) => a + b, 0)
              expensesByGroup[group] = (expensesByGroup[group] || 0) + expenseTotal
              data.margin -= expenseTotal
            })

            // Prendre la valeur maximale des effectifs sur l'année
            const maxEtpCount = Math.max(...yearData.incomeData.monthlyData.etpCount)

            // Ajouter aux totaux selon le type d'entité
            const entityType = scenarioData[currentScenario.id].entities.find(e => e.value === entityKey)?.type
            if (entityType === "École") {
              data.students = maxEtpCount
            } else if (entityType === "ESN" || entityType === "Groupe") {
              data.etp = maxEtpCount
            }

            data.revenue += revenue + customIncomes
          }
        })
      } else {
        // Pour une entité spécifique
        const entity = entityData[selectedEntity.value]
        if (entity?.years[year.toString()]) {
          const yearData = entity.years[year.toString()]
          const revenue = yearData.incomeData.monthlyData.revenue.reduce((sum: number, rev: number) => sum + rev, 0)
          const customIncomes = yearData.incomeData.incomes?.reduce((sum: number, income: Income) => {
            if (income.formula === "Per ETP") {
              return sum + income.monthlyAmount.reduce((monthSum: number, amount: number) =>
                monthSum + ((amount || 0) * (income.etpRate || 0)), 0)
            }
            return sum + income.monthlyAmount.reduce((monthSum: number, amount: number) => monthSum + (amount || 0), 0)
          }, 0) || 0

          // Calculer les dépenses par groupe
          yearData.expenseData.expenses.forEach(expense => {
            const group = expense.group || "Non trié"
            const expenseTotal = expense.monthlyAmount.reduce((a: number, b: number) => a + b, 0)
            expensesByGroup[group] = (expensesByGroup[group] || 0) + expenseTotal
            data.margin -= expenseTotal
          })

          // Prendre la valeur maximale des effectifs sur l'année
          const maxEtpCount = Math.max(...yearData.incomeData.monthlyData.etpCount)

          // Ajouter aux totaux selon le type d'entité
          const entityType = scenarioData[currentScenario.id].entities.find(e => e.value === selectedEntity.value)?.type
          if (entityType === "École") {
            data.students = maxEtpCount
          } else if (entityType === "ESN" || entityType === "Groupe") {
            data.etp = maxEtpCount
          }

          data.revenue += revenue + customIncomes
        }
      }

      data.margin = data.revenue + data.margin
      data.marginPercentage = data.revenue > 0 ? (data.margin / data.revenue) * 100 : 0

      // Ajouter les dépenses par groupe
      Object.entries(expensesByGroup).forEach(([group, amount]) => {
        data[`expenses_${group.replace(/\s+/g, '_')}`] = amount
      })

      return data
    })
  }

  // Calculer les données mensuelles pour le graphique mensuel
  const getMonthlyData = () => {
    if (!currentScenario || !scenarioData[currentScenario.id]) return []

    const entityData = scenarioData[currentScenario.id].entityData
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return months.map((month, index) => {
      const data: MonthlyData = {
        month,
        revenue: 0,
        margin: 0,
        etp: 0,
        students: 0
      }
      const expensesByGroup: Record<string, number> = {}

      if (selectedEntity.value === "global") {
        // Pour l'entité globale, on somme les revenus et effectifs de toutes les entités
        Object.entries(entityData).forEach(([entityKey, entity]) => {
          if (entity.years[selectedYear.toString()]) {
            const yearData = entity.years[selectedYear.toString()]
            const revenue = yearData.incomeData.monthlyData.revenue[index] || 0
            const customIncomes = yearData.incomeData.incomes?.reduce((sum: number, income: Income) => {
              if (income.formula === "Per ETP") {
                return sum + ((income.monthlyAmount[index] || 0) * (income.etpRate || 0))
              }
              return sum + (income.monthlyAmount[index] || 0)
            }, 0) || 0

            // Calculer les dépenses par groupe
            yearData.expenseData.expenses.forEach(expense => {
              const group = expense.group || "Non trié"
              const expenseAmount = expense.monthlyAmount[index] || 0
              expensesByGroup[group] = (expensesByGroup[group] || 0) + expenseAmount
              data.margin -= expenseAmount
            })

            // Ajouter les effectifs selon le type d'entité
            const etpCount = yearData.incomeData.monthlyData.etpCount[index] || 0
            const entityType = scenarioData[currentScenario.id].entities.find(e => e.value === entityKey)?.type
            if (entityType === "École") {
              data.students += etpCount
            } else if (entityType === "ESN" || entityType === "Groupe") {
              data.etp += etpCount
            }

            data.revenue += revenue + customIncomes
          }
        })
      } else {
        // Pour une entité spécifique
        const entity = entityData[selectedEntity.value]
        if (entity?.years[selectedYear.toString()]) {
          const yearData = entity.years[selectedYear.toString()]
          const revenue = yearData.incomeData.monthlyData.revenue[index] || 0
          const customIncomes = yearData.incomeData.incomes?.reduce((sum: number, income: Income) => {
            if (income.formula === "Per ETP") {
              return sum + ((income.monthlyAmount[index] || 0) * (income.etpRate || 0))
            }
            return sum + (income.monthlyAmount[index] || 0)
          }, 0) || 0

          // Calculer les dépenses par groupe
          yearData.expenseData.expenses.forEach(expense => {
            const group = expense.group || "Non trié"
            const expenseAmount = expense.monthlyAmount[index] || 0
            expensesByGroup[group] = (expensesByGroup[group] || 0) + expenseAmount
            data.margin -= expenseAmount
          })

          // Ajouter les effectifs selon le type d'entité
          const etpCount = yearData.incomeData.monthlyData.etpCount[index] || 0
          const entityType = scenarioData[currentScenario.id].entities.find(e => e.value === selectedEntity.value)?.type
          if (entityType === "École") {
            data.students = etpCount
          } else if (entityType === "ESN" || entityType === "Groupe") {
            data.etp = etpCount
          }

          data.revenue += revenue + customIncomes
        }
      }

      data.margin = data.revenue + data.margin

      // Ajouter les dépenses par groupe
      Object.entries(expensesByGroup).forEach(([group, amount]) => {
        data[`expenses_${group.replace(/\s+/g, '_')}`] = amount as number
      })

      return data
    })
  }

  const chartData = getChartData()
  const monthlyData = getMonthlyData()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/" className="text-xl font-bold hover:underline">
            Financial Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <ScenarioSelector
              scenarios={scenarios}
              currentScenario={currentScenario}
              onScenarioChange={handleScenarioChange}
              onScenarioAdd={handleScenarioAdd}
              onScenarioEdit={handleScenarioEdit}
              onScenarioDelete={handleScenarioDelete}
            />
            <EntitySelector
              entities={currentScenario ? scenarioData[currentScenario.id]?.entities || [] : []}
              selectedEntity={selectedEntity}
              onEntityChange={handleEntityChange}
            />
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{selectedEntity.label} - Financial Overview</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Per Month
              </Button>
              <Button
                variant={viewMode === "year" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("year")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Per Year
              </Button>
            </div>
            <YearSelector
              onYearChange={handleYearChange}
              onYearDuplicate={handleYearDuplicate}
              disabled={viewMode === "year"}
              showDuplicateButton={false}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Évolution du CA vs Marge</CardTitle>
              <CardDescription>Évolution du CA de {selectedEntity.label}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ChartContainer
                config={{
                  revenue: {
                    label: "",
                    color: "hsl(var(--chart-1))"
                  },
                  margin: {
                    label: "Marge : ",
                    color: "hsl(var(--chart-2))"
                  }
                }}
              >
                <LineChart data={viewMode === "month" ? monthlyData : chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={viewMode === "month" ? "month" : "year"} />
                  <YAxis tickFormatter={formatEuro} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value, name, item) => {
                    if (name === "margin") {
                      const revenue = Number(item.payload.revenue)
                      const marginPercentage = revenue > 0 ? ((Number(value) / revenue) * 100).toFixed(1) : "0"
                      return `Marge : ${formatEuro(Number(value))} (${marginPercentage}%)`
                    }
                    return 'Chiffre d\'affaires : ' + formatEuro(Number(value))
                  }} />} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" />
                  <Line type="monotone" dataKey="margin" stroke="var(--color-margin)" />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Évolution des effectifs</CardTitle>
              <CardDescription>
                {selectedEntity.value === "global"
                  ? "Évolution des ETP et étudiants"
                  : `Évolution des ${selectedEntity.type === "École" ? "étudiants" : "ETP"}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ChartContainer
                config={{
                  etp: {
                    label: "ETP : ",
                    color: "hsl(var(--chart-3))"
                  },
                  students: {
                    label: "Étudiants : ",
                    color: "hsl(var(--chart-4))"
                  }
                }}
              >
                <LineChart data={viewMode === "month" ? monthlyData : chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={viewMode === "month" ? "month" : "year"} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {(selectedEntity.value === "global" || selectedEntity.type === "ESN" || selectedEntity.type === "Groupe") && (
                    <Line type="monotone" dataKey="etp" stroke="var(--color-etp)" />
                  )}
                  {(selectedEntity.value === "global" || selectedEntity.type === "École") && (
                    <Line type="monotone" dataKey="students" stroke="var(--color-students)" />
                  )}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Évolution des dépenses</CardTitle>
              <CardDescription>Répartition des dépenses de {selectedEntity.label}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ChartContainer
                config={Object.fromEntries(
                  Array.from(new Set((viewMode === "month" ? monthlyData : chartData).flatMap(d =>
                    Object.keys(d).filter(k => k.startsWith('expenses_'))
                  ))).map((key, index) => [
                    key,
                    {
                      label: key.replace('expenses_', '').replace(/_/g, ' ') + ' : ',
                      color: `hsl(${index * 60}, 70%, 50%)`
                    }
                  ])
                )}
              >
                <BarChart data={viewMode === "month" ? monthlyData : chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={viewMode === "month" ? "month" : "year"} />
                  <YAxis tickFormatter={formatEuro} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(value, name, item) => {
                    const totalExpenses = Object.entries(item.payload)
                      .filter(([key]) => key.startsWith('expenses_'))
                      .reduce((sum, [_, amount]) => sum + Number(amount), 0)
                    const percentage = totalExpenses > 0 ? ((Number(value) / totalExpenses) * 100).toFixed(1) : "0"
                    return `${formatEuro(Number(value))} (${percentage}%)`
                  }} />} />
                  <Legend />
                  {Array.from(new Set((viewMode === "month" ? monthlyData : chartData).flatMap(d =>
                    Object.keys(d).filter(k => k.startsWith('expenses_'))
                  ))).map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      name={key.replace('expenses_', '').replace(/_/g, ' ')}
                      stackId="expenses"
                      fill={`hsl(${index * 60}, 70%, 50%)`}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

