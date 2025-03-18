"use client"

import { useState } from "react"
import { BarChart, LineChart } from "recharts"
import { Bar, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts"

import { EntitySelector, type Entity } from "@/components/entity-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Sample data for demonstration
const revenueData = [
  {
    year: "2020",
    global: 2400000,
    programisto: 1200000,
    laHorde: 800000,
    ecoleDeTuring: 200000,
    genly: 100000,
    vortex: 100000,
  },
  {
    year: "2021",
    global: 2800000,
    programisto: 1400000,
    laHorde: 900000,
    ecoleDeTuring: 300000,
    genly: 100000,
    vortex: 100000,
  },
  {
    year: "2022",
    global: 3200000,
    programisto: 1600000,
    laHorde: 1000000,
    ecoleDeTuring: 400000,
    genly: 100000,
    vortex: 100000,
  },
  {
    year: "2023",
    global: 3600000,
    programisto: 1800000,
    laHorde: 1100000,
    ecoleDeTuring: 500000,
    genly: 100000,
    vortex: 100000,
  },
  {
    year: "2024",
    global: 4000000,
    programisto: 2000000,
    laHorde: 1200000,
    ecoleDeTuring: 600000,
    genly: 100000,
    vortex: 100000,
  },
  {
    year: "2025",
    global: 4400000,
    programisto: 2200000,
    laHorde: 1300000,
    ecoleDeTuring: 700000,
    genly: 100000,
    vortex: 100000,
  },
]

const marginData = [
  {
    year: "2020",
    global: 480000,
    programisto: 240000,
    laHorde: 160000,
    ecoleDeTuring: 40000,
    genly: 20000,
    vortex: 20000,
  },
  {
    year: "2021",
    global: 560000,
    programisto: 280000,
    laHorde: 180000,
    ecoleDeTuring: 60000,
    genly: 20000,
    vortex: 20000,
  },
  {
    year: "2022",
    global: 640000,
    programisto: 320000,
    laHorde: 200000,
    ecoleDeTuring: 80000,
    genly: 20000,
    vortex: 20000,
  },
  {
    year: "2023",
    global: 720000,
    programisto: 360000,
    laHorde: 220000,
    ecoleDeTuring: 100000,
    genly: 20000,
    vortex: 20000,
  },
  {
    year: "2024",
    global: 800000,
    programisto: 400000,
    laHorde: 240000,
    ecoleDeTuring: 120000,
    genly: 20000,
    vortex: 20000,
  },
  {
    year: "2025",
    global: 880000,
    programisto: 440000,
    laHorde: 260000,
    ecoleDeTuring: 140000,
    genly: 20000,
    vortex: 20000,
  },
]

const marginPercentageData = [
  { year: "2020", global: 20, programisto: 20, laHorde: 20, ecoleDeTuring: 20, genly: 20, vortex: 20 },
  { year: "2021", global: 20, programisto: 20, laHorde: 20, ecoleDeTuring: 20, genly: 20, vortex: 20 },
  { year: "2022", global: 20, programisto: 20, laHorde: 20, ecoleDeTuring: 20, genly: 20, vortex: 20 },
  { year: "2023", global: 20, programisto: 20, laHorde: 20, ecoleDeTuring: 20, genly: 20, vortex: 20 },
  { year: "2024", global: 20, programisto: 20, laHorde: 20, ecoleDeTuring: 20, genly: 20, vortex: 20 },
  { year: "2025", global: 20, programisto: 20, laHorde: 20, ecoleDeTuring: 20, genly: 20, vortex: 20 },
]

const monthlyRevenueData = [
  { month: "Jan", revenue: 300000, expenses: 240000, margin: 60000 },
  { month: "Feb", revenue: 320000, expenses: 250000, margin: 70000 },
  { month: "Mar", revenue: 340000, expenses: 260000, margin: 80000 },
  { month: "Apr", revenue: 360000, expenses: 270000, margin: 90000 },
  { month: "May", revenue: 380000, expenses: 280000, margin: 100000 },
  { month: "Jun", revenue: 400000, expenses: 290000, margin: 110000 },
  { month: "Jul", revenue: 420000, expenses: 300000, margin: 120000 },
  { month: "Aug", revenue: 440000, expenses: 310000, margin: 130000 },
  { month: "Sep", revenue: 460000, expenses: 320000, margin: 140000 },
  { month: "Oct", revenue: 480000, expenses: 330000, margin: 150000 },
  { month: "Nov", revenue: 500000, expenses: 340000, margin: 160000 },
  { month: "Dec", revenue: 520000, expenses: 350000, margin: 170000 },
]

export default function DashboardPage() {
  const [selectedEntity, setSelectedEntity] = useState<Entity>({ value: "global", label: "Global (Groupe CLAD)" })

  const entities: Entity[] = [
    { value: "global", label: "Global (Groupe CLAD)", type: "Groupe" },
    { value: "programisto", label: "Programisto", type: "ESN" },
    { value: "laHorde", label: "La Horde", type: "ESN" },
    { value: "ecoleDeTuring", label: "École de Turing", type: "École" },
    { value: "genly", label: "Genly", type: "ESN" },
    { value: "vortex", label: "Vortex", type: "ESN" },
  ]

  const handleEntityChange = (entity: Entity) => {
    setSelectedEntity(entity)
    // In a real app, you would fetch data for the selected entity here
  }

  const formatEuro = (value: number) => `${(value / 1000000).toFixed(1)}M €`
  const formatPercentage = (value: number) => `${value}%`

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-xl font-bold">Financial Dashboard</h1>
          <EntitySelector
            entities={entities}
            selectedEntity={selectedEntity}
            onEntityChange={handleEntityChange}
          />
        </div>
      </header>
      <main className="flex-1 container py-6">
        <h2 className="text-2xl font-bold mb-6">{selectedEntity.label} - Financial Overview</h2>

        <Tabs defaultValue="yearly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="yearly">Yearly Analysis</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="yearly" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Evolution</CardTitle>
                  <CardDescription>Annual revenue by entity from 2020 to 2025</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ChartContainer
                    config={{
                      global: { label: "Global (Groupe CLAD)", color: "hsl(var(--chart-1))" },
                      programisto: { label: "Programisto", color: "hsl(var(--chart-2))" },
                      laHorde: { label: "La Horde", color: "hsl(var(--chart-3))" },
                      ecoleDeTuring: { label: "École de Turing", color: "hsl(var(--chart-4))" },
                      genly: { label: "Genly", color: "hsl(var(--chart-5))" },
                      vortex: { label: "Vortex", color: "hsl(var(--chart-6))" },
                    }}
                  >
                    <LineChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={formatEuro} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="global" stroke="var(--color-global)" />
                      <Line type="monotone" dataKey="programisto" stroke="var(--color-programisto)" />
                      <Line type="monotone" dataKey="laHorde" stroke="var(--color-laHorde)" />
                      <Line type="monotone" dataKey="ecoleDeTuring" stroke="var(--color-ecoleDeTuring)" />
                      <Line type="monotone" dataKey="genly" stroke="var(--color-genly)" />
                      <Line type="monotone" dataKey="vortex" stroke="var(--color-vortex)" />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Margin Evolution</CardTitle>
                  <CardDescription>Annual margin by entity from 2020 to 2025</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ChartContainer
                    config={{
                      global: { label: "Global (Groupe CLAD)", color: "hsl(var(--chart-1))" },
                      programisto: { label: "Programisto", color: "hsl(var(--chart-2))" },
                      laHorde: { label: "La Horde", color: "hsl(var(--chart-3))" },
                      ecoleDeTuring: { label: "École de Turing", color: "hsl(var(--chart-4))" },
                      genly: { label: "Genly", color: "hsl(var(--chart-5))" },
                      vortex: { label: "Vortex", color: "hsl(var(--chart-6))" },
                    }}
                  >
                    <LineChart data={marginData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={formatEuro} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="global" stroke="var(--color-global)" />
                      <Line type="monotone" dataKey="programisto" stroke="var(--color-programisto)" />
                      <Line type="monotone" dataKey="laHorde" stroke="var(--color-laHorde)" />
                      <Line type="monotone" dataKey="ecoleDeTuring" stroke="var(--color-ecoleDeTuring)" />
                      <Line type="monotone" dataKey="genly" stroke="var(--color-genly)" />
                      <Line type="monotone" dataKey="vortex" stroke="var(--color-vortex)" />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Margin Percentage</CardTitle>
                  <CardDescription>Annual margin percentage by entity from 2020 to 2025</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ChartContainer
                    config={{
                      global: { label: "Global (Groupe CLAD)", color: "hsl(var(--chart-1))" },
                      programisto: { label: "Programisto", color: "hsl(var(--chart-2))" },
                      laHorde: { label: "La Horde", color: "hsl(var(--chart-3))" },
                      ecoleDeTuring: { label: "École de Turing", color: "hsl(var(--chart-4))" },
                      genly: { label: "Genly", color: "hsl(var(--chart-5))" },
                      vortex: { label: "Vortex", color: "hsl(var(--chart-6))" },
                    }}
                  >
                    <LineChart data={marginPercentageData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={formatPercentage} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="global" stroke="var(--color-global)" />
                      <Line type="monotone" dataKey="programisto" stroke="var(--color-programisto)" />
                      <Line type="monotone" dataKey="laHorde" stroke="var(--color-laHorde)" />
                      <Line type="monotone" dataKey="ecoleDeTuring" stroke="var(--color-ecoleDeTuring)" />
                      <Line type="monotone" dataKey="genly" stroke="var(--color-genly)" />
                      <Line type="monotone" dataKey="vortex" stroke="var(--color-vortex)" />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Comparison</CardTitle>
                  <CardDescription>Revenue comparison by entity for 2024</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ChartContainer
                    config={{
                      programisto: { label: "Programisto", color: "hsl(var(--chart-2))" },
                      laHorde: { label: "La Horde", color: "hsl(var(--chart-3))" },
                      ecoleDeTuring: { label: "École de Turing", color: "hsl(var(--chart-4))" },
                      genly: { label: "Genly", color: "hsl(var(--chart-5))" },
                      vortex: { label: "Vortex", color: "hsl(var(--chart-6))" },
                    }}
                  >
                    <BarChart data={[revenueData[4]]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis tickFormatter={formatEuro} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="programisto" fill="var(--color-programisto)" />
                      <Bar dataKey="laHorde" fill="var(--color-laHorde)" />
                      <Bar dataKey="ecoleDeTuring" fill="var(--color-ecoleDeTuring)" />
                      <Bar dataKey="genly" fill="var(--color-genly)" />
                      <Bar dataKey="vortex" fill="var(--color-vortex)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Financial Overview (2024)</CardTitle>
                <CardDescription>Revenue, expenses, and margin by month</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                <ChartContainer
                  config={{
                    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
                    expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
                    margin: { label: "Margin", color: "hsl(var(--chart-3))" },
                  }}
                >
                  <BarChart data={monthlyRevenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatEuro} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="revenue" fill="var(--color-revenue)" />
                    <Bar dataKey="expenses" fill="var(--color-expenses)" />
                    <Bar dataKey="margin" fill="var(--color-margin)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

