"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Save, Calendar, CalendarDays, MoreVertical, Download, Upload, History } from "lucide-react"

import { EntitySelector, type Entity } from "@/components/entity-selector"
import { YearSelector } from "@/components/year-selector"
import { IncomeTable, type IncomeData } from "@/components/income-table"
import { ExpenseTable, type ExpenseData, type Expense } from "@/components/expense-table"
import { MarginTable } from "@/components/margin-table"
import { ScenarioSelector, type Scenario } from "@/components/scenario-selector"
import { Button } from "@/components/ui/button"
import { db, type DbData } from "@/lib/db"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VersionsDialog } from "@/components/versions-dialog"

// Define the structure for scenario data
interface ScenarioData {
  entities: Entity[]
  entityData: Record<
    string,
    {
      years: Record<
        string,
        {
          incomeData: IncomeData
          expenseData: ExpenseData
        }
      >
    }
  >
}

// Default empty data for new entities
const getDefaultEntityData = (year: number) => ({
  years: {
    [year.toString()]: {
      incomeData: {
        etpRate: 10000,
        monthlyData: {
          etpCount: Array(12).fill(0),
          revenue: Array(12).fill(0),
        },
      },
      expenseData: {
        expenses: [],
        categories: ["HR", "Facilities", "Marketing", "IT", "Operations", "Education", "R&D"],
        groups: ["Non trié"],
      },
    },
  },
})

// Initialize with a default scenario
const defaultScenarios: Scenario[] = [{ id: "default", name: "Prévisionnel classique" }]

// Default entities for new scenarios
const defaultEntities: Entity[] = [
  { value: "global", label: "Global" },
  { value: "groupe-clad", label: "Groupe CLAD", type: "Groupe" },
]

