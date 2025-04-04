import { Entity } from "@/components/entity-selector"
import { Scenario } from "@/components/scenario-selector"
import { IncomeData } from "@/components/income-table"
import { ExpenseData } from "@/components/expense-table"

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

// Define the database structure
interface DbData {
    scenarios: Scenario[]
    scenarioData: Record<string, ScenarioData>
}

// Default entities for new scenarios
const defaultEntities: Entity[] = [
    { value: "global", label: "Global" },
    { value: "groupe-clad", label: "Groupe CLAD", type: "Groupe" },
]

// Default empty data for new entities
const getDefaultEntityData = () => ({
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
                expenses: [],
                categories: ["HR", "Facilities", "Marketing", "IT", "Operations", "Education", "R&D"],
                groups: ["Non trié"],
            },
        },
    },
})

// Initialize with a default scenario
const defaultScenarios: Scenario[] = [{ id: "default", name: "Prévisionnel classique" }]

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
                                etpCount: [8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11],
                                revenue: [96000, 96000, 96000, 108000, 108000, 108000, 120000, 120000, 120000, 132000, 132000, 132000],
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
                    "2026": {
                        incomeData: {
                            etpRate: 12000,
                            monthlyData: {
                                etpCount: [11, 11, 11, 12, 12, 12, 13, 13, 13, 14, 14, 14],
                                revenue: [132000, 132000, 132000, 144000, 144000, 144000, 156000, 156000, 156000, 168000, 168000, 168000],
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
                                etpCount: [5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8],
                                revenue: [45000, 45000, 45000, 54000, 54000, 54000, 63000, 63000, 63000, 72000, 72000, 72000],
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
                                etpCount: [4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7],
                                revenue: [32000, 32000, 32000, 40000, 40000, 40000, 48000, 48000, 48000, 56000, 56000, 56000],
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
                                etpCount: [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5],
                                revenue: [20000, 20000, 20000, 30000, 30000, 30000, 40000, 40000, 40000, 50000, 50000, 50000],
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
                                etpCount: [2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5],
                                revenue: [22000, 22000, 22000, 33000, 33000, 33000, 44000, 44000, 44000, 55000, 55000, 55000],
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

function transformEtpToIncomes(incomeData: { etpRate: number; monthlyData: { etpCount: number[]; revenue: number[] } }, entityId: string) {
    const hasNonZeroValues = incomeData.monthlyData.etpCount.some(value => value !== 0);

    if (!hasNonZeroValues) {
        return null;
    }

    return {
        id: `etp-revenue-${entityId}`,
        name: "Revenu ETP",
        categories: ["HR"],
        group: "Non trié",
        isRecurring: true,
        monthlyAmount: [...incomeData.monthlyData.etpCount],
        formula: "Per ETP" as const,
        etpRate: incomeData.etpRate
    };
}

class Database {
    private static instance: Database
    private initialized: boolean = false
    private data: DbData | null = null

    private constructor() { }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database()
        }
        return Database.instance
    }

    private transformData(data: DbData): DbData {
        const transformedData = { ...data }

        // Parcourir tous les scénarios
        Object.entries(transformedData.scenarioData).forEach(([scenarioId, scenario]) => {
            // Parcourir toutes les entités
            Object.entries(scenario.entityData).forEach(([entityId, entity]) => {
                // Parcourir toutes les années
                Object.values(entity.years).forEach(yearData => {
                    // Vérifier si la transformation a déjà été faite
                    if (yearData.incomeData.incomes?.some(income => income.id === `etp-revenue-${entityId}`)) {
                        return;
                    }

                    // Transformer les données ETP en incomes
                    const etpIncome = transformEtpToIncomes(yearData.incomeData, entityId)
                    if (etpIncome) {
                        // Initialiser le tableau incomes s'il n'existe pas
                        if (!yearData.incomeData.incomes) {
                            yearData.incomeData.incomes = []
                        }
                        // Ajouter l'income ETP
                        yearData.incomeData.incomes.push(etpIncome)

                        // Mettre à zéro les données ETP après la transformation
                        yearData.incomeData.monthlyData.etpCount = Array(12).fill(0)
                        yearData.incomeData.monthlyData.revenue = Array(12).fill(0)
                    }
                })
            })
        })

        return transformedData
    }

    public async initialize() {
        if (!this.initialized) {
            try {
                const response = await fetch("/api/db")
                if (!response.ok) {
                    throw new Error("Failed to fetch data")
                }
                const data = await response.json()
                this.data = this.transformData(data)
                this.initialized = true
            } catch (error) {
                console.error("Error initializing database:", error)
                // En cas d'erreur, utiliser les données initiales
                this.data = {
                    scenarios: defaultScenarios,
                    scenarioData: this.transformData({
                        scenarios: defaultScenarios,
                        scenarioData: initialScenarioData
                    }).scenarioData
                }
                this.initialized = true
            }
        }
    }

    public async getData(): Promise<DbData> {
        await this.initialize()
        return this.data!
    }

    public async saveData(data: DbData) {
        this.data = data
        try {
            await fetch("/api/db", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })
        } catch (error) {
            console.error("Erreur lors de la sauvegarde des données:", error)
        }
    }
}

export const db = Database.getInstance()
export type { DbData, ScenarioData }
export { defaultEntities, getDefaultEntityData } 