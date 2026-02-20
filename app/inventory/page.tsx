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
import { Plus, Edit2, Trash2 } from "lucide-react"
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

interface GodownItem {
  id: string
  orderNumber: string
  supplierName: string
  noOfCages: number
  noOfBirds: number
  purchaseRate: number
  totalValue: number
  lastUpdated: string
}

export default function InventoryPage() {
  // Show Coming Soon in demo mode
  if (DEMO_MODE) {
    return (
      <DashboardLayout>
        <ComingSoon 
          title="Inventory Management Coming Soon" 
          description="Complete inventory tracking with real-time stock levels and cage management will be available soon!"
        />
      </DashboardLayout>
    )
  }

  const [godownItems, setGodownItems] = useState<GodownItem[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingItem, setViewingItem] = useState<GodownItem | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    orderNumber: "",
    supplierName: "",
    noOfCages: "",
    noOfBirds: "",
    purchaseRate: "",
  })
  const { startDate, endDate } = useDateFilter()

  useEffect(() => {
    setMounted(true)
    // Load godown items from localStorage
    const saved = localStorage.getItem("godown")
    if (saved) {
      setGodownItems(JSON.parse(saved))
    } else {
      setGodownItems([])
    }

    // Load farmers for supplier dropdown
    const savedFarmers = localStorage.getItem("farmers")
    if (savedFarmers) {
      setFarmers(JSON.parse(savedFarmers))
    } else {
      // Default farmers if none exist
      setFarmers([
        {
          id: "1",
          name: "Ahmed Khan",
          email: "ahmed@example.com",
          phone: "+91 98765 43210",
          address: "Village A, District X",
          birdCount: 0,
          joinDate: "2024-01-15",
        },
        {
          id: "2",
          name: "Mohammed Ali",
          email: "mohammed@example.com",
          phone: "+91 98765 43211",
          address: "Village B, District Y",
          birdCount: 0,
          joinDate: "2024-02-20",
        },
      ])
    }
  }, [])

  // Calculate total value automatically
  const totalValue = useMemo(() => {
    const birds = Number.parseFloat(formData.noOfBirds) || 0
    const rate = Number.parseFloat(formData.purchaseRate) || 0
    return birds * rate
  }, [formData.noOfBirds, formData.purchaseRate])

  const handleSave = () => {
    if (!formData.orderNumber || !formData.supplierName || !formData.noOfCages || !formData.noOfBirds || !formData.purchaseRate) {
      alert("Please fill all required fields")
      return
    }

    const newItem: GodownItem = {
      id: editingId || Date.now().toString(),
      orderNumber: formData.orderNumber,
      supplierName: formData.supplierName,
      noOfCages: Number.parseInt(formData.noOfCages),
      noOfBirds: Number.parseInt(formData.noOfBirds),
      purchaseRate: Number.parseFloat(formData.purchaseRate),
      totalValue: totalValue,
      lastUpdated: new Date().toISOString().split("T")[0],
    }

    if (editingId) {
      const updated = godownItems.map((item) => (item.id === editingId ? newItem : item))
      setGodownItems(updated)
      localStorage.setItem("godown", JSON.stringify(updated))
    } else {
      const updated = [...godownItems, newItem]
      setGodownItems(updated)
      localStorage.setItem("godown", JSON.stringify(updated))
    }

    resetForm()
    setShowDialog(false)
  }

  const resetForm = () => {
    setFormData({
      orderNumber: "",
      supplierName: "",
      noOfCages: "",
      noOfBirds: "",
      purchaseRate: "",
    })
    setEditingId(null)
  }

  const handleEdit = (item: GodownItem) => {
    setEditingId(item.id)
    setFormData({
      orderNumber: item.orderNumber,
      supplierName: item.supplierName,
      noOfCages: item.noOfCages.toString(),
      noOfBirds: item.noOfBirds.toString(),
      purchaseRate: item.purchaseRate.toString(),
    })
    setShowDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updated = godownItems.filter((item) => item.id !== id)
      setGodownItems(updated)
      localStorage.setItem("godown", JSON.stringify(updated))
    }
  }

  const handleView = (item: GodownItem) => {
    setViewingItem(item)
    setShowViewDialog(true)
  }

  // Filter godown items based on date range
  const filteredItems = useMemo(() => {
    if (!startDate || !endDate) return godownItems

    return godownItems.filter((item) => {
      const itemDate = new Date(item.lastUpdated)
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      itemDate.setHours(0, 0, 0, 0)

      return itemDate >= start && itemDate <= end
    })
  }, [godownItems, startDate, endDate])

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Godown Management</h1>
            <p className="text-muted-foreground">Track birds, cages, and purchases</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Item" : "Add New Item"}</DialogTitle>
                <DialogDescription>Enter godown details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Order # *</Label>
                  <Input
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    placeholder="e.g., ORD-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Name *</Label>
                  <Select
                    value={formData.supplierName}
                    onValueChange={(value) => setFormData({ ...formData, supplierName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>No of Cage # *</Label>
                    <Input
                      type="number"
                      value={formData.noOfCages}
                      onChange={(e) => setFormData({ ...formData, noOfCages: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>No of Birds # *</Label>
                    <Input
                      type="number"
                      value={formData.noOfBirds}
                      onChange={(e) => setFormData({ ...formData, noOfBirds: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Purchase Rate # *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.purchaseRate}
                    onChange={(e) => setFormData({ ...formData, purchaseRate: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Value</Label>
                  <Input
                    type="text"
                    value={`₹${totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    readOnly
                    className="bg-muted font-semibold"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated: No of Birds × Purchase Rate
                  </p>
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Update" : "Add"} Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Godown Items</CardTitle>
            <CardDescription>Manage all godown items and inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>No of Cages</TableHead>
                    <TableHead>No of Birds</TableHead>
                    <TableHead>Purchase Rate</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No items found. Click "Add Item" to add new godown entries.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow 
                        key={item.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(item)}
                      >
                        <TableCell className="font-medium">{item.orderNumber}</TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.noOfCages.toLocaleString()}</TableCell>
                        <TableCell>{item.noOfBirds.toLocaleString()}</TableCell>
                        <TableCell>₹{item.purchaseRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="font-semibold">₹{item.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.lastUpdated}</TableCell>
                      <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)}>
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
              <DialogTitle>Godown Item Details</DialogTitle>
              <DialogDescription>View complete item information</DialogDescription>
            </DialogHeader>
            {viewingItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Order Number</Label>
                    <div className="text-sm font-medium">{viewingItem.orderNumber}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Supplier Name</Label>
                    <div className="text-sm font-medium">{viewingItem.supplierName}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Number of Cages</Label>
                    <div className="text-sm font-medium">{viewingItem.noOfCages.toLocaleString()}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Number of Birds</Label>
                    <div className="text-sm font-medium">{viewingItem.noOfBirds.toLocaleString()}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Purchase Rate</Label>
                    <div className="text-sm font-medium">₹{viewingItem.purchaseRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Total Value</Label>
                    <div className="text-sm font-medium font-semibold">₹{viewingItem.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <div className="text-sm font-medium">{viewingItem.lastUpdated}</div>
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
