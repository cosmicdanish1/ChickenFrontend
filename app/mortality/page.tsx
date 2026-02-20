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
import { useDateFilter } from "@/contexts/date-filter-context"
import { DEMO_MODE } from "@/lib/demo-config"
import { ComingSoon } from "@/components/coming-soon"

interface Mortality {
  id: string
  recordNumber: string
  date: string
  batch: string
  numberOfBirds: number
  cause: string
  notes: string
}

export default function MortalityPage() {
  // Show Coming Soon in demo mode
  if (DEMO_MODE) {
    return (
      <DashboardLayout>
        <ComingSoon 
          title="Mortality Tracking Coming Soon" 
          description="Comprehensive mortality tracking and analysis will be available soon!"
        />
      </DashboardLayout>
    )
  }

  const [mortalities, setMortalities] = useState<Mortality[]>([])
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingMortality, setViewingMortality] = useState<Mortality | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    date: string
    batch: string
    numberOfBirds: string
    cause: string
    notes: string
  }>({
    date: new Date().toISOString().split("T")[0],
    batch: "",
    numberOfBirds: "",
    cause: "",
    notes: "",
  })
  const { startDate, endDate } = useDateFilter()

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("mortalities")
    if (saved) {
      setMortalities(JSON.parse(saved))
    } else {
      setMortalities([])
    }
  }, [])

  const handleSave = () => {
    if (!formData.date || !formData.numberOfBirds) {
      alert("Please fill all required fields")
      return
    }

    const recordNumber = editingId
      ? mortalities.find((m) => m.id === editingId)?.recordNumber
      : `MORT-${String(mortalities.length + 1).padStart(3, "0")}`

    let updatedMortalities: Mortality[]
    if (editingId) {
      updatedMortalities = mortalities.map((mortality) =>
        mortality.id === editingId
          ? {
              ...mortality,
              date: formData.date,
              batch: formData.batch,
              numberOfBirds: Number.parseInt(formData.numberOfBirds),
              cause: formData.cause,
              notes: formData.notes,
            }
          : mortality,
      )
    } else {
      updatedMortalities = [
        ...mortalities,
        {
          id: Date.now().toString(),
          recordNumber: recordNumber || "",
          date: formData.date,
          batch: formData.batch,
          numberOfBirds: Number.parseInt(formData.numberOfBirds),
          cause: formData.cause,
          notes: formData.notes,
        },
      ]
    }

    setMortalities(updatedMortalities)
    localStorage.setItem("mortalities", JSON.stringify(updatedMortalities))
    resetForm()
    setShowDialog(false)
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      batch: "",
      numberOfBirds: "",
      cause: "",
      notes: "",
    })
    setEditingId(null)
  }

  const handleEdit = (mortality: Mortality) => {
    setEditingId(mortality.id)
    setFormData({
      date: mortality.date,
      batch: mortality.batch,
      numberOfBirds: mortality.numberOfBirds.toString(),
      cause: mortality.cause,
      notes: mortality.notes,
    })
    setShowDialog(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this mortality record?")) {
      const updated = mortalities.filter((mortality) => mortality.id !== id)
      setMortalities(updated)
      localStorage.setItem("mortalities", JSON.stringify(updated))
    }
  }

  const handleView = (mortality: Mortality) => {
    setViewingMortality(mortality)
    setShowViewDialog(true)
  }

  // Filter mortalities based on date range
  const filteredMortalities = useMemo(() => {
    if (!startDate || !endDate) return mortalities

    return mortalities.filter((mortality) => {
      const mortalityDate = new Date(mortality.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      // Set time to start/end of day for proper comparison
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      mortalityDate.setHours(0, 0, 0, 0)

      return mortalityDate >= start && mortalityDate <= end
    })
  }, [mortalities, startDate, endDate])

  const totalMortalities = filteredMortalities.reduce((sum, m) => sum + m.numberOfBirds, 0)
  const totalRecords = filteredMortalities.length

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mortality Tracking</h1>
            <p className="text-muted-foreground">Record and manage bird mortality</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Record Mortality
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Mortality Record" : "Record New Mortality"}</DialogTitle>
                <DialogDescription>Enter mortality details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Batch/Group</Label>
                    <Input
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      placeholder="Batch number or group"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Birds *</Label>
                    <Input
                      type="number"
                      value={formData.numberOfBirds}
                      onChange={(e) => setFormData({ ...formData, numberOfBirds: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cause of Death</Label>
                    <Input
                      value={formData.cause}
                      onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                      placeholder="Cause of death"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Update" : "Record"} Mortality
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalRecords}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Mortalities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalMortalities}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average per Record</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalRecords > 0 ? (totalMortalities / totalRecords).toFixed(1) : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mortality Records</CardTitle>
            <CardDescription>View and manage all mortality records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Batch/Group</TableHead>
                    <TableHead>Number of Birds</TableHead>
                    <TableHead>Cause</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMortalities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No mortality records found. Click "Record Mortality" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMortalities.map((mortality) => (
                      <TableRow 
                        key={mortality.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(mortality)}
                      >
                        <TableCell className="font-medium">{mortality.recordNumber}</TableCell>
                        <TableCell>{mortality.date}</TableCell>
                        <TableCell>{mortality.batch || "N/A"}</TableCell>
                        <TableCell>{mortality.numberOfBirds}</TableCell>
                        <TableCell>{mortality.cause || "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{mortality.notes || "N/A"}</TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="icon" onClick={() => handleEdit(mortality)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(mortality.id)}>
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
              <DialogTitle>Mortality Record Details</DialogTitle>
              <DialogDescription>View complete mortality record information</DialogDescription>
            </DialogHeader>
            {viewingMortality && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Record Number</Label>
                    <div className="text-sm font-medium">{viewingMortality.recordNumber}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Date</Label>
                    <div className="text-sm font-medium">{viewingMortality.date}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Batch/Group</Label>
                    <div className="text-sm font-medium">{viewingMortality.batch || "N/A"}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Number of Birds</Label>
                    <div className="text-sm font-medium">{viewingMortality.numberOfBirds}</div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Cause of Death</Label>
                    <div className="text-sm font-medium">{viewingMortality.cause || "N/A"}</div>
                  </div>
                  {viewingMortality.notes && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-muted-foreground">Notes</Label>
                      <div className="text-sm font-medium">{viewingMortality.notes}</div>
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

