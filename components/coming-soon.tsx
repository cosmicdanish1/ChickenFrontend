"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getDemoMessage } from "@/lib/demo-config"

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Construction className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-3xl">{title}</CardTitle>
          <CardDescription className="text-lg mt-2">
            {description || getDemoMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            This feature is fully developed and will be available in the production release.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Link href="/users">
              <Button variant="default">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Users
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline">
                Go to Settings
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
