"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ComingSoon } from "@/components/coming-soon"
import { DEMO_MODE } from "@/lib/demo-config"

export function InventoryDemoWrapper({ children }: { children: React.ReactNode }) {
  if (DEMO_MODE) {
    return (
      <DashboardLayout>
        <ComingSoon 
          title="Inventory Management Coming Soon" 
          description="Complete inventory tracking with real-time stock levels will be available soon!"
        />
      </DashboardLayout>
    )
  }
  
  return <>{children}</>
}
