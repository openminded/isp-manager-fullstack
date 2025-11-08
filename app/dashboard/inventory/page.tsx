"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Filter, Edit, Trash2, Eye, Package, AlertTriangle } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { toast } from "sonner"

// Types
interface InventoryItem {
  id: string
  name: string
  category: 'router' | 'cable' | 'antenna' | 'connector' | 'power_supply' | 'network_card' | 'other'
  description?: string
  quantity: number
  unitPrice: number
  supplier: string
  model?: string
  serialNumber?: string
  purchaseDate: string
  warrantyExpiry?: string
  status: 'in_stock' | 'deployed' | 'maintenance' | 'retired'
  location: string
  assignedClient?: {
    id: string
    name: string
  }
  createdAt: string
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Mock data for development
  useEffect(() => {
    setTimeout(() => {
      setInventory([
        {
          id: "1",
          name: "MikroTik hEX RB750Gr3",
          category: "router",
          description: "5 port Gigabit Ethernet router",
          quantity: 45,
          unitPrice: 59.99,
          supplier: "MikroTik Distributor Inc.",
          model: "RB750Gr3",
          purchaseDate: "2024-01-10",
          warrantyExpiry: "2025-01-10",
          status: "in_stock",
          location: "Warehouse A - Shelf 15",
          createdAt: "2024-01-10"
        },
        {
          id: "2",
          name: "Cat6 Ethernet Cable 100ft",
          category: "cable",
          description: "Indoor/Outdoor CAT6 network cable",
          quantity: 180,
          unitPrice: 12.99,
          supplier: "CablePro Supply",
          model: "CAT6-100FT",
          purchaseDate: "2024-02-15",
          warrantyExpiry: "2026-02-15",
          status: "in_stock",
          location: "Warehouse B - Rack 3",
          createdAt: "2024-02-15"
        },
        {
          id: "3",
          name: "WiFi 6 Access Point",
          category: "router",
          description: "Dual-band WiFi 6 access point",
          quantity: 3,
          unitPrice: 149.99,
          supplier: "NetworkGear Corp",
          model: "AP-W6-1200",
          purchaseDate: "2024-03-01",
          warrantyExpiry: "2025-03-01",
          status: "deployed",
          location: "Client Site - Office Building",
          assignedClient: {
            id: "1",
            name: "John Smith"
          },
          createdAt: "2024-03-01"
        },
        {
          id: "4",
          name: "RJ45 Connectors",
          category: "connector",
          description: "8P8C RJ45 modular connectors",
          quantity: 850,
          unitPrice: 0.25,
          supplier: "Connector Supply Co.",
          model: "RJ45-8P8C-100",
          purchaseDate: "2024-01-20",
          warrantyExpiry: "2026-01-20",
          status: "in_stock",
          location: "Warehouse C - Bin 42",
          createdAt: "2024-01-20"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    const matchesLocation = locationFilter === "all" || item.location.toLowerCase().includes(locationFilter.toLowerCase())

    return matchesSearch && matchesCategory && matchesStatus && matchesLocation
  })

  const getCategoryBadge = (category: string) => {
    const colors = {
      router: "bg-blue-100 text-blue-800",
      cable: "bg-green-100 text-green-800",
      antenna: "bg-purple-100 text-purple-800",
      connector: "bg-yellow-100 text-yellow-800",
      power_supply: "bg-red-100 text-red-800",
      network_card: "bg-indigo-100 text-indigo-800",
      other: "bg-gray-100 text-gray-800"
    }

    return (
      <Badge className={colors[category as keyof typeof colors]}>
        {category.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      in_stock: "default",
      deployed: "secondary",
      maintenance: "destructive",
      retired: "outline"
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const isLowStock = (item: InventoryItem) => {
    return item.quantity < 5 && item.status === 'in_stock'
  }

  const getLocations = () => {
    const locations = [...new Set(inventory.map(item => item.location))]
    return locations
  }

  const deleteInventoryItem = async (itemId: string) => {
    // TODO: Implement actual API call
    setInventory(prev => prev.filter(item => item.id !== itemId))
    toast.success("Inventory item deleted successfully")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const lowStockItems = inventory.filter(item => isLowStock(item))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your inventory tracking system.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right">
                    Name
                  </label>
                  <Input id="name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="category" className="text-right">
                    Category
                  </label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="cable">Cable</SelectItem>
                      <SelectItem value="antenna">Antenna</SelectItem>
                      <SelectItem value="connector">Connector</SelectItem>
                      <SelectItem value="power_supply">Power Supply</SelectItem>
                      <SelectItem value="network_card">Network Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="quantity" className="text-right">
                    Quantity
                  </label>
                  <Input id="quantity" type="number" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.reduce((sum, item) => sum + item.quantity, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.filter(item => item.status === 'deployed').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Track and manage your network equipment inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="router">Router</SelectItem>
                <SelectItem value="cable">Cable</SelectItem>
                <SelectItem value="antenna">Antenna</SelectItem>
                <SelectItem value="connector">Connector</SelectItem>
                <SelectItem value="power_supply">Power Supply</SelectItem>
                <SelectItem value="network_card">Network Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="deployed">Deployed</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {getLocations().map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.id} className={isLowStock(item) ? "bg-yellow-50" : ""}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.model && <div className="text-sm text-muted-foreground">Model: {item.model}</div>}
                          {item.serialNumber && <div className="text-xs text-muted-foreground">S/N: {item.serialNumber}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(item.category)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${isLowStock(item) ? 'text-yellow-600' : ''}`}>
                            {item.quantity}
                          </span>
                          {isLowStock(item) && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        </div>
                      </TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{item.location}</TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        {item.assignedClient ? (
                          <Link href={`/dashboard/clients/${item.assignedClient.id}`} className="text-blue-600 hover:underline">
                            {item.assignedClient.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/inventory/${item.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/inventory/${item.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteInventoryItem(item.id)}
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