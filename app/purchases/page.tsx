"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, Trash2, Eye, Download, Printer, Search, X } from "lucide-react"
import { DateRangeFilter } from "@/components/date-range-filter"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDateFilter } from "@/contexts/date-filter-context"
import { DEMO_MODE } from "@/lib/demo-config"
import { ComingSoon } from "@/components/coming-soon"

interface Farmer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  birdCount: number
  joinDate: string
}

interface Vehicle {
  id: string
  vehicleNumber: string
  vehicleType: string
  driverName: string
  phone: string
  status: "active" | "inactive"
}

interface PurchaseOrder {
  id: string
  purchaseInvoiceNo: string
  purchaseDate: string
  farmerName: string
  farmerMobile: string
  farmLocation: string
  vehicleNo: string
  purchaseType: "Paid" | "Credit"
  notes: string
  birdType: string
  numberOfCages: number
  numberOfBirds: number
  ratePerKg: number
  averageWeight: number
  totalWeight: number
  totalAmount: number
  transportCharges: number
  loadingCharges: number
  commission: number
  otherCharges: number
  deductions: number
  totalInvoice: number
  advancePaid: number
  outstandingPayment: number
  paymentMode: string
  totalPaymentMade: number
  balanceAmount: number
  dueDate: string
  // Legacy fields for backward compatibility
  orderNumber?: string
  supplier?: string
  date?: string
  description?: string
  birdQuantity?: number
  cageQuantity?: number
  unitCost?: number
  totalValue?: number
  status?: "pending" | "picked up" | "cancel"
}