// Initial data for the default scenario
const initialScenarioData: Record<string, ScenarioData> = {
  default: {
    entities: [
      { value: "global", label: "Global" },
      { value: "groupe-clad", label: "Groupe CLAD", type: "Groupe" },
      { value: "programisto", label: "Programisto", type: "ESN" },
      { value: "la-horde", label: "La Horde", type: "ESN" },
      { value: "ecole-de-turing", label: "École de Turing", type: "École" },
      { value: "genly", label: "Genly", type: "ESN" },
      { value: "vortex", label: "Vortex", type: "ESN" },
    ],
    entityData: {
      programisto: {
        years: {
          "2025": {
            incomeData: {
              etpRate: 12000,
              monthlyData: {
                etpCount: [5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8],
                revenue: [60000, 60000, 60000, 72000, 72000, 72000, 84000, 84000, 84000, 96000, 96000, 96000],
              },
            },
            expenseData: {
              expenses: [
                {
                  id: "p1",
                  name: "Developer Salaries",
                  categories: ["HR"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(40000),
                },
                {
                  id: "p2",
                  name: "Office Rent",
                  categories: ["Facilities"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(6000),
                },
              ],
              categories: ["HR", "Facilities", "Marketing"],
              groups: ["Non trié"],
            },
          },
        },
      },
      "la-horde": {
        years: {
          "2025": {
            incomeData: {
              etpRate: 9000,
              monthlyData: {
                etpCount: [3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5],
                revenue: [27000, 27000, 27000, 36000, 36000, 36000, 36000, 45000, 45000, 45000, 45000, 45000],
              },
            },
            expenseData: {
              expenses: [
                {
                  id: "lh1",
                  name: "Staff Salaries",
                  categories: ["HR"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(20000),
                },
                {
                  id: "lh2",
                  name: "Equipment",
                  categories: ["IT"],
                  group: "Non trié",
                  isRecurring: false,
                  monthlyAmount: [5000, 0, 0, 5000, 0, 0, 5000, 0, 0, 5000, 0, 0],
                },
              ],
              categories: ["HR", "IT", "Operations"],
              groups: ["Non trié"],
            },
          },
        },
      },
      "ecole-de-turing": {
        years: {
          "2025": {
            incomeData: {
              etpRate: 8000,
              monthlyData: {
                etpCount: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4],
                revenue: [16000, 16000, 16000, 16000, 24000, 24000, 24000, 24000, 32000, 32000, 32000, 32000],
              },
            },
            expenseData: {
              expenses: [
                {
                  id: "edt1",
                  name: "Teacher Salaries",
                  categories: ["HR"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(15000),
                },
                {
                  id: "edt2",
                  name: "Learning Materials",
                  categories: ["Education"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(3000),
                },
              ],
              categories: ["HR", "Education", "Marketing"],
              groups: ["Non trié"],
            },
          },
        },
      },
      genly: {
        years: {
          "2025": {
            incomeData: {
              etpRate: 10000,
              monthlyData: {
                etpCount: [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2],
                revenue: [10000, 10000, 10000, 10000, 10000, 20000, 20000, 20000, 20000, 20000, 20000, 20000],
              },
            },
            expenseData: {
              expenses: [
                {
                  id: "g1",
                  name: "Staff Salaries",
                  categories: ["HR"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(8000),
                },
                {
                  id: "g2",
                  name: "Marketing",
                  categories: ["Marketing"],
                  group: "Non trié",
                  isRecurring: false,
                  monthlyAmount: [2000, 2000, 0, 0, 2000, 2000, 0, 0, 2000, 2000, 0, 0],
                },
              ],
              categories: ["HR", "Marketing"],
              groups: ["Non trié"],
            },
          },
        },
      },
      vortex: {
        years: {
          "2025": {
            incomeData: {
              etpRate: 11000,
              monthlyData: {
                etpCount: [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
                revenue: [11000, 11000, 11000, 11000, 11000, 11000, 22000, 22000, 22000, 22000, 22000, 22000],
              },
            },
            expenseData: {
              expenses: [
                {
                  id: "v1",
                  name: "Staff Salaries",
                  categories: ["HR"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(7000),
                },
                {
                  id: "v2",
                  name: "Research",
                  categories: ["R&D"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(3000),
                },
              ],
              categories: ["HR", "R&D"],
              groups: ["Non trié"],
            },
          },
        },
      },
      "groupe-clad": {
        years: {
          "2025": {
            incomeData: {
              etpRate: 10000,
              monthlyData: {
                etpCount: Array(12).fill(0),
                revenue: Array(12).fill(0),
              },
            },
            expenseData: {
              expenses: [
                {
                  id: "gc1",
                  name: "Management Salaries",
                  categories: ["HR"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(25000),
                },
                {
                  id: "gc2",
                  name: "Group Office",
                  categories: ["Facilities"],
                  group: "Non trié",
                  isRecurring: true,
                  monthlyAmount: Array(12).fill(8000),
                },
              ],
              categories: ["HR", "Facilities", "Marketing", "Operations"],
              groups: ["Non trié"],
            },
          },
        },
      },
    },
  },
}

export default function PnLPage() {
  // State for scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null)
  const [scenarioData, setScenarioData] = useState<Record<string, ScenarioData>>({})
  const [selectedYear, setSelectedYear] = useState<number>(2025)
  const [viewMode, setViewMode] = useState<"month" | "year">("month")

  // State for current entity and data
  const [selectedEntity, setSelectedEntity] = useState<Entity>({ value: "global", label: "Global" })
  const [incomeData, setIncomeData] = useState<IncomeData>({
    etpRate: 0,
    monthlyData: {
      etpCount: Array(12).fill(0),
      revenue: Array(12).fill(0),
    },
  })
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    expenses: [],
    categories: [],
    groups: ["Non trié"]
  })
  const [isGlobalView, setIsGlobalView] = useState<boolean>(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

  // Refs
  const isCalculatingGlobal = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculate global data for the current scenario and year
  const calculateGlobalData = useCallback(() => {
    if (isCalculatingGlobal.current || !currentScenario || !scenarioData[currentScenario.id]) {
      return { incomeData, expenseData }
    }

    isCalculatingGlobal.current = true

    try {
      const currentScenarioEntities = scenarioData[currentScenario.id].entities
      const currentEntityData = scenarioData[currentScenario.id].entityData

      // Get all entity values except "global"
      const subEntities = currentScenarioEntities
        .filter((entity) => entity.value !== "global")
        .map((entity) => entity.value)

      // Initialize global income data
      const globalIncomeData: IncomeData = {
        etpRate: 0,
        monthlyData: {
          etpCount: Array(12).fill(0),
          revenue: Array(12).fill(0),
        },
      }

      // Initialize global expense data with all categories from sub-entities
      const allCategories = new Set<string>()
      const globalExpenses: Expense[] = []

      // Sum up all data from sub-entities
      let totalEtpCount = 0
      let totalEtpValue = 0

      subEntities.forEach((entityKey) => {
        // Si les données n'existent pas, initialiser avec les données par défaut
        if (!currentEntityData[entityKey]?.years?.[selectedYear]) {
          if (!currentEntityData[entityKey]) {
            currentEntityData[entityKey] = getDefaultEntityData(selectedYear);
          } else if (!currentEntityData[entityKey].years) {
            currentEntityData[entityKey].years = getDefaultEntityData(selectedYear).years;
          } else {
            currentEntityData[entityKey].years[selectedYear] = {
              incomeData: {
                etpRate: 10000,
                monthlyData: {
                  etpCount: Array(12).fill(0),
                  revenue: Array(12).fill(0),
                },
              },
              expenseData: {
                expenses: [],
                categories: ["HR", "Facilities", "Marketing", "IT", "Operations", "Education", "R&D"],
                groups: ["Non trié"],
              },
            };
          }
        }

        const entity = currentEntityData[entityKey].years[selectedYear];

        // Sum up ETP counts and revenue
        for (let i = 0; i < 12; i++) {
          globalIncomeData.monthlyData.etpCount[i] += entity.incomeData.monthlyData.etpCount[i]
          globalIncomeData.monthlyData.revenue[i] += entity.incomeData.monthlyData.revenue[i]
        }

        // Calculate weighted average for ETP rate
        const entityTotalEtp = entity.incomeData.monthlyData.etpCount.reduce((sum, count) => sum + count, 0)
        totalEtpCount += entityTotalEtp
        totalEtpValue += entityTotalEtp * entity.incomeData.etpRate

        // Collect all categories
        entity.expenseData.categories.forEach((category) => allCategories.add(category))

        // Add all expenses with entity name prefix
        entity.expenseData.expenses.forEach((expense) => {
          globalExpenses.push({
            ...expense,
            id: `${entityKey}-${expense.id}`,
            name: `[${entityKey}] ${expense.name}`,
          })
        })
      })

      // Calculate weighted average ETP rate
      globalIncomeData.etpRate = totalEtpCount > 0 ? Math.round(totalEtpValue / totalEtpCount) : 0

      // Create global expense data
      const globalExpenseData: ExpenseData = {
        expenses: globalExpenses,
        categories: Array.from(allCategories),
        groups: ["Non trié"],
      }

      return {
        incomeData: globalIncomeData,
        expenseData: globalExpenseData,
      }
    } finally {
      isCalculatingGlobal.current = false
    }
  }, [currentScenario, scenarioData, incomeData, expenseData, selectedYear])

  // Calculate yearly data for the current scenario
  const calculateYearlyData = useCallback(() => {
    if (!currentScenario || !scenarioData[currentScenario.id]) return null

    const years = [2025, 2026, 2027, 2028, 2029, 2030]
    const yearlyData: Record<number, { incomeData: IncomeData; expenseData: ExpenseData }> = {}

    years.forEach(year => {
      const yearStr = year.toString()
      const entityData = scenarioData[currentScenario.id].entityData[selectedEntity.value]?.years[yearStr]

      if (entityData) {
        yearlyData[year] = {
          incomeData: {
            etpRate: entityData.incomeData.etpRate,
            monthlyData: {
              etpCount: Array(12).fill(entityData.incomeData.monthlyData.etpCount.reduce((sum, count) => sum + count, 0) / 12),
              revenue: Array(12).fill(entityData.incomeData.monthlyData.revenue.reduce((sum, rev) => sum + rev, 0) / 12),
            },
          },
          expenseData: {
            expenses: entityData.expenseData.expenses.map(expense => ({
              ...expense,
              monthlyAmount: Array(12).fill(expense.monthlyAmount.reduce((sum, amount) => sum + amount, 0) / 12),
            })),
            categories: entityData.expenseData.categories,
            groups: entityData.expenseData.groups,
          },
        }
      }
    })

    return yearlyData
  }, [currentScenario, scenarioData, selectedEntity])

  // Effects
  useEffect(() => {
    const loadData = async () => {
      const data = await db.getData()
      setScenarios(data.scenarios)
      setScenarioData(data.scenarioData)
      setCurrentScenario(data.scenarios[0])

      // Set initial entity and data
      const globalEntity = data.scenarioData[data.scenarios[0].id].entities.find((e) => e.value === "global") || {
        value: "global",
        label: "Global",
      }
      setSelectedEntity(globalEntity)
      setIsGlobalView(true)
    }
    loadData()
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter la page ?"
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (isGlobalView && !isCalculatingGlobal.current) {
      const globalData = calculateGlobalData()
      if (
        JSON.stringify(globalData.incomeData) !== JSON.stringify(incomeData) ||
        JSON.stringify(globalData.expenseData) !== JSON.stringify(expenseData)
      ) {
        setIncomeData(globalData.incomeData)
        setExpenseData(globalData.expenseData)
      }
    }
  }, [isGlobalView, calculateGlobalData, scenarioData])

  // Save data to database
  const handleSave = async () => {
    if (!currentScenario) return
    await db.saveData({
      scenarios,
      scenarioData,
    })
    setHasUnsavedChanges(false)
  }

  // Vérification de sécurité pour s'assurer que les données du scénario existent
  if (!currentScenario || !scenarioData[currentScenario.id]) {
    // Si on n'a pas de scénario, on réinitialise avec les données par défaut
    setScenarios(defaultScenarios)
    setScenarioData(initialScenarioData)
    setCurrentScenario(defaultScenarios[0])
    setSelectedEntity({ value: "global", label: "Global" })
    setIsGlobalView(true)
    const globalData = calculateGlobalData()
    setIncomeData(globalData.incomeData)
    setExpenseData(globalData.expenseData)
    return null
  }

  // Handle entity change
  const handleEntityChange = (entity: Entity, year?: number) => {
    if (!currentScenario) return

    const isGlobal = entity.value === "global"
    const selectedYearToUse = year || selectedYear

    setSelectedEntity(entity)
    setIsGlobalView(isGlobal)

    if (isGlobal) {
      const globalData = calculateGlobalData()
      setIncomeData(globalData.incomeData)
      setExpenseData(globalData.expenseData)
    } else {
      // Get entity data from current scenario and year
      const entityData = scenarioData[currentScenario.id].entityData[entity.value]?.years[selectedYearToUse]
      if (entityData) {
        setIncomeData(entityData.incomeData)
        setExpenseData(entityData.expenseData)
      }
    }
  }

  // Handle income data change
  const handleIncomeDataChange = (data: IncomeData) => {
    if (isGlobalView || !currentScenario) return // Don't update if in global view

    setIncomeData(data)
    setHasUnsavedChanges(true)

    // Update entity data in current scenario and year
    const updatedScenarioData = { ...scenarioData }
    if (!updatedScenarioData[currentScenario.id].entityData[selectedEntity.value].years[selectedYear]) {
      updatedScenarioData[currentScenario.id].entityData[selectedEntity.value].years[selectedYear] = {
        incomeData: data,
        expenseData: expenseData,
      }
    } else {
      updatedScenarioData[currentScenario.id].entityData[selectedEntity.value].years[selectedYear].incomeData = data
    }
    setScenarioData(updatedScenarioData)
  }

  // Handle expense data change
  const handleExpenseDataChange = (data: ExpenseData) => {
    if (isGlobalView || !currentScenario) return // Don't update if in global view

    setExpenseData(data)
    setHasUnsavedChanges(true)

    // Update entity data in current scenario and year
    const updatedScenarioData = { ...scenarioData }
    if (!updatedScenarioData[currentScenario.id].entityData[selectedEntity.value].years[selectedYear]) {
      updatedScenarioData[currentScenario.id].entityData[selectedEntity.value].years[selectedYear] = {
        incomeData: incomeData,
        expenseData: data,
      }
    } else {
      updatedScenarioData[currentScenario.id].entityData[selectedEntity.value].years[selectedYear].expenseData = data
    }
    setScenarioData(updatedScenarioData)
  }

  // Handle year change
  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    handleEntityChange(selectedEntity, year)
  }

  // Handle scenario change
  const handleScenarioChange = (scenario: Scenario) => {
    setCurrentScenario(scenario)

    // Reset to global view when changing scenarios
    const globalEntity = scenarioData[scenario.id].entities.find((e) => e.value === "global") || {
      value: "global",
      label: "Global",
    }
    setSelectedEntity(globalEntity)
    setIsGlobalView(true)

    // Calculate global data for the selected scenario and year
    const globalData = calculateGlobalData()
    setIncomeData(globalData.incomeData)
    setExpenseData(globalData.expenseData)
  }

  // Handle adding a new scenario
  const handleAddScenario = (name: string) => {
    setHasUnsavedChanges(true)

    const newScenarioId = `scenario-${Date.now()}`
    const newScenario: Scenario = { id: newScenarioId, name }

    // Add new scenario to scenarios list
    const updatedScenarios = [...scenarios, newScenario]
    setScenarios(updatedScenarios)

    // Create new scenario data with default entities
    const updatedScenarioData = { ...scenarioData }
    updatedScenarioData[newScenarioId] = {
      entities: [
        { value: "global", label: "Global" },
        { value: "groupe-clad", label: "Groupe CLAD", type: "Groupe" },
      ],
      entityData: {
        "groupe-clad": getDefaultEntityData(selectedYear),
      },
    }
    setScenarioData(updatedScenarioData)

    // Switch to the new scenario
    setCurrentScenario(newScenario)
    setSelectedEntity({ value: "global", label: "Global" })
    setIsGlobalView(true)

    // Set default data for the new scenario
    const defaultData = getDefaultEntityData(selectedYear).years[selectedYear.toString()]
    setIncomeData(defaultData.incomeData)
    setExpenseData(defaultData.expenseData)
  }

  // Handle adding a new entity
  const handleAddEntity = (entity: Entity) => {
    if (!currentScenario) return

    setHasUnsavedChanges(true)

    // Add entity to current scenario
    const updatedScenarioData = { ...scenarioData }
    updatedScenarioData[currentScenario.id].entities = [...updatedScenarioData[currentScenario.id].entities, entity]

    // Initialize entity data
    updatedScenarioData[currentScenario.id].entityData[entity.value] = getDefaultEntityData(selectedYear)

    setScenarioData(updatedScenarioData)

    // Switch to the new entity
    setSelectedEntity(entity)
    setIsGlobalView(false)
    const defaultData = getDefaultEntityData(selectedYear).years[selectedYear.toString()]
    setIncomeData(defaultData.incomeData)
    setExpenseData(defaultData.expenseData)
  }

  // Handle editing an entity
  const handleEditEntity = (oldValue: string, updatedEntity: Entity) => {
    if (!currentScenario) return

    setHasUnsavedChanges(true)

    const updatedScenarioData = { ...scenarioData }
    const currentScenarioEntities = updatedScenarioData[currentScenario.id].entities
    const entityIndex = currentScenarioEntities.findIndex((e) => e.value === oldValue)

    if (entityIndex !== -1) {
      // Update entity in entities array
      currentScenarioEntities[entityIndex] = updatedEntity

      // Update entity data with new key
      const entityData = updatedScenarioData[currentScenario.id].entityData
      entityData[updatedEntity.value] = entityData[oldValue]
      delete entityData[oldValue]

      // If this was the selected entity, update selection
      if (selectedEntity.value === oldValue) {
        setSelectedEntity(updatedEntity)
      }

      setScenarioData(updatedScenarioData)
    }
  }

  // Handle deleting an entity
  const handleDeleteEntity = (value: string) => {
    if (!currentScenario) return

    setHasUnsavedChanges(true)

    const updatedScenarioData = { ...scenarioData }
    const currentScenarioEntities = updatedScenarioData[currentScenario.id].entities

    // Remove entity from entities array
    updatedScenarioData[currentScenario.id].entities = currentScenarioEntities.filter(
      (entity) => entity.value !== value
    )

    // Remove entity data
    delete updatedScenarioData[currentScenario.id].entityData[value]

    // If this was the selected entity, switch to global view
    if (selectedEntity.value === value) {
      const globalEntity = { value: "global", label: "Global" }
      setSelectedEntity(globalEntity)
      setIsGlobalView(true)
      const globalData = calculateGlobalData()
      setIncomeData(globalData.incomeData)
      setExpenseData(globalData.expenseData)
    }

    setScenarioData(updatedScenarioData)
  }

  // Handle duplicating an entity
  const handleDuplicateEntity = (entity: Entity) => {
    if (!currentScenario) return

    setHasUnsavedChanges(true)

    // Create new entity with "Copie" prefix
    const newEntity: Entity = {
      value: `copie-${entity.value}`,
      label: `Copie ${entity.label}`,
      type: entity.type,
    }

    // Add entity to current scenario
    const updatedScenarioData = { ...scenarioData }
    updatedScenarioData[currentScenario.id].entities = [...updatedScenarioData[currentScenario.id].entities, newEntity]

    // Deep copy entity data
    const originalEntityData = updatedScenarioData[currentScenario.id].entityData[entity.value]
    updatedScenarioData[currentScenario.id].entityData[newEntity.value] = JSON.parse(JSON.stringify(originalEntityData))

    setScenarioData(updatedScenarioData)

    // Switch to the new entity
    setSelectedEntity(newEntity)
    setIsGlobalView(false)
    const entityData = updatedScenarioData[currentScenario.id].entityData[newEntity.value].years[selectedYear.toString()]
    setIncomeData(entityData.incomeData)
    setExpenseData(entityData.expenseData)
  }

  // Handle editing a scenario
  const handleEditScenario = (id: string, name: string) => {
    setHasUnsavedChanges(true)

    const updatedScenarios = scenarios.map((scenario) =>
      scenario.id === id ? { ...scenario, name } : scenario
    )
    setScenarios(updatedScenarios)

    // If this was the current scenario, update it
    if (currentScenario?.id === id) {
      setCurrentScenario({ ...currentScenario, name })
    }
  }

  // Handle deleting a scenario
  const handleDeleteScenario = (id: string) => {
    setHasUnsavedChanges(true)

    // Si c'est le dernier scénario, on réinitialise avec les données par défaut
    if (scenarios.length <= 1) {
      setScenarios(defaultScenarios)
      setScenarioData(initialScenarioData)
      setCurrentScenario(defaultScenarios[0])
      setSelectedEntity({ value: "global", label: "Global" })
      setIsGlobalView(true)
      const globalData = calculateGlobalData()
      setIncomeData(globalData.incomeData)
      setExpenseData(globalData.expenseData)
      return
    }

    const updatedScenarios = scenarios.filter((scenario) => scenario.id !== id)
    const updatedScenarioData = { ...scenarioData }
    delete updatedScenarioData[id]

    // Si on supprime le scénario actuel, on bascule vers le premier scénario disponible
    if (currentScenario?.id === id) {
      const newCurrentScenario = updatedScenarios[0]
      // Mise à jour des états dans le bon ordre
      setScenarios(updatedScenarios)
      setScenarioData(updatedScenarioData)
      setCurrentScenario(newCurrentScenario)
      setSelectedEntity({ value: "global", label: "Global" })
      setIsGlobalView(true)

      // Calculate global data for the new scenario
      const globalData = calculateGlobalData()
      setIncomeData(globalData.incomeData)
      setExpenseData(globalData.expenseData)
    } else {
      // Si on supprime un autre scénario, on met juste à jour les listes
      setScenarios(updatedScenarios)
      setScenarioData(updatedScenarioData)
    }
  }

  // Handle export data
  const handleExport = async () => {
    const data = await db.getData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "db.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle import data
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleImport appelé")
    const file = event.target.files?.[0]
    if (!file) {
      console.log("Aucun fichier sélectionné")
      return
    }

    console.log("Fichier sélectionné:", file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)

      console.log("Envoi de la requête à l'API...")
      const response = await fetch("/api/db/versions", {
        method: "POST",
        body: formData,
      })

      console.log("Réponse reçue:", response.status)

      if (!response.ok) {
        throw new Error("Erreur lors de l'import")
      }

      console.log("Import réussi, rechargement des données...")
      // Recharger les données
      const data = await db.getData()
      setScenarios(data.scenarios)
      setScenarioData(data.scenarioData)
      setCurrentScenario(data.scenarios[0])

      // Réinitialiser l'input file pour permettre de réimporter le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Erreur lors de l'import:", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-xl font-bold">PnL Management</h1>
          <div className="flex items-center gap-4">
            <ScenarioSelector
              scenarios={scenarios}
              currentScenario={currentScenario}
              onScenarioChange={handleScenarioChange}
              onScenarioAdd={handleAddScenario}
              onScenarioEdit={handleEditScenario}
              onScenarioDelete={handleDeleteScenario}
            />
            <EntitySelector
              entities={currentScenario ? scenarioData[currentScenario.id].entities : []}
              selectedEntity={selectedEntity}
              onEntityChange={handleEntityChange}
              onEntityAdd={handleAddEntity}
              onEntityEdit={handleEditEntity}
              onEntityDelete={handleDeleteEntity}
              onEntityDuplicate={handleDuplicateEntity}
            />
            <Button variant="outline" size="icon" onClick={handleSave} title="Sauvegarder">
              <Save className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" title="Plus d'options">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }}>
                  <Upload className="mr-2 h-4 w-4" />
                  Importer
                </DropdownMenuItem>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleImport}
                />
                <VersionsDialog />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {selectedEntity.label}
            {selectedEntity.type && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({selectedEntity.type})</span>
            )}
          </h2>
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
            <YearSelector onYearChange={handleYearChange} disabled={viewMode === "year"} />
          </div>
        </div>

        <div className="space-y-8">
          {viewMode === "month" ? (
            <>
              <IncomeTable data={incomeData} onChange={handleIncomeDataChange} isReadOnly={isGlobalView} entityType={selectedEntity.type} />
              <ExpenseTable
                data={expenseData}
                onChange={handleExpenseDataChange}
                isReadOnly={isGlobalView}
                isGlobalView={isGlobalView}
                incomeData={incomeData}
              />
              <MarginTable incomeData={incomeData} expenseData={expenseData} />
            </>
          ) : (
            <>
              <IncomeTable
                data={calculateYearlyData()?.[selectedYear]?.incomeData || incomeData}
                onChange={handleIncomeDataChange}
                isReadOnly={true}
                entityType={selectedEntity.type}
                viewMode="year"
                yearlyData={calculateYearlyData()}
              />
              <ExpenseTable
                data={calculateYearlyData()?.[selectedYear]?.expenseData || expenseData}
                onChange={handleExpenseDataChange}
                isReadOnly={true}
                isGlobalView={true}
                viewMode="year"
                yearlyData={calculateYearlyData()}
                incomeData={calculateYearlyData()?.[selectedYear]?.incomeData || incomeData}
              />
              <MarginTable
                incomeData={calculateYearlyData()?.[selectedYear]?.incomeData || incomeData}
                expenseData={calculateYearlyData()?.[selectedYear]?.expenseData || expenseData}
                viewMode="year"
                yearlyData={calculateYearlyData()}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

