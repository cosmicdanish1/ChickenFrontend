"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, BarChart3, Download, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { DEMO_MODE } from "@/lib/demo-config"
import { ComingSoon } from "@/components/coming-soon"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

export default function ReportsPage() {
  // Show Coming Soon in demo mode
  if (DEMO_MODE) {
    return (
      <DashboardLayout>
        <ComingSoon 
          title="Reports Coming Soon" 
          description="Detailed reports and analytics for all operations will be available soon!"
        />
      </DashboardLayout>
    )
  }

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [financialSummary, setFinancialSummary] = useState<any>(null)
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([])
  const [profitTrends, setProfitTrends] = useState<any[]>([])
  const [salesPerformance, setSalesPerformance] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    loadReportsData()
  }, [])

  const loadReportsData = async () => {
    try {
      setLoading(true)
      
      const [
        summary,
        trends,
        profits,
        sales,
        expenses
      ] = await Promise.all([
        api.getFinancialSummary(6),
        api.getMonthlyRevenueVsExpenses(6),
        api.getMonthlyProfitTrends(6),
        api.getSalesPerformance(),
        api.getTopExpenseCategories({ limit: 5 })
      ])

      setFinancialSummary(summary)
      setMonthlyTrends(trends)
      setProfitTrends(profits)
      setSalesPerformance(sales)
      setExpenseCategories(expenses)
    } catch (error) {
      console.error('Failed to load reports data:', error)
      toast.error('Failed to load reports data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleExport = () => {
    toast.info('Export functionality coming soon!')
  }

  if (!mounted) return null

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Financial Reports</h1>
            <p className="text-muted-foreground">Comprehensive financial analytics and insights</p>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2" size={20} />
            Export Report
          </Button>
        </div>

        {/* Financial Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign size={16} />
                Total Revenue (6M)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(financialSummary?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(financialSummary?.revenuePerMonth || 0)}/month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown size={16} />
                Total Expenses (6M)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(financialSummary?.totalExpenses || 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg: {formatCurrency(financialSummary?.expensePerMonth || 0)}/month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp size={16} />
                Total Profit (6M)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary?.totalProfit || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Margin: {financialSummary?.profitMargin || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 size={16} />
                ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {financialSummary?.roi?.toFixed(2) || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Return on Investment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Revenue vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue vs Expenses</CardTitle>
            <CardDescription>6-month comparison of revenue and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Profit Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Net Profit Trends</CardTitle>
              <CardDescription>Profit performance over 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profitTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Expense Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Distribution</CardTitle>
              <CardDescription>Top 5 expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, percent }: any) => `${category}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="category"
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sales Performance by Product */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Performance Analysis</CardTitle>
            <CardDescription>Revenue and quantity by product type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={salesPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productType" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue (₹)" />
                <Bar yAxisId="right" dataKey="quantity" fill="#10b981" name="Quantity" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Performance Indicators Table */}
        <Card>
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
            <CardDescription>Detailed financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Revenue Per Month</span>
                  <span className="text-sm font-bold">{formatCurrency(financialSummary?.revenuePerMonth || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Expense Per Month</span>
                  <span className="text-sm font-bold">{formatCurrency(financialSummary?.expensePerMonth || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Profit Per Month</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(financialSummary?.avgMonthlyProfit || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Profit Margin</span>
                  <span className="text-sm font-bold text-blue-600">
                    {financialSummary?.profitMargin || 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Performance Details Table */}
        {salesPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Details</CardTitle>
              <CardDescription>Detailed breakdown by product type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product Type</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Sales Count</th>
                      <th className="text-right p-2">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesPerformance.map((product, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 capitalize font-medium">{product.productType}</td>
                        <td className="p-2 text-right">{formatCurrency(product.revenue)}</td>
                        <td className="p-2 text-right">{product.quantity.toLocaleString()}</td>
                        <td className="p-2 text-right">{product.salesCount}</td>
                        <td className="p-2 text-right">{formatCurrency(product.avgPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
