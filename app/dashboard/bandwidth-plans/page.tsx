"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Edit, Trash2, Eye, Gauge, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

// Types
interface BandwidthPlan {
  id: string
  name: string
  downloadSpeed: number
  uploadSpeed: number
  price: number
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function BandwidthPlansPage() {
  const [plans, setPlans] = useState<BandwidthPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Mock data for development
  useEffect(() => {
    setTimeout(() => {
      setPlans([
        {
          id: "1",
          name: "Basic Plan",
          downloadSpeed: 10,
          uploadSpeed: 5,
          price: 29.99,
          description: "Perfect for light browsing and email",
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "2",
          name: "Standard Plan",
          downloadSpeed: 50,
          uploadSpeed: 25,
          price: 49.99,
          description: "Great for streaming and moderate usage",
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "3",
          name: "Premium Plan",
          downloadSpeed: 100,
          uploadSpeed: 50,
          price: 79.99,
          description: "Ideal for heavy users and multiple devices",
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "4",
          name: "Business Plan",
          downloadSpeed: 500,
          uploadSpeed: 250,
          price: 199.99,
          description: "High-speed connection for businesses",
          isActive: true,
          createdAt: "2024-01-01",
          updatedAt: "2024-01-01"
        },
        {
          id: "5",
          name: "Legacy Basic",
          downloadSpeed: 5,
          uploadSpeed: 2,
          price: 19.99,
          description: "Old basic plan - no longer offered",
          isActive: false,
          createdAt: "2023-06-01",
          updatedAt: "2024-01-15"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesActive = showInactive || plan.isActive

    return matchesSearch && matchesActive
  })

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    // TODO: Implement actual API call
    setPlans(prev => prev.map(plan =>
      plan.id === planId ? { ...plan, isActive: !currentStatus } : plan
    ))

    toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
  }

  const deletePlan = async (planId: string) => {
    // TODO: Implement actual API call
    setPlans(prev => prev.filter(plan => plan.id !== planId))
    toast.success("Plan deleted successfully")
  }

  const getSpeedDisplay = (downloadSpeed: number, uploadSpeed: number) => {
    if (downloadSpeed >= 1000) {
      return `${(downloadSpeed / 1000).toFixed(1)}G/${(uploadSpeed / 1000).toFixed(1)}G`
    }
    return `${downloadSpeed}M/${uploadSpeed}M`
  }

  const getPlanTypeBadge = (downloadSpeed: number) => {
    if (downloadSpeed >= 500) {
      return <Badge variant="default">Enterprise</Badge>
    } else if (downloadSpeed >= 100) {
      return <Badge variant="secondary">Premium</Badge>
    } else if (downloadSpeed >= 50) {
      return <Badge variant="outline">Standard</Badge>
    } else {
      return <Badge variant="outline">Basic</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading bandwidth plans...</p>
        </div>
      </div>
    )
  }

  const activePlans = plans.filter(plan => plan.isActive)
  const totalRevenue = activePlans.reduce((sum, plan) => sum + plan.price, 0)

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Bandwidth Plans</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Bandwidth Plan</DialogTitle>
                <DialogDescription>
                  Add a new bandwidth plan to your service offerings.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right">
                    Plan Name
                  </label>
                  <Input id="name" className="col-span-3" placeholder="e.g., Standard Plan" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="download" className="text-right">
                    Download (Mbps)
                  </label>
                  <Input id="download" type="number" className="col-span-3" placeholder="50" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="upload" className="text-right">
                    Upload (Mbps)
                  </label>
                  <Input id="upload" type="number" className="col-span-3" placeholder="25" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="price" className="text-right">
                    Price ($/month)
                  </label>
                  <Input id="price" type="number" step="0.01" className="col-span-3" placeholder="49.99" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per active plan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${activePlans.length > 0 ? (totalRevenue / activePlans.length).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.filter(plan => !plan.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
          <CardDescription>
            Manage bandwidth plans, pricing, and service offerings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <label htmlFor="show-inactive" className="text-sm">
                Show Inactive Plans
              </label>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No bandwidth plans found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan.id} className={!plan.isActive ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="font-medium">{plan.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Gauge className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getSpeedDisplay(plan.downloadSpeed, plan.uploadSpeed)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${plan.price.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">per month</div>
                      </TableCell>
                      <TableCell>
                        {getPlanTypeBadge(plan.downloadSpeed)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {plan.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={plan.isActive}
                            onCheckedChange={() => togglePlanStatus(plan.id, plan.isActive)}
                          />
                          <Badge variant={plan.isActive ? "default" : "secondary"}>
                            {plan.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(plan.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/bandwidth-plans/${plan.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/bandwidth-plans/${plan.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePlan(plan.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}