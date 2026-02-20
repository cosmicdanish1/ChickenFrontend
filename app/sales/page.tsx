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

interface Retailer {
  id: string
  shopName: string
  ownerName: string
  phone: string
  address: string
}

interface Sale {
  id: string
  saleInvoiceNo?: string
  shopName?: string
  ownerName?: string
  phone?: string
  address?: string
  saleMode?: string
  vehicleNo?: string
  salePayment?: "Paid" | "Credit" | "Partial Payment"
  notes?: string
  // Section 2: Bird Details
  birdType?: string
  numberOfCages?: number
  numberOfBirds?: number
  ratePerKg?: number
  averageWeight?: number
  totalWeight?: number
  totalAmount?: number
  // Section 3: Charges
  transportCharges?: number
  loadingCharges?: number
  commission?: number
  otherCharges?: number
  deductions?: number
  // Section 4: Payment
  totalInvoice?: number
  advancePaid?: number
  creditBalance?: number
  outstandingPayment?: number
  paymentMode?: string
  totalPaymentMade?: number
  balanceAmount?: number
  saleDate?: string
  // Legacy fields for backward compatibility
  invoiceNumber?: string
  customer?: string
  date?: string
  productType?: string
  quantity?: number
  unitPrice?: number
  paymentStatus?: "paid" | "pending" | "partial"
}

