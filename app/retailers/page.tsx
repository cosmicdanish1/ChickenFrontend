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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search, X, Download, Printer } from "lucide-react"
import { DateRangeFilter } from "@/components/date-range-filter"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface Retailer {
  id: string
  shopName: string
  ownerName: string
  email: string
  phone: string
  address: string
  totalPurchases: number
  lastOrder: string
  joinDate: string
  status: "active" | "inactive"
  note?: string
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingRetailer, setViewingRetailer] = useState<Retailer | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRangeStart, setDateRangeStart] = useState<Date | undefined>(undefined)
  const [dateRangeEnd, setDateRangeEnd] = useState<Date | undefined>(undefined)
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "active" as "active" | "inactive",
    note: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchRetailers()
  }, [])

  const fetchRetailers = async () => {
    try {
      setLoading(true)
      const data = await api.getRetailers()
      // Map backend data to frontend format
      const mappedRetailers = data.map((retailer: any) => ({
        id: retailer.id,
        shopName: retailer.name,
        ownerName: retailer.ownerName || "",
        email: retailer.email || "",
        phone: retailer.phone || "",
        address: retailer.address || "",
        totalPurchases: 0,
        lastOrder: retailer.createdAt ? new Date(retailer.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        joinDate: retailer.createdAt ? new Date(retailer.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        status: retailer.status || "active" as "active" | "inactive",
        note: retailer.notes || "",
      }))
      setRetailers(mappedRetailers)
    } catch (error) {
      console.error('Failed to fetch retailers:', error)
      toast.error('Failed to load retailers')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.shopName || !formData.ownerName || !formData.phone) {
      toast.error("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      if (editingId) {
        await api.updateRetailer(editingId, {
          name: formData.shopName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          address: formData.address,
          notes: formData.note,
          status: formData.status,
        })
        toast.success("Retailer updated successfully")
      } else {
        await api.createRetailer({
          name: formData.shopName,
          ownerName: formData.ownerName,
          phone: formData.phone,
          address: formData.address,
          notes: formData.note,
          status: formData.status,
        })
        toast.success("Retailer created successfully")
      }
      await fetchRetailers()
      resetForm()
      setShowDialog(false)
    } catch (error) {
      console.error('Failed to save retailer:', error)
      toast.error(editingId ? 'Failed to update retailer' : 'Failed to create retailer')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      shopName: "",
      ownerName: "",
      phone: "",
      address: "",
      joinDate: new Date().toISOString().split("T")[0],
      status: "active" as "active" | "inactive",
      note: "",
    })
    setEditingId(null)
  }

  const handleEdit = (retailer: Retailer) => {
    setEditingId(retailer.id)
    setFormData({
      shopName: retailer.shopName,
      ownerName: retailer.ownerName,
      phone: retailer.phone,
      address: retailer.address,
      joinDate: retailer.joinDate || new Date().toISOString().split("T")[0],
      status: retailer.status || "active",
      note: retailer.note || "",
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this retailer?")) {
      try {
        setLoading(true)
        await api.deleteRetailer(id)
        toast.success("Retailer deleted successfully")
        await fetchRetailers()
      } catch (error) {
        console.error('Failed to delete retailer:', error)
        toast.error('Failed to delete retailer')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleView = (retailer: Retailer) => {
    setViewingRetailer(retailer)
    setShowViewDialog(true)
  }

  const handleSort = () => {
    if (sortOrder === null) {
      setSortOrder("asc")
    } else if (sortOrder === "asc") {
      setSortOrder("desc")
    } else {
      setSortOrder(null)
    }
  }

  const getFilteredAndSortedRetailers = () => {
    let filtered = retailers

    // Apply date range filter
    if (dateRangeStart && dateRangeEnd) {
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      filtered = filtered.filter((retailer) => {
        if (!retailer.joinDate) return false
        const joinDate = new Date(retailer.joinDate)
        joinDate.setHours(0, 0, 0, 0)
        return joinDate >= start && joinDate <= end
      })
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (retailer) =>
          retailer.shopName.toLowerCase().includes(query) ||
          retailer.ownerName.toLowerCase().includes(query) ||
          (retailer.phone && retailer.phone.toLowerCase().includes(query)),
      )
    }

    // Apply sorting
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const nameA = a.shopName.toLowerCase()
        const nameB = b.shopName.toLowerCase()
        if (sortOrder === "asc") {
          return nameA.localeCompare(nameB)
        } else {
          return nameB.localeCompare(nameA)
        }
      })
    }

    return filtered
  }

  const filteredRetailers = useMemo(() => getFilteredAndSortedRetailers(), [retailers, dateRangeStart, dateRangeEnd, searchQuery, sortOrder])

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setDateRangeStart(start)
    setDateRangeEnd(end)
  }

  const handleDownloadPDF = () => {
    const filtered = getFilteredAndSortedRetailers()
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Retailers Report</title>
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
            <h1>Retailers List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Retailers:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Owner Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(retailer => `
                <tr>
                  <td>${retailer.shopName}</td>
                  <td>${retailer.ownerName}</td>
                  <td>${retailer.phone}</td>
                  <td>${retailer.address || "N/A"}</td>
                  <td>${retailer.joinDate || "N/A"}</td>
                  <td>${(retailer.status || "active") === "active" ? "Active" : "Inactive"}</td>
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
    const filtered = getFilteredAndSortedRetailers()
    
    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Retailers Report</title>
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
            <h1>Retailers List Report</h1>
            ${dateRangeStart && dateRangeEnd ? `<div class="date-range"><strong>Date Range:</strong> ${dateRangeStart.toLocaleDateString()} - ${dateRangeEnd.toLocaleDateString()}</div>` : ''}
            <div><strong>Total Retailers:</strong> ${filtered.length}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Shop Name</th>
                <th>Owner Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Join Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(retailer => `
                <tr>
                  <td>${retailer.shopName}</td>
                  <td>${retailer.ownerName}</td>
                  <td>${retailer.phone}</td>
                  <td>${retailer.address || "N/A"}</td>
                  <td>${retailer.joinDate || "N/A"}</td>
                  <td>${(retailer.status || "active") === "active" ? "Active" : "Inactive"}</td>
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

  if (!mounted) return null

  return (
    <DashboardLayout>
    <div className="space-y-6">
        <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold">Retailers Management</h1>
            <p className="text-muted-foreground">Manage all retailers and their information</p>
        </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add New Retailer
        </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Retailer" : "Add New Retailer"}</DialogTitle>
                <DialogDescription>Enter retailer details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shop Name *</Label>
                  <Input
                    value={formData.shopName}
                    onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      placeholder="Shop name"
                  />
                </div>
                  <div className="space-y-2">
                    <Label>Owner Name *</Label>
                  <Input
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      placeholder="Owner name"
                  />
                </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                  <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                  />
                </div>
                  <div className="space-y-2">
                    <Label>Join Date *</Label>
                  <Input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  />
                </div>
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Shop address"
                  />
                </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Note</Label>
                    <Textarea
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Additional notes about the retailer"
                      rows={3}
                    />
                  </div>
              </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Update" : "Add"} Retailer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Retailers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{retailers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Retailers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {retailers.filter((r) => (r.status || "active") === "active").length}
              </div>
          </CardContent>
        </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Retailers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {retailers.filter((r) => (r.status || "active") === "inactive").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Retailers List</CardTitle>
                <CardDescription>View and manage all retailers</CardDescription>
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
                      placeholder="Search by shop name or phone..."
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
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 lg:px-3"
                        onClick={handleSort}
                      >
                        Shop Name
                        {sortOrder === null && <ArrowUpDown className="ml-2 h-4 w-4" />}
                        {sortOrder === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
                        {sortOrder === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRetailers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {searchQuery || (dateRangeStart && dateRangeEnd) ? "No retailers found matching your filters." : "No retailers added yet. Click \"Add New Retailer\" to get started."}
                      </TableCell>
                    </TableRow>
        ) : (
          filteredRetailers.map((retailer) => (
                      <TableRow 
                        key={retailer.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(retailer)}
                      >
                        <TableCell className="font-medium">{retailer.shopName}</TableCell>
                        <TableCell>{retailer.ownerName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{retailer.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{retailer.address || "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{retailer.joinDate || "N/A"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (retailer.status || "active") === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {(retailer.status || "active") === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="icon" onClick={() => handleEdit(retailer)}>
                            <Edit2 size={16} />
                    </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(retailer.id)}>
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
              <DialogTitle>Retailer Details</DialogTitle>
              <DialogDescription>View complete retailer information</DialogDescription>
            </DialogHeader>
            {viewingRetailer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Shop Name</Label>
                    <div className="text-sm font-medium">{viewingRetailer.shopName}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Owner Name</Label>
                    <div className="text-sm font-medium">{viewingRetailer.ownerName}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <div className="text-sm font-medium">{viewingRetailer.phone}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Join Date</Label>
                    <div className="text-sm font-medium">{viewingRetailer.joinDate || "N/A"}</div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Address</Label>
                    <div className="text-sm font-medium">{viewingRetailer.address || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        viewingRetailer.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {viewingRetailer.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {viewingRetailer.note && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Note</Label>
                      <div className="text-sm font-medium whitespace-pre-wrap">{viewingRetailer.note}</div>
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
