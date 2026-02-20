"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Download, Printer, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateRangeFilter } from "@/components/date-range-filter"
import { useDateFilter } from "@/contexts/date-filter-context"
import { DEMO_MODE } from "@/lib/demo-config"
import { ComingSoon } from "@/components/coming-soon"

interface Expense {
  id: string
  expenseOwner: string
  date: string
  category: string
  description: string
  amount: number
  paymentMethod: string
  notes: string
  receipt?: string
}

export default function ExpensesPage() {
  // Show Coming Soon in demo mode
  if (DEMO_MODE) {
    return (
      <DashboardLayout>
        <ComingSoon 
          title="Expense Management Coming Soon" 
          description="Complete expense tracking and categorization will be available soon!"
        />
      </DashboardLayout>
    )
  }

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    expenseOwner: "",
    date: new Date().toISOString().split("T")[0],
    category: "feed",
    description: "",
    amount: "",
    paymentMethod: "cash",
    notes: "",
  })
  const { startDate, endDate } = useDateFilter()

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("expenses")
    if (saved) {
      setExpenses(JSON.parse(saved))
    } else {
      setExpenses([])
    }
  }, [])

  const handleSave = () => {
    if (!formData.description || !formData.amount) {
      alert("Please fill all required fields")
      return
    }

    let updatedExpenses: Expense[]
    if (editingId) {
      updatedExpenses = expenses.map((expense) =>
        expense.id === editingId
          ? {
              ...expense,
              expenseOwner: formData.expenseOwner,
              date: formData.date,
              category: formData.category,
              description: formData.description,
              amount: Number.parseFloat(formData.amount),
              paymentMethod: formData.paymentMethod,
              notes: formData.notes,
            }
          : expense,
      )
    } else {
      updatedExpenses = [
        ...expenses,
        {
          id: Date.now().toString(),
          expenseOwner: formData.expenseOwner,
          date: formData.date,
          category: formData.category,
          description: formData.description,
          amount: Number.parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
        },
      ]
    }

    setExpenses(updatedExpenses)
    localStorage.setItem("expenses", JSON.stringify(updatedExpenses))
    resetForm()
    setShowDialog(false)
  }

  const resetForm = () => {
    setFormData({
      expenseOwner: "",
      date: new Date().toISOString().split("T")[0],
      category: "feed",
      description: "",
      amount: "",
      paymentMethod: "cash",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setFormData({
      expenseOwner: expense.expenseOwner || "",
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
    })
    setShowDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      const updated = expenses.filter((expense) => expense.id !== id)
      setExpenses(updated)
      localStorage.setItem("expenses", JSON.stringify(updated))
    }
  }

  const categories = ["feed", "labor", "medicine", "equipment", "maintenance", "transportation", "other"]
  const categoryEmojis: { [key: string]: string } = {
    feed: "🌾",
    labor: "👷",
    medicine: "💊",
    equipment: "🔧",
    maintenance: "🔨",
    transportation: "🚚",
    other: "📋",
  }

  // Filter expenses based on date range and search
  const filteredExpenses = useMemo(() => {
    let filtered = expenses

    // Apply date range filter (from date range picker in Expense List section)
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date)
        expenseDate.setHours(0, 0, 0, 0)
        return expenseDate >= start && expenseDate <= end
      })
    }

    // Also apply global date filter if set (from context)
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((expense) => {
        const expenseDate = new Date(expense.date)
        expenseDate.setHours(0, 0, 0, 0)
        return expenseDate >= start && expenseDate <= end
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (expense) =>
          (expense.expenseOwner || "").toLowerCase().includes(query) ||
          (expense.description || "").toLowerCase().includes(query) ||
          (expense.category || "").toLowerCase().includes(query),
      )
    }

    return filtered
  }, [expenses, dateRangeStart, dateRangeEnd, startDate, endDate, searchQuery])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const handleDownloadPDF = () => {
    const filtered = filteredExpenses
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expenses Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
            .date-range { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Expenses List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Records:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Expense Owner</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(expense => `
                <tr>
                  <td>${expense.expenseOwner || "N/A"}</td>
                  <td>${expense.date}</td>
                  <td>${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</td>
                  <td>${expense.description}</td>
                  <td>₹${expense.amount.toLocaleString()}</td>
                  <td>${expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Create blob and download
    const blob = new Blob([printContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `expenses-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePrintReport = () => {
    const filtered = filteredExpenses
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expenses Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
            .date-range { margin-bottom: 10px; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Expenses List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Records:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Expense Owner</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Method</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(expense => `
                <tr>
                  <td>${expense.expenseOwner || "N/A"}</td>
                  <td>${expense.date}</td>
                  <td>${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}</td>
                  <td>${expense.description}</td>
                  <td>₹${expense.amount.toLocaleString()}</td>
                  <td>${expense.paymentMethod.charAt(0).toUpperCase() + expense.paymentMethod.slice(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // Open new window and print
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Expenses & Financial Tracking</h1>
            <p className="text-muted-foreground">Track all farm expenses and costs</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                <DialogDescription>Enter expense details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Expense Owner</Label>
                  <Input
                    value={formData.expenseOwner}
                    onChange={(e) => setFormData({ ...formData, expenseOwner: e.target.value })}
                    placeholder="Enter expense owner name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoryEmojis[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What was this expense for?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={3}
                  />
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Update" : "Save"} Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense (rs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Expense By Category</CardTitle>
              <CardDescription>Expenses breakdown by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { key: "feed", label: "Feed" },
                  { key: "labor", label: "Labour" },
                  { key: "medicine", label: "Medicine" },
                  { key: "equipment", label: "Equipment" },
                  { key: "maintenance", label: "Maintenance" },
                  { key: "transportation", label: "Transportation" },
                ].map(({ key, label }) => {
                  const categoryAmount = filteredExpenses
                    .filter((e) => e.category === key)
                    .reduce((sum, e) => sum + e.amount, 0)
                  
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{categoryEmojis[key] || "📋"}</span>
                        <span className="font-medium">{label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{categoryAmount.toLocaleString()}</div>
                        {totalExpenses > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {((categoryAmount / totalExpenses) * 100).toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>Complete list of all expenses</CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <DateRangeFilter
                  startDate={dateRangeStart}
                  endDate={dateRangeEnd}
                  onDateRangeChange={handleDateRangeChange}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium whitespace-nowrap">Filter:</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search by owner, description, or category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[200px]"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchQuery("")}
                        className="h-10 w-10"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                >
                  <Download className="mr-2" size={16} />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReport}
                >
                  <Printer className="mr-2" size={16} />
                  Print Report
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expense Owner</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {searchQuery || (dateRangeStart && dateRangeEnd) ? "No expenses found matching your filters." : "No expenses found. Click \"Add New Expense\" to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((expense) => (
                        <TableRow 
                          key={expense.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setViewingExpense(expense)
                            setShowViewDialog(true)
                          }}
                        >
                          <TableCell>{expense.expenseOwner || "N/A"}</TableCell>
                          <TableCell>{expense.date}</TableCell>
                          <TableCell className="capitalize">{expense.category}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell className="font-medium">₹{expense.amount}</TableCell>
                          <TableCell className="capitalize">{expense.paymentMethod}</TableCell>
                          <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="icon" onClick={() => handleEdit(expense)}>
                              <Edit2 size={16} />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDelete(expense.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Expense Details</DialogTitle>
              <DialogDescription>View complete expense information</DialogDescription>
            </DialogHeader>
            {viewingExpense && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Expense Owner</Label>
                    <div className="text-sm font-medium">{viewingExpense.expenseOwner || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Date</Label>
                    <div className="text-sm font-medium">{viewingExpense.date}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Category</Label>
                    <div className="text-sm font-medium capitalize">{viewingExpense.category}</div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <div className="text-sm font-medium">{viewingExpense.description}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Amount</Label>
                    <div className="text-sm font-medium font-semibold">₹{viewingExpense.amount}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Payment Method</Label>
                    <div className="text-sm font-medium capitalize">{viewingExpense.paymentMethod}</div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Notes</Label>
                    <div className="text-sm font-medium">{viewingExpense.notes || "N/A"}</div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