export default function SalesPage() {
  // Show Coming Soon in demo mode
  if (DEMO_MODE) {
    return (
      <DashboardLayout>
        <ComingSoon 
          title="Sales Management Coming Soon" 
          description="Full sales tracking with customer management and invoicing will be available soon!"
        />
      </DashboardLayout>
    )
  }

  const [sales, setSales] = useState<Sale[]>([])
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingSale, setViewingSale] = useState<Sale | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState<{
    saleInvoiceNo: string
    saleDate: string
    shopName: string
    ownerName: string
    phone: string
    address: string
    saleMode: string
    vehicleNo: string
    salePayment: "Paid" | "Credit" | "Partial Payment"
    notes: string
    // Section 2: Bird Details
    birdType: string
    numberOfCages: string
    numberOfBirds: string
    ratePerKg: string
    averageWeight: string
    totalWeight: string
    totalAmount: string
    // Section 3: Charges
    transportCharges: string
    loadingCharges: string
    commission: string
    otherCharges: string
    deductions: string
    // Section 4: Payment
    totalInvoice: string
    advancePaid: string
    creditBalance: string
    outstandingPayment: string
    paymentMode: string
    totalPaymentMade: string
    balanceAmount: string
  }>({
    saleInvoiceNo: "",
    saleDate: new Date().toISOString().split("T")[0],
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
    saleMode: "",
    vehicleNo: "",
    salePayment: "Paid",
    notes: "",
    // Section 2: Bird Details
    birdType: "",
    numberOfCages: "",
    numberOfBirds: "",
    ratePerKg: "",
    averageWeight: "",
    totalWeight: "",
    totalAmount: "",
    // Section 3: Charges
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    deductions: "",
    // Section 4: Payment
    totalInvoice: "",
    advancePaid: "",
    creditBalance: "",
    outstandingPayment: "",
    paymentMode: "",
    totalPaymentMade: "",
    balanceAmount: "",
  })
  const { startDate, endDate } = useDateFilter()

  useEffect(() => {
    setMounted(true)
    
    // Load retailers for auto-fill
    const savedRetailers = localStorage.getItem("retailers")
    if (savedRetailers) {
      const parsed = JSON.parse(savedRetailers)
      setRetailers(parsed)
    }
    
    // Fetch sales from API
    const fetchSales = async () => {
      try {
        const response = await fetch("/api/sales")
        if (response.ok) {
          const data = await response.json()
          setSales(data.data || [])
        }
      } catch (error) {
        console.error("Error fetching sales:", error)
        // Fallback to localStorage if API fails
    const saved = localStorage.getItem("sales")
    if (saved) {
      setSales(JSON.parse(saved))
        }
      }
    }
    
    fetchSales()
  }, [])

  // Auto-fill Owner Name, Phone, Address when Shop Name is entered
  const handleShopNameChange = (shopName: string) => {
    setFormData({ ...formData, shopName })
    
    // Find retailer by shop name
    const retailer = retailers.find(
      (r) => r.shopName.toLowerCase() === shopName.toLowerCase()
    )
    
    if (retailer) {
      setFormData({
        ...formData,
        shopName,
        ownerName: retailer.ownerName || "",
        phone: retailer.phone || "",
        address: retailer.address || "",
      })
    } else {
      // Clear auto-fill fields if shop not found
      setFormData({
        ...formData,
        shopName,
        ownerName: "",
        phone: "",
        address: "",
      })
    }
  }

  const handleSave = async () => {
    // Validate required fields (check for empty strings and null/undefined)
    if (!formData.shopName || formData.shopName.trim() === "") {
      alert("Please enter Shop Name")
      return
    }
    if (!formData.numberOfCages || formData.numberOfCages.trim() === "" || parseFloat(formData.numberOfCages) <= 0) {
      alert("Please enter a valid Number of Cages (must be greater than 0)")
      return
    }
    if (!formData.ratePerKg || formData.ratePerKg.trim() === "" || parseFloat(formData.ratePerKg) <= 0) {
      alert("Please enter a valid Rate per Kg (must be greater than 0)")
      return
    }

    try {
      const payload = {
        ...formData,
        numberOfBirds: calculatedValues.numberOfBirds.toString(),
        totalWeight: calculatedValues.totalWeight.toString(),
        totalAmount: calculatedValues.totalAmount.toString(),
        totalInvoice: calculatedValues.totalInvoice.toString(),
        outstandingPayment: calculatedValues.outstandingPayment.toString(),
        balanceAmount: calculatedValues.balanceAmount.toString(),
        saleDate: formData.saleDate || new Date().toISOString().split("T")[0],
      }

      console.log("Saving sale with payload:", payload)

      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      // Check if response has content before parsing JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        alert(`Error: Server returned invalid response. Status: ${response.status}`)
        return
      }

      let result
      try {
        const text = await response.text()
        if (!text || text.trim() === "") {
          console.error("Empty response from server")
          alert("Error: Server returned empty response. Please check server logs.")
          return
        }
        result = JSON.parse(text)
        console.log("API Response:", result)
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError)
        alert(`Error: Failed to parse server response. ${parseError.message}`)
        return
      }

      if (response.ok && result.success) {
        // Refetch sales
        const salesResponse = await fetch("/api/sales")
        if (salesResponse.ok) {
          const salesData = await salesResponse.json()
          setSales(salesData.data || [])
          alert("Sale added successfully!")
        }
    resetForm()
    setShowDialog(false)
      } else {
        console.error("Error response:", result)
        alert(`Error: ${result.message || result.error || "Failed to save sale"}`)
      }
    } catch (error) {
      console.error("Error saving sale:", error)
      alert(`Failed to save sale: ${error.message || "Please try again."}`)
    }
  }

  // Auto-calculations
  const calculatedValues = useMemo(() => {
    const cages = parseFloat(formData.numberOfCages) || 0
    // Use manually entered birds if provided, otherwise calculate from cages
    const birds = formData.numberOfBirds ? parseFloat(formData.numberOfBirds) : (cages * 16)
    const avgWeight = parseFloat(formData.averageWeight) || 0
    const rate = parseFloat(formData.ratePerKg) || 0
    
    // Total Weight = Number of Birds * Average Weight
    const totalWeight = birds * avgWeight
    
    // Total Amount = Total Weight * Rate per Kg
    const totalAmount = totalWeight * rate
    
    // Charges
    const transport = parseFloat(formData.transportCharges) || 0
    const loading = parseFloat(formData.loadingCharges) || 0
    const comm = parseFloat(formData.commission) || 0
    const other = parseFloat(formData.otherCharges) || 0
    const deduct = parseFloat(formData.deductions) || 0
    
    // Total Invoice = Total Amount + Transport + Loading + Commission + Other Charges - Deductions
    const totalInvoice = totalAmount + transport + loading + comm + other - deduct
    
    // Payment fields
    const advance = parseFloat(formData.advancePaid) || 0
    const creditBal = parseFloat(formData.creditBalance) || 0
    const totalPaid = parseFloat(formData.totalPaymentMade) || 0
    
    // Outstanding Payment = Total Invoice - Advance Paid - Credit Balance - Total Payment Made
    const outstandingPayment = totalInvoice - advance - creditBal - totalPaid
    
    // Balance Amount = Outstanding Payment
    const balanceAmount = outstandingPayment
    
    return {
      numberOfBirds: birds,
      totalWeight,
      totalAmount,
      totalInvoice,
      outstandingPayment,
      balanceAmount,
    }
  }, [
    formData.numberOfCages,
    formData.numberOfBirds,
    formData.averageWeight,
    formData.ratePerKg,
    formData.transportCharges,
    formData.loadingCharges,
    formData.commission,
    formData.otherCharges,
    formData.deductions,
    formData.advancePaid,
    formData.creditBalance,
    formData.totalPaymentMade,
  ])

  const resetForm = () => {
    setFormData({
      saleInvoiceNo: "",
      saleDate: new Date().toISOString().split("T")[0],
      shopName: "",
      ownerName: "",
      phone: "",
      address: "",
      saleMode: "",
      vehicleNo: "",
      salePayment: "Paid",
      notes: "",
      // Section 2: Bird Details
      birdType: "",
      numberOfCages: "",
      numberOfBirds: "",
      ratePerKg: "",
      averageWeight: "",
      totalWeight: "",
      totalAmount: "",
      // Section 3: Charges
      transportCharges: "",
      loadingCharges: "",
      commission: "",
      otherCharges: "",
      deductions: "",
      // Section 4: Payment
      totalInvoice: "",
      advancePaid: "",
      creditBalance: "",
      outstandingPayment: "",
      paymentMode: "",
      totalPaymentMade: "",
      balanceAmount: "",
    })
    setEditingId(null)
  }

  const handleEdit = (sale: Sale) => {
    setEditingId(sale.id)
    setFormData({
      saleInvoiceNo: sale.saleInvoiceNo || sale.invoiceNumber || "",
      saleDate: sale.saleDate || sale.date || new Date().toISOString().split("T")[0],
      shopName: sale.shopName || sale.customer || "",
      ownerName: sale.ownerName || "",
      phone: sale.phone || "",
      address: sale.address || "",
      saleMode: sale.saleMode || "",
      vehicleNo: sale.vehicleNo || "",
      salePayment: sale.salePayment || (sale.paymentStatus === "paid" ? "Paid" : sale.paymentStatus === "pending" ? "Credit" : "Partial Payment") as "Paid" | "Credit" | "Partial Payment",
      notes: sale.notes || "",
      // Section 2: Bird Details
      birdType: (sale as any).birdType || "",
      numberOfCages: (sale as any).numberOfCages?.toString() || "",
      numberOfBirds: (sale as any).numberOfBirds?.toString() || "",
      ratePerKg: (sale as any).ratePerKg?.toString() || "",
      averageWeight: (sale as any).averageWeight?.toString() || "",
      totalWeight: (sale as any).totalWeight?.toString() || "",
      totalAmount: (sale as any).totalAmount?.toString() || sale.totalAmount?.toString() || "",
      // Section 3: Charges
      transportCharges: (sale as any).transportCharges?.toString() || "",
      loadingCharges: (sale as any).loadingCharges?.toString() || "",
      commission: (sale as any).commission?.toString() || "",
      otherCharges: (sale as any).otherCharges?.toString() || "",
      deductions: (sale as any).deductions?.toString() || "",
      // Section 4: Payment
      totalInvoice: (sale as any).totalInvoice?.toString() || "",
      advancePaid: (sale as any).advancePaid?.toString() || "",
      creditBalance: (sale as any).creditBalance?.toString() || "",
      outstandingPayment: (sale as any).outstandingPayment?.toString() || "",
      paymentMode: (sale as any).paymentMode || "",
      totalPaymentMade: (sale as any).totalPaymentMade?.toString() || "",
      balanceAmount: (sale as any).balanceAmount?.toString() || "",
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this sale?")) {
      try {
        const response = await fetch(`/api/sales?id=${id}`, {
          method: "DELETE",
        })
        
        if (response.ok) {
          // Refetch sales
          const salesResponse = await fetch("/api/sales")
          if (salesResponse.ok) {
            const salesData = await salesResponse.json()
            setSales(salesData.data || [])
          }
        } else {
          alert("Failed to delete sale")
        }
      } catch (error) {
        console.error("Error deleting sale:", error)
        alert("Failed to delete sale. Please try again.")
      }
    }
  }

  const handleView = (sale: Sale) => {
    setViewingSale(sale)
    setShowViewDialog(true)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "partial":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filter sales based on date range
  const filteredSales = useMemo(() => {
    let filtered = sales

    // Apply date range filter (from date range picker in Sales List section)
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((sale) => {
        const saleDateValue = sale.saleDate || sale.date
        if (!saleDateValue) return false
        
        const saleDate = new Date(saleDateValue)
        saleDate.setHours(0, 0, 0, 0)

        return saleDate >= start && saleDate <= end
      })
    }

    // Also apply global date filter if set (from context)
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((sale) => {
        const saleDateValue = sale.saleDate || sale.date
        if (!saleDateValue) return false
        
        const saleDate = new Date(saleDateValue)
        saleDate.setHours(0, 0, 0, 0)

        return saleDate >= start && saleDate <= end
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (sale) =>
          (sale.saleInvoiceNo || sale.invoiceNumber || "").toLowerCase().includes(query) ||
          (sale.shopName || sale.customer || "").toLowerCase().includes(query) ||
          (sale.ownerName || "").toLowerCase().includes(query) ||
          (sale.phone || "").toLowerCase().includes(query),
      )
    }

    return filtered
  }, [sales, dateRangeStart, dateRangeEnd, startDate, endDate, searchQuery])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const handleDownloadPDF = () => {
    const filtered = filteredSales
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report</title>
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
            <h1>Sales List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Sales:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Sale Invoice No.</th>
                <th>Shop Name</th>
                <th>Sale Date</th>
                <th>Rate per Kg</th>
                <th>Cage Qty</th>
                <th>Bird Qty</th>
                <th>Average Bird Weight (Kg)</th>
                <th>Total Value</th>
                <th>Sale Type</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(sale => `
                <tr>
                  <td>${sale.saleInvoiceNo || sale.invoiceNumber || "N/A"}</td>
                  <td>${sale.shopName || sale.customer || "N/A"}</td>
                  <td>${sale.saleDate || sale.date || "N/A"}</td>
                  <td>₹${(sale.ratePerKg || sale.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${(sale.numberOfCages || sale.cageQuantity || 0).toLocaleString()}</td>
                  <td>${(sale.numberOfBirds || sale.birdQuantity || sale.quantity || 0).toLocaleString()}</td>
                  <td>${(sale.averageWeight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>₹${(sale.totalAmount || sale.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${sale.salePayment || (sale.paymentStatus === "paid" ? "Paid" : sale.paymentStatus === "pending" ? "Credit" : sale.paymentStatus === "partial" ? "Partial Payment" : "N/A")}</td>
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
    link.download = `sales-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePrintReport = () => {
    const filtered = filteredSales
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report</title>
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
            <h1>Sales List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Sales:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Sale Invoice No.</th>
                <th>Shop Name</th>
                <th>Sale Date</th>
                <th>Rate per Kg</th>
                <th>Cage Qty</th>
                <th>Bird Qty</th>
                <th>Average Bird Weight (Kg)</th>
                <th>Total Value</th>
                <th>Sale Type</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(sale => `
                <tr>
                  <td>${sale.saleInvoiceNo || sale.invoiceNumber || "N/A"}</td>
                  <td>${sale.shopName || sale.customer || "N/A"}</td>
                  <td>${sale.saleDate || sale.date || "N/A"}</td>
                  <td>₹${(sale.ratePerKg || sale.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${(sale.numberOfCages || sale.cageQuantity || 0).toLocaleString()}</td>
                  <td>${(sale.numberOfBirds || sale.birdQuantity || sale.quantity || 0).toLocaleString()}</td>
                  <td>${(sale.averageWeight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>₹${(sale.totalAmount || sale.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${sale.salePayment || (sale.paymentStatus === "paid" ? "Paid" : sale.paymentStatus === "pending" ? "Credit" : sale.paymentStatus === "partial" ? "Partial Payment" : "N/A")}</td>
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

  const totalSales = filteredSales.length
  const totalBirdsSold = filteredSales.reduce((sum, s) => sum + (s.numberOfBirds || s.birdQuantity || s.quantity || 0), 0)
  const totalValue = filteredSales.reduce((sum, s) => sum + (s.totalAmount || s.totalValue || 0), 0)
  const totalPaymentReceived = filteredSales.reduce((sum, s) => sum + (s.totalPaymentMade || (s.paymentStatus === "paid" ? (s.totalAmount || s.totalValue || 0) : 0)), 0)
  const totalCredit = filteredSales
    .filter((s) => s.salePayment === "Credit" || s.paymentStatus === "pending")
    .reduce((sum, s) => sum + (s.totalInvoice || s.totalAmount || s.totalValue || 0), 0)

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Tracking</h1>
            <p className="text-muted-foreground">Record and manage customer sales</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Sale" : "Add New Sale"}</DialogTitle>
                <DialogDescription>Enter sale details</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Section 1: Header Information */}
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Section 1: Header Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sale Invoice No. <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.saleInvoiceNo}
                        onChange={(e) => setFormData({ ...formData, saleInvoiceNo: e.target.value })}
                        placeholder="Enter invoice number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sale Date <span className="text-red-500">*</span></Label>
                      <Input
                        type="date"
                        value={formData.saleDate}
                        onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shop Name <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.shopName}
                        onChange={(e) => handleShopNameChange(e.target.value)}
                        placeholder="Enter shop name"
                        list="shopNames"
                      />
                      <datalist id="shopNames">
                        {retailers.map((retailer) => (
                          <option key={retailer.id} value={retailer.shopName} />
                        ))}
                      </datalist>
                    </div>
                    <div className="space-y-2">
                      <Label>Owner Name</Label>
                    <Input
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        placeholder="Auto-fill from master data"
                        readOnly
                        className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Auto-fill from master data"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                    <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Auto-fill from master data"
                        readOnly
                        className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                      <Label>Sale Mode</Label>
                    <Select
                        value={formData.saleMode}
                        onValueChange={(value) => setFormData({ ...formData, saleMode: value })}
                    >
                      <SelectTrigger>
                          <SelectValue placeholder="Select sale mode" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="From Gadi">From Gadi</SelectItem>
                          <SelectItem value="From Godown">From Godown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                      <Label>Vehicle No</Label>
                      <Input
                        value={formData.vehicleNo}
                        onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                        placeholder="Enter vehicle number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sale Payment</Label>
                    <Select
                        value={formData.salePayment}
                        onValueChange={(value: "Paid" | "Credit" | "Partial Payment") => 
                          setFormData({ ...formData, salePayment: value })
                        }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Credit">Credit</SelectItem>
                          <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Enter any additional notes"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Bird Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Section 2: Bird Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bird Type</Label>
                      <Select
                        value={formData.birdType}
                        onValueChange={(value) => setFormData({ ...formData, birdType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select bird type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Boiler">Boiler</SelectItem>
                          <SelectItem value="Layer">Layer</SelectItem>
                          <SelectItem value="Desi">Desi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  <div className="space-y-2">
                      <Label>Number of Cages <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                        value={formData.numberOfCages}
                        onChange={(e) => {
                          const cages = e.target.value
                          const birds = cages ? (parseFloat(cages) * 16).toString() : ""
                          setFormData({ 
                            ...formData, 
                            numberOfCages: cages,
                            numberOfBirds: birds
                          })
                        }}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                      <Label>Number of Birds</Label>
                      <Input
                        type="number"
                        value={formData.numberOfBirds || calculatedValues.numberOfBirds.toString()}
                        onChange={(e) => setFormData({ ...formData, numberOfBirds: e.target.value })}
                        placeholder="Auto-calculated (Cages × 16)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate per Kg <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.ratePerKg}
                        onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Average Weight (Kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                        value={formData.averageWeight}
                        onChange={(e) => setFormData({ ...formData, averageWeight: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                    <div className="space-y-2">
                      <Label>Total Weight</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={calculatedValues.totalWeight.toFixed(2)}
                        placeholder="Auto-calculated"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  <div className="space-y-2">
                    <Label>Total Amount</Label>
                    <Input
                      type="number"
                        step="0.01"
                        value={calculatedValues.totalAmount.toFixed(2)}
                        placeholder="Auto-calculated"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Charges */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Section 3: Charges</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transport Charges</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.transportCharges}
                        onChange={(e) => setFormData({ ...formData, transportCharges: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Loading Charges</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.loadingCharges}
                        onChange={(e) => setFormData({ ...formData, loadingCharges: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Commission</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.commission}
                        onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Charges</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.otherCharges}
                        onChange={(e) => setFormData({ ...formData, otherCharges: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Deductions</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.deductions}
                        onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                      placeholder="0.00"
                    />
                    </div>
                  </div>
                </div>

                {/* Section 4: Payment */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Section 4: Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Invoice</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={calculatedValues.totalInvoice.toFixed(2)}
                        placeholder="Auto-calculated"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Advance Paid</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.advancePaid}
                        onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Credit Balance</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.creditBalance}
                        onChange={(e) => setFormData({ ...formData, creditBalance: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Outstanding Payment</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={calculatedValues.outstandingPayment.toFixed(2)}
                        placeholder="Auto-calculated"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Mode</Label>
                      <Select
                        value={formData.paymentMode}
                        onValueChange={(value) => setFormData({ ...formData, paymentMode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Credit">Credit</SelectItem>
                          <SelectItem value="Online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Total Payment Received</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.totalPaymentMade}
                        onChange={(e) => setFormData({ ...formData, totalPaymentMade: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                <div className="space-y-2">
                      <Label>Balance Amount</Label>
                  <Input
                        type="number"
                        step="0.01"
                        value={calculatedValues.balanceAmount.toFixed(2)}
                        placeholder="Auto-calculated"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Update" : "Add"} Sale
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales (no)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalSales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Birds Sales (Qty)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBirdsSold}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value (rs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total payment Received (rs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₹{totalPaymentReceived.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Credit (Rs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">₹{totalCredit.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Sales List</CardTitle>
            <CardDescription>View and manage all sales transactions</CardDescription>
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
                      placeholder="Search by invoice, shop name, owner or phone..."
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
                    <TableHead>Sale Invoice No.</TableHead>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Rate per Kg</TableHead>
                    <TableHead>Cage Qty</TableHead>
                    <TableHead>Bird Qty</TableHead>
                    <TableHead>Average Bird Weight (Kg)</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Sale Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        {searchQuery || (dateRangeStart && dateRangeEnd) ? "No sales found matching your filters." : "No sales found. Click \"Add New Sale\" to create your first sale."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale) => (
                      <TableRow 
                        key={sale.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(sale)}
                      >
                        <TableCell className="font-medium">
                          {sale.saleInvoiceNo || sale.invoiceNumber || "N/A"}
                        </TableCell>
                        <TableCell>{sale.shopName || sale.customer || "N/A"}</TableCell>
                        <TableCell>{sale.saleDate || sale.date || "N/A"}</TableCell>
                        <TableCell>₹{sale.ratePerKg?.toFixed(2) || sale.unitPrice?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>{sale.numberOfCages || sale.cageQuantity || 0}</TableCell>
                        <TableCell>{sale.numberOfBirds || sale.birdQuantity || sale.quantity || 0}</TableCell>
                        <TableCell>{sale.averageWeight?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>₹{sale.totalAmount?.toFixed(2) || sale.totalValue?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              sale.salePayment === "Paid" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : sale.salePayment === "Credit"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : sale.salePayment === "Partial Payment"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : getPaymentStatusColor(sale.paymentStatus || "")
                            }`}
                          >
                            {sale.salePayment || 
                              (sale.paymentStatus === "paid" ? "Paid" : 
                               sale.paymentStatus === "pending" ? "Credit" : 
                               sale.paymentStatus === "partial" ? "Partial Payment" : 
                               "N/A")}
                        </span>
                      </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="icon" onClick={() => handleEdit(sale)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(sale.id)}>
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
              <DialogTitle>Sale Details</DialogTitle>
              <DialogDescription>View complete sale information</DialogDescription>
            </DialogHeader>
            {viewingSale && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Invoice Number</Label>
                    <div className="text-sm font-medium">{viewingSale.invoiceNumber}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Customer</Label>
                    <div className="text-sm font-medium">{viewingSale.customer}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Date</Label>
                    <div className="text-sm font-medium">{viewingSale.date}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Product Type</Label>
                    <div className="text-sm font-medium capitalize">{viewingSale.productType || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Quantity</Label>
                    <div className="text-sm font-medium">{viewingSale.quantity}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Unit Price</Label>
                    <div className="text-sm font-medium">₹{viewingSale.unitPrice}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Total Amount</Label>
                    <div className="text-sm font-medium">₹{viewingSale.totalAmount}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Payment Status</Label>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(viewingSale.paymentStatus)}`}>
                        {viewingSale.paymentStatus.charAt(0).toUpperCase() + viewingSale.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                  {viewingSale.notes && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Notes</Label>
                      <div className="text-sm font-medium">{viewingSale.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
