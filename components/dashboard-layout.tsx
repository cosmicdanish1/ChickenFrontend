"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Home,
  Settings,
  ChevronDown,
  Users2,
  Calculator,
  Truck,
  AlertCircle,
} from "lucide-react"
import { DateRangeFilter } from "@/components/date-range-filter"
import { useDateFilter } from "@/contexts/date-filter-context"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DEMO_MODE, isFeatureAvailable } from "@/lib/demo-config"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [masterEntriesOpen, setMasterEntriesOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col`}
        >
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              {sidebarOpen && <h1 className="text-xl font-bold text-sidebar-foreground">🐔 Aziz Poultry</h1>}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-sidebar-foreground"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
            {/* Show Dashboard only if not in demo mode */}
            {!DEMO_MODE && <SidebarLink href="/dashboard" icon={Home} label="Dashboard" open={sidebarOpen} />}
            
            {/* Hidden features in demo mode */}
            {!DEMO_MODE && (
              <>
                <SidebarLink href="/inventory" icon={Package} label="Godown" open={sidebarOpen} />
                <SidebarLink href="/purchases" icon={ShoppingCart} label="Purchases" open={sidebarOpen} />
                <SidebarLink href="/sales" icon={TrendingUp} label="Sales" open={sidebarOpen} />
                <SidebarLink href="/mortality" icon={AlertCircle} label="Mortality" open={sidebarOpen} />
                <SidebarLink href="/expenses" icon={BarChart3} label="Expenses" open={sidebarOpen} />
                <SidebarLink href="/reports" icon={BarChart3} label="Reports" open={sidebarOpen} />
                <SidebarLink href="/financial-analytics" icon={Calculator} label="Financial Analytics" open={sidebarOpen} />
              </>
            )}

            {/* Master Entries - Always visible */}
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setMasterEntriesOpen(!masterEntriesOpen)}
              >
                <Users2 size={20} />
                {sidebarOpen && (
                  <>
                    <span className="ml-2 flex-1 text-left">Masters</span>
                    <ChevronDown size={16} className={`transition-transform ${masterEntriesOpen ? "rotate-180" : ""}`} />
                  </>
                )}
              </Button>

              {masterEntriesOpen && sidebarOpen && (
                <div className="ml-4 space-y-1 border-l border-sidebar-border">
                  <SidebarLink href="/farmers" icon={Users} label="Farmers" open={true} isSubItem={true} />
                  <SidebarLink href="/retailers" icon={Users} label="Retailers" open={true} isSubItem={true} />
                  <SidebarLink href="/vehicles" icon={Truck} label="Vehicles" open={true} isSubItem={true} />
                </div>
              )}
            </div>

            {/* Users - Always visible */}
            <SidebarLink href="/users" icon={Users} label="Users" open={sidebarOpen} />
            
            {/* Settings - Always visible */}
            <SidebarLink href="/settings" icon={Settings} label="Settings" open={sidebarOpen} />
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              {sidebarOpen && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center">
            <h2 className="text-sm text-muted-foreground">Welcome, {user?.name || user?.email}</h2>
            <div className="flex items-center gap-4">
              <DateFilterHeader />
              <div className="text-sm text-muted-foreground">Role: {user?.role}</div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto bg-background">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  open,
  isSubItem = false,
}: {
  href: string
  icon: React.ComponentType<{ size: number }>
  label: string
  open: boolean
  isSubItem?: boolean
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent ${isSubItem ? "pl-8 text-sm" : ""}`}
      >
        <Icon size={20} />
        {open && <span className="ml-2">{label}</span>}
      </Button>
    </Link>
  )
}

function DateFilterHeader() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show date filter only on specific pages
  const showDateFilter = [
    "/inventory",
    "/purchases",
    "/sales",
    "/mortality",
    "/expenses",
  ].includes(pathname)

  if (!showDateFilter || !mounted) return null

  return <DateFilterHeaderContent />
}

function DateFilterHeaderContent() {
  const { startDate, endDate, setDateRange } = useDateFilter()

  return (
    <DateRangeFilter
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={setDateRange}
    />
  )
}