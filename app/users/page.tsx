"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit2, ArrowUpDown, ArrowUp, ArrowDown, Search, X, UserCheck, UserX, Eye } from "lucide-react"
import { api, User, UserStatistics } from "@/lib/api"
import { toast } from "sonner"

interface UserFormData {
  name: string
  email: string
  password: string
  role: "admin" | "manager" | "staff"
  status: "active" | "inactive"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchFilter, setShowSearchFilter] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "manager",
    status: "active",
  })

  useEffect(() => {
    setMounted(true)
    loadUsers()
    loadStatistics()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      console.log('Loading users...');
      const data = await api.getUsers()
      console.log('Users loaded:', data.length, 'users');
      console.log('User statuses:', data.map(u => ({ id: u.id, name: u.name, status: u.status })));
      setUsers(data)
    } catch (error) {
      console.error("Error loading users:", error)
      toast.error("Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const data = await api.getUserStatistics()
      setStatistics(data)
    } catch (error) {
      console.error("Error loading statistics:", error)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill all required fields")
      return
    }

    if (!editingId && !formData.password) {
      toast.error("Password is required for new users")
      return
    }

    if (formData.password && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    try {
      if (editingId) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
        }
        if (formData.password) {
          updateData.password = formData.password
        }
        await api.updateUser(editingId, updateData)
        toast.success("User updated successfully")
      } else {
        await api.createUser(formData)
        toast.success("User created successfully")
      }
      
      await loadUsers()
      await loadStatistics()
      resetForm()
      setShowDialog(false)
    } catch (error) {
      console.error("Error saving user:", error)
      toast.error("Failed to save user")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "manager",
      status: "active",
    })
    setEditingId(null)
  }

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
    })
    setShowDialog(true)
  }

  const handleToggleStatus = async (user: User) => {
    try {
      console.log('Toggling status for user:', user.id, 'Current status:', user.status);
      
      if (user.status === "active") {
        const result = await api.deactivateUser(user.id)
        console.log('Deactivate result:', result);
        toast.success("User deactivated successfully")
      } else {
        const result = await api.activateUser(user.id)
        console.log('Activate result:', result);
        toast.success("User activated successfully")
      }
      
      // Reload data
      await loadUsers()
      await loadStatistics()
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || error.message || "Failed to update user status")
    }
  }

  const handleView = (user: User) => {
    setViewingUser(user)
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

  const getFilteredAndSortedUsers = () => {
    let filtered = users

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    // Apply sorting
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        if (sortOrder === "asc") {
          return nameA.localeCompare(nameB)
        } else {
          return nameB.localeCompare(nameA)
        }
      })
    }

    return filtered
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "manager":
        return "bg-blue-100 text-blue-800"
      case "staff":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800"
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage system users and their roles</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2" size={20} />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogDescription>Enter user details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password {editingId ? "(leave blank to keep current)" : "*"}</Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: any) => setFormData({ ...formData, status: value })}
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
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingId ? "Update" : "Create"} User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? "..." : statistics?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {loading ? "..." : statistics?.activeUsers || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {loading ? "..." : statistics?.inactiveUsers || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {loading ? "..." : statistics?.adminUsers || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {loading ? "..." : statistics?.managerUsers || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {loading ? "..." : statistics?.staffUsers || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Users List</CardTitle>
                <CardDescription>View and manage all system users</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {showSearchFilter && (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSearchQuery("")
                        setRoleFilter("all")
                        setStatusFilter("all")
                        setShowSearchFilter(false)
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
                {!showSearchFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSearchFilter(true)}
                  >
                    <Search className="mr-2" size={16} />
                    Filter
                  </Button>
                )}
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
                        Name
                        {sortOrder === null && <ArrowUpDown className="ml-2 h-4 w-4" />}
                        {sortOrder === "asc" && <ArrowUp className="ml-2 h-4 w-4" />}
                        {sortOrder === "desc" && <ArrowDown className="ml-2 h-4 w-4" />}
                      </Button>
                    </TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : getFilteredAndSortedUsers().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                          ? "No users found matching your filters."
                          : "No users added yet. Click \"Add User\" to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredAndSortedUsers().map((user) => (
                      <TableRow 
                        key={user.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleView(user)}
                      >
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.joinDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="icon" onClick={() => handleEdit(user)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleStatus(user)}
                            title={user.status === "active" ? "Deactivate user" : "Activate user"}
                          >
                            {user.status === "active" ? <UserX size={16} /> : <UserCheck size={16} />}
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
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View complete user information</DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Name</Label>
                    <div className="text-sm font-medium">{viewingUser.name}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <div className="text-sm font-medium">{viewingUser.email}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Role</Label>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(viewingUser.role)}`}>
                        {viewingUser.role.charAt(0).toUpperCase() + viewingUser.role.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(viewingUser.status)}`}>
                        {viewingUser.status.charAt(0).toUpperCase() + viewingUser.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Join Date</Label>
                    <div className="text-sm font-medium">
                      {new Date(viewingUser.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Last Login</Label>
                    <div className="text-sm font-medium">
                      {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : "Never"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">User ID</Label>
                    <div className="text-sm font-medium font-mono">{viewingUser.id}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Created At</Label>
                    <div className="text-sm font-medium">
                      {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString() : "N/A"}
                    </div>
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