export default function PurchasesPage() {
  // Show Coming Soon in demo mode
  if (DEMO_MODE) {
    return (
      <DashboardLayout>
        <ComingSoon 
          title="Purchase Orders Coming Soon" 
          description="Complete purchase order management with supplier tracking will be available soon!"
        />
      </DashboardLayout>
    )
  }

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState<{
    purchaseInvoiceNo: string
    purchaseDate: string
    farmerName: string
    farmerMobile: string
    farmLocation: string
    vehicleNo: string
    purchaseType: "Paid" | "Credit"
    notes: string
    birdType: string
    averageWeight: string
    totalWeight: string
    ratePerKg: string
    totalAmount: string
    transportCharges: string
    loadingCharges: string
    commission: string
    otherCharges: string
    deductions: string
    advancePaid: string
    paymentMode: string
    balanceAmount: string
    dueDate: string
  }>({
    purchaseInvoiceNo: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    farmerName: "",
    farmerMobile: "",
    farmLocation: "",
    vehicleNo: "",
    purchaseType: "Paid",
    notes: "",
    birdType: "",
    numberOfCages: "",
    numberOfBirds: "",
    ratePerKg: "",
    averageWeight: "",
    totalWeight: "",
    totalAmount: "",
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    deductions: "",
    totalInvoice: "",
    advancePaid: "",
    outstandingPayment: "",
    paymentMode: "",
    totalPaymentMade: "",
    balanceAmount: "",
    dueDate: "",
  })
  const { startDate, endDate } = useDateFilter()

  useEffect(() => {
    setMounted(true)
    
    // Load farmers for supplier dropdown
    const savedFarmers = localStorage.getItem("farmers")
    if (savedFarmers) {
      setFarmers(JSON.parse(savedFarmers))
    }

    // Load vehicles for vehicle dropdown
    const savedVehicles = localStorage.getItem("vehicles")
    if (savedVehicles) {
      const parsedVehicles = JSON.parse(savedVehicles)
      setVehicles(parsedVehicles.filter((v: Vehicle) => v.status === "active"))
    }

    // Fetch purchase orders from API
    fetchOrders()
  }, [])

  // Auto-fill farmer mobile and farm location when farmer is selected
  useEffect(() => {
    if (formData.farmerName) {
      const selectedFarmer = farmers.find((f) => f.name === formData.farmerName)
      if (selectedFarmer) {
        setFormData((prev) => ({
          ...prev,
          farmerMobile: selectedFarmer.phone || "",
          farmLocation: selectedFarmer.address || "",
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        farmerMobile: "",
        farmLocation: "",
      }))
    }
  }, [formData.farmerName, farmers])

  // Auto-calculate number of birds from cages
  const calculatedNumberOfBirds = useMemo(() => {
    const cages = Number.parseFloat(formData.numberOfCages) || 0
    return cages * 16
  }, [formData.numberOfCages])

  // Auto-calculate total weight
  const totalWeight = useMemo(() => {
    const birds = calculatedNumberOfBirds || 0
    const avgWeight = Number.parseFloat(formData.averageWeight) || 0
    return birds * avgWeight
  }, [calculatedNumberOfBirds, formData.averageWeight])

  // Auto-calculate total amount
  const totalAmount = useMemo(() => {
    const weight = totalWeight
    const rate = Number.parseFloat(formData.ratePerKg) || 0
    return weight * rate
  }, [totalWeight, formData.ratePerKg])

  // Auto-calculate total invoice (Total Amount + Charges - Deductions)
  const totalInvoice = useMemo(() => {
    const total = totalAmount
    const transport = Number.parseFloat(formData.transportCharges) || 0
    const loading = Number.parseFloat(formData.loadingCharges) || 0
    const commission = Number.parseFloat(formData.commission) || 0
    const other = Number.parseFloat(formData.otherCharges) || 0
    const deductions = Number.parseFloat(formData.deductions) || 0
    
    return total + transport + loading + commission + other - deductions
  }, [totalAmount, formData.transportCharges, formData.loadingCharges, formData.commission, formData.otherCharges, formData.deductions])

  // Auto-calculate outstanding payment (Total Invoice - Advance Paid)
  const outstandingPayment = useMemo(() => {
    const invoice = totalInvoice
    const advance = Number.parseFloat(formData.advancePaid) || 0
    return invoice - advance
  }, [totalInvoice, formData.advancePaid])

  // Auto-calculate balance amount (Outstanding Payment - Total Payment Made)
  const balanceAmount = useMemo(() => {
    const outstanding = outstandingPayment
    const paymentMade = Number.parseFloat(formData.totalPaymentMade) || 0
    return outstanding - paymentMade
  }, [outstandingPayment, formData.totalPaymentMade])

  // Update calculated fields when dependencies change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      totalWeight: totalWeight.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      totalInvoice: totalInvoice.toFixed(2),
      outstandingPayment: outstandingPayment.toFixed(2),
      balanceAmount: balanceAmount.toFixed(2),
    }))
  }, [totalWeight, totalAmount, totalInvoice, outstandingPayment, balanceAmount])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/purchases")
      const result = await response.json()

      if (result.success) {
        // Convert database IDs to strings for compatibility
        const formattedOrders = result.data.map((order: any) => ({
          ...order,
          id: order.id.toString(),
        }))
        setOrders(formattedOrders)
      } else {
        console.error("Error fetching purchases:", result.error)
        setOrders([])
      }
    } catch (error) {
      console.error("Error fetching purchases:", error)
      setOrders([])
    }
  }


  const handleSave = async () => {
    // Only validate mandatory fields (marked with *)
    if (!formData.purchaseInvoiceNo || !formData.purchaseDate || !formData.farmerName || !formData.numberOfCages || !formData.ratePerKg) {
      alert("Please fill all required fields (marked with *)")
      return
    }

    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseInvoiceNo: formData.purchaseInvoiceNo,
          purchaseDate: formData.purchaseDate,
          farmerName: formData.farmerName,
          farmerMobile: formData.farmerMobile || "",
          farmLocation: formData.farmLocation || "",
          vehicleNo: formData.vehicleNo || "",
          purchaseType: formData.purchaseType || "Paid",
          notes: formData.notes || "",
          birdType: formData.birdType || "",
          numberOfCages: Number.parseFloat(formData.numberOfCages) || 0,
          numberOfBirds: calculatedNumberOfBirds || 0,
          ratePerKg: Number.parseFloat(formData.ratePerKg) || 0,
          averageWeight: formData.averageWeight ? Number.parseFloat(formData.averageWeight) : 0,
          totalWeight: formData.totalWeight ? Number.parseFloat(formData.totalWeight) : 0,
          totalAmount: formData.totalAmount ? Number.parseFloat(formData.totalAmount) : 0,
          transportCharges: formData.transportCharges ? Number.parseFloat(formData.transportCharges) : 0,
          loadingCharges: formData.loadingCharges ? Number.parseFloat(formData.loadingCharges) : 0,
          commission: formData.commission ? Number.parseFloat(formData.commission) : 0,
          otherCharges: formData.otherCharges ? Number.parseFloat(formData.otherCharges) : 0,
          deductions: formData.deductions ? Number.parseFloat(formData.deductions) : 0,
          totalInvoice: formData.totalInvoice ? Number.parseFloat(formData.totalInvoice) : 0,
          advancePaid: formData.advancePaid ? Number.parseFloat(formData.advancePaid) : 0,
          outstandingPayment: formData.outstandingPayment ? Number.parseFloat(formData.outstandingPayment) : 0,
          paymentMode: formData.paymentMode || "",
          totalPaymentMade: formData.totalPaymentMade ? Number.parseFloat(formData.totalPaymentMade) : 0,
          balanceAmount: formData.balanceAmount ? Number.parseFloat(formData.balanceAmount) : 0,
          dueDate: formData.dueDate || "",
        }),
      })

      const result = await response.json()

      if (result.success) {
    resetForm()
    setShowDialog(false)
        // Refresh the orders list
        fetchOrders()
      } else {
        alert(`Error: ${result.message || result.error}`)
      }
    } catch (error) {
      console.error("Error saving purchase order:", error)
      alert("Failed to save purchase order")
    }
  }

  const resetForm = () => {
    setFormData({
      purchaseInvoiceNo: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      farmerName: "",
      farmerMobile: "",
      farmLocation: "",
      vehicleNo: "",
      purchaseType: "Paid",
    notes: "",
    birdType: "",
    numberOfCages: "",
    numberOfBirds: "",
    ratePerKg: "",
    averageWeight: "",
    totalWeight: "",
    totalAmount: "",
    transportCharges: "",
    loadingCharges: "",
    commission: "",
    otherCharges: "",
    deductions: "",
    totalInvoice: "",
    advancePaid: "",
    outstandingPayment: "",
    paymentMode: "",
    totalPaymentMade: "",
    balanceAmount: "",
      dueDate: "",
    })
    setEditingId(null)
  }

  const handleEdit = (order: PurchaseOrder) => {
    setEditingId(order.id)
    setFormData({
      purchaseInvoiceNo: order.purchaseInvoiceNo || order.orderNumber || "",
      purchaseDate: order.purchaseDate || order.date || new Date().toISOString().split("T")[0],
      farmerName: order.farmerName || order.supplier || "",
      farmerMobile: order.farmerMobile || "",
      farmLocation: order.farmLocation || "",
      vehicleNo: order.vehicleNo || "",
      purchaseType: order.purchaseType || "Paid",
      notes: order.notes || "",
      birdType: order.birdType || "",
      numberOfCages: order.numberOfCages?.toString() || order.cageQuantity?.toString() || "",
      ratePerKg: order.ratePerKg?.toString() || order.unitCost?.toString() || "",
      averageWeight: order.averageWeight?.toString() || "",
      totalWeight: order.totalWeight?.toString() || "",
      totalAmount: order.totalAmount?.toString() || order.totalValue?.toString() || "",
      transportCharges: order.transportCharges?.toString() || "",
      loadingCharges: order.loadingCharges?.toString() || "",
      commission: order.commission?.toString() || "",
      otherCharges: order.otherCharges?.toString() || "",
      deductions: order.deductions?.toString() || "",
      totalInvoice: order.totalInvoice?.toString() || "",
      advancePaid: order.advancePaid?.toString() || "",
      outstandingPayment: order.outstandingPayment?.toString() || "",
      paymentMode: order.paymentMode || "",
      totalPaymentMade: order.totalPaymentMade?.toString() || "",
      balanceAmount: order.balanceAmount?.toString() || "",
      dueDate: order.dueDate || "",
    })
    setShowDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      const updated = orders.filter((order) => order.id !== id)
      setOrders(updated)
      localStorage.setItem("purchases", JSON.stringify(updated))
    }
  }

  const handleView = (order: PurchaseOrder) => {
    setViewingOrder(order)
    setShowViewDialog(true)
  }

  // Filter orders based on date range and search
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.purchaseDate || order.date || "")
        orderDate.setHours(0, 0, 0, 0)
        return orderDate >= start && orderDate <= end
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (order) =>
          (order.purchaseInvoiceNo || order.orderNumber || "").toLowerCase().includes(query) ||
          (order.farmerName || order.supplier || "").toLowerCase().includes(query) ||
          (order.farmerMobile || "").toLowerCase().includes(query),
      )
    }

    return filtered
  }, [orders, dateRangeStart, dateRangeEnd, searchQuery])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const handleDownloadPDF = () => {
    const filtered = filteredOrders
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Orders Report</title>
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
            <h1>Purchase Orders List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Orders:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Purchase Invoice No.</th>
                <th>Farmer Name</th>
                <th>Order Date</th>
                <th>Rate per Kg</th>
                <th>Cage Qty</th>
                <th>Bird Qty</th>
                <th>Average Bird Weight (Kg)</th>
                <th>Total Value</th>
                <th>Purchase Payment</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(order => `
                <tr>
                  <td>${order.purchaseInvoiceNo || order.orderNumber || "N/A"}</td>
                  <td>${order.farmerName || order.supplier || "N/A"}</td>
                  <td>${order.purchaseDate || order.date || "N/A"}</td>
                  <td>₹${(order.ratePerKg || order.unitCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${(order.numberOfCages || order.cageQuantity || 0).toLocaleString()}</td>
                  <td>${(order.numberOfBirds || order.birdQuantity || 0).toLocaleString()}</td>
                  <td>${(order.averageWeight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>₹${(order.totalAmount || order.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${order.purchaseType || "Paid"}</td>
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

  const handlePrintReport = () => {
    const filtered = filteredOrders
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Orders Report</title>
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
            <h1>Purchase Orders List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Orders:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Purchase Invoice No.</th>
                <th>Farmer Name</th>
                <th>Order Date</th>
                <th>Rate per Kg</th>
                <th>Cage Qty</th>
                <th>Bird Qty</th>
                <th>Average Bird Weight (Kg)</th>
                <th>Total Value</th>
                <th>Purchase Payment</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(order => `
                <tr>
                  <td>${order.purchaseInvoiceNo || order.orderNumber || "N/A"}</td>
                  <td>${order.farmerName || order.supplier || "N/A"}</td>
                  <td>${order.purchaseDate || order.date || "N/A"}</td>
                  <td>₹${(order.ratePerKg || order.unitCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${(order.numberOfCages || order.cageQuantity || 0).toLocaleString()}</td>
                  <td>${(order.numberOfBirds || order.birdQuantity || 0).toLocaleString()}</td>
                  <td>${(order.averageWeight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>₹${(order.totalAmount || order.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>${order.purchaseType || "Paid"}</td>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "picked up":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancel":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status: string) => {
    return status === "picked up" ? "Picked Up" : status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage supplier orders and deliveries</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Purchase Order" : "Create Purchase Order"}</DialogTitle>
                <DialogDescription>Enter purchase order details</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Section 1: Header Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Section 1: Header Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                        <Label>Purchase Invoice No. *</Label>
                    <Input
                          value={formData.purchaseInvoiceNo}
                          onChange={(e) => setFormData({ ...formData, purchaseInvoiceNo: e.target.value })}
                          placeholder="Enter invoice number"
                    />
                  </div>
                  <div className="space-y-2">
                        <Label>Purchase Date *</Label>
                    <Input
                      type="date"
                          value={formData.purchaseDate}
                          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Farmer Name *</Label>
                        <Select
                          value={formData.farmerName}
                          onValueChange={(value) => setFormData({ ...formData, farmerName: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select farmer" />
                          </SelectTrigger>
                          <SelectContent>
                            {farmers.length === 0 ? (
                              <SelectItem value="" disabled>No farmers available. Add farmers first.</SelectItem>
                            ) : (
                              farmers.map((farmer) => (
                                <SelectItem key={farmer.id} value={farmer.name}>
                                  {farmer.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Farmer Mobile</Label>
                        <Input
                          value={formData.farmerMobile}
                          readOnly
                          className="bg-muted"
                          placeholder="Auto-filled"
                    />
                  </div>
                  <div className="space-y-2">
                        <Label>Farm Location</Label>
                    <Input
                          value={formData.farmLocation}
                          readOnly
                          className="bg-muted"
                          placeholder="Auto-filled"
                    />
                  </div>
                  <div className="space-y-2">
                        <Label>Vehicle No</Label>
                        <Select
                          value={formData.vehicleNo}
                          onValueChange={(value) => setFormData({ ...formData, vehicleNo: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle" />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicles.length === 0 ? (
                              <SelectItem value="" disabled>No vehicles available</SelectItem>
                            ) : (
                              vehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.vehicleNumber}>
                                  {vehicle.vehicleNumber}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Purchase Payment *</Label>
                        <Select
                          value={formData.purchaseType}
                          onValueChange={(value: "Paid" | "Credit") => setFormData({ ...formData, purchaseType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                  </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Additional notes"
                          rows={3}
                        />
                      </div>
                </div>
                  </CardContent>
                </Card>

                {/* Section 2: Bird Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Section 2: Bird Details</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                            <SelectItem value="Broiler">Broiler</SelectItem>
                            <SelectItem value="Layer">Layer</SelectItem>
                            <SelectItem value="Desi">Desi</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    <div className="space-y-2">
                        <Label>Number of Cages *</Label>
                      <Input
                          type="number"
                          value={formData.numberOfCages}
                          onChange={(e) => setFormData({ ...formData, numberOfCages: e.target.value })}
                          placeholder="0"
                      />
                    </div>
                      <div className="space-y-2">
                        <Label>Number of Birds *</Label>
                        <Input
                          type="number"
                          value={calculatedNumberOfBirds}
                          readOnly
                          className="bg-muted"
                          placeholder="Auto-calculated"
                        />
                      </div>
                    <div className="space-y-2">
                        <Label>Rate per Kg *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.ratePerKg}
                          onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Average Bird Weight (Kg)</Label>
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
                          type="text"
                          value={formData.totalWeight ? `${formData.totalWeight} Kg` : ""}
                          readOnly
                          className="bg-muted font-semibold"
                          placeholder="Auto-calculated"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Amount</Label>
                        <Input
                          type="text"
                          value={formData.totalAmount ? `₹${Number.parseFloat(formData.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                          readOnly
                          className="bg-muted font-semibold"
                          placeholder="Auto-calculated"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 3: Charges */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Section 3: Charges</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                {/* Section 4: Payment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Section 4: Payment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Total Invoice</Label>
                        <Input
                          type="text"
                          value={formData.totalInvoice ? `₹${Number.parseFloat(formData.totalInvoice).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                          readOnly
                          className="bg-muted font-semibold"
                          placeholder="Auto-calculated"
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
                        <Label>Outstanding Payment</Label>
                        <Input
                          type="text"
                          value={formData.outstandingPayment ? `₹${Number.parseFloat(formData.outstandingPayment).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                          readOnly
                          className="bg-muted font-semibold"
                          placeholder="Auto-calculated"
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
                        <Label>Total Payment Made</Label>
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
                          type="text"
                          value={formData.balanceAmount ? `₹${Number.parseFloat(formData.balanceAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                          readOnly
                          className="bg-muted font-semibold"
                          placeholder="Auto-calculated"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingId ? "Update" : "Create"} Purchase Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total purchase (no)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredOrders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Birds Purchase (Qty)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {filteredOrders.reduce((sum, o) => sum + (o.numberOfBirds || o.birdQuantity || 0), 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value(rs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{filteredOrders.reduce((sum, o) => sum + (o.totalAmount || o.totalValue || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total payment Made (rs)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">₹{filteredOrders.reduce((sum, o) => sum + (o.totalPaymentMade || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Purchase Orders List</CardTitle>
                <CardDescription>View and manage all purchase orders</CardDescription>
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
                      placeholder="Search by invoice, farmer name or phone..."
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
                    <TableHead>Purchase Invoice No.</TableHead>
                    <TableHead>Farmer Name</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Rate per Kg</TableHead>
                    <TableHead>Cage Qty</TableHead>
                    <TableHead>Bird Qty</TableHead>
                    <TableHead>Average Bird Weight (Kg)</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Purchase Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        {searchQuery || (dateRangeStart && dateRangeEnd) ? "No purchase orders found matching your filters." : "No purchase orders found. Click \"Add New Purchase\" to create one."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow 
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(order)}
                      >
                        <TableCell className="font-medium">{order.purchaseInvoiceNo || order.orderNumber || "N/A"}</TableCell>
                        <TableCell>{order.farmerName || order.supplier || "N/A"}</TableCell>
                        <TableCell>{order.purchaseDate || order.date || "N/A"}</TableCell>
                        <TableCell>₹{(order.ratePerKg || order.unitCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{(order.numberOfCages || order.cageQuantity || 0).toLocaleString()}</TableCell>
                        <TableCell>{(order.numberOfBirds || order.birdQuantity || 0).toLocaleString()}</TableCell>
                        <TableCell>{(order.averageWeight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="font-semibold">₹{(order.totalAmount || order.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              (order.purchaseType || "Paid") === "Paid"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {order.purchaseType || "Paid"}
                        </span>
                      </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="icon" onClick={() => handleEdit(order)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(order.id)}>
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Order Details</DialogTitle>
              <DialogDescription>View complete purchase order information</DialogDescription>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-4">
                {/* Section 1: Header Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Section 1: Header Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Purchase Invoice No.</Label>
                      <div className="text-sm font-medium">{viewingOrder.purchaseInvoiceNo || viewingOrder.orderNumber || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Purchase Date</Label>
                      <div className="text-sm font-medium">{viewingOrder.purchaseDate || viewingOrder.date || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Farmer Name</Label>
                      <div className="text-sm font-medium">{viewingOrder.farmerName || viewingOrder.supplier || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Farmer Mobile</Label>
                      <div className="text-sm font-medium">{viewingOrder.farmerMobile || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Farm Location</Label>
                      <div className="text-sm font-medium">{viewingOrder.farmLocation || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Vehicle No</Label>
                      <div className="text-sm font-medium">{viewingOrder.vehicleNo || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Purchase Payment</Label>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          (viewingOrder.purchaseType || "Paid") === "Paid"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        }`}>
                          {viewingOrder.purchaseType || "Paid"}
                        </span>
                      </div>
                    </div>
                    {viewingOrder.notes && (
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-muted-foreground">Notes</Label>
                        <div className="text-sm font-medium whitespace-pre-wrap">{viewingOrder.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Bird Details */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Section 2: Bird Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Bird Type</Label>
                      <div className="text-sm font-medium">{viewingOrder.birdType || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Number of Cages</Label>
                      <div className="text-sm font-medium">{(viewingOrder.numberOfCages || viewingOrder.cageQuantity || 0).toLocaleString()}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Number of Birds</Label>
                      <div className="text-sm font-medium">{(viewingOrder.numberOfBirds || viewingOrder.birdQuantity || 0).toLocaleString()}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Rate per Kg</Label>
                      <div className="text-sm font-medium">₹{(viewingOrder.ratePerKg || viewingOrder.unitCost || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Average Bird Weight (Kg)</Label>
                      <div className="text-sm font-medium">{(viewingOrder.averageWeight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Total Weight</Label>
                      <div className="text-sm font-medium">{(viewingOrder.totalWeight || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kg</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Total Amount</Label>
                      <div className="text-sm font-medium font-semibold">₹{(viewingOrder.totalAmount || viewingOrder.totalValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Charges */}
                {(viewingOrder.transportCharges || viewingOrder.loadingCharges || viewingOrder.commission || viewingOrder.otherCharges || viewingOrder.deductions) && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-lg font-semibold">Section 3: Charges</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {viewingOrder.transportCharges && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Transport Charges</Label>
                          <div className="text-sm font-medium">₹{(viewingOrder.transportCharges || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}
                      {viewingOrder.loadingCharges && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Loading Charges</Label>
                          <div className="text-sm font-medium">₹{(viewingOrder.loadingCharges || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}
                      {viewingOrder.commission && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Commission</Label>
                          <div className="text-sm font-medium">₹{(viewingOrder.commission || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}
                      {viewingOrder.otherCharges && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Other Charges</Label>
                          <div className="text-sm font-medium">₹{(viewingOrder.otherCharges || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}
                      {viewingOrder.deductions && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Deductions</Label>
                          <div className="text-sm font-medium">₹{(viewingOrder.deductions || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 4: Payment */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Section 4: Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Total Invoice</Label>
                      <div className="text-sm font-medium font-semibold">₹{(viewingOrder.totalInvoice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Advance Paid</Label>
                      <div className="text-sm font-medium">₹{(viewingOrder.advancePaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Outstanding Payment</Label>
                      <div className="text-sm font-medium">₹{(viewingOrder.outstandingPayment || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Payment Mode</Label>
                      <div className="text-sm font-medium">{viewingOrder.paymentMode || "N/A"}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Total Payment Made</Label>
                      <div className="text-sm font-medium font-semibold">₹{(viewingOrder.totalPaymentMade || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Balance Amount</Label>
                      <div className="text-sm font-medium">₹{(viewingOrder.balanceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    {viewingOrder.dueDate && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Due Date</Label>
                        <div className="text-sm font-medium">{viewingOrder.dueDate}</div>
                      </div>
                    )}
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
