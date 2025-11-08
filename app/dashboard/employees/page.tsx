"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Filter, Edit, Trash2, Eye, Users, UserCheck, UserX } from "lucide-react"
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
interface Employee {
  id: string
  name: string
  email: string
  phone: string
  role: 'admin' | 'technician' | 'sales' | 'support'
  department: string
  hireDate: string
  status: 'active' | 'inactive' | 'on_leave'
  salary?: number
  address?: string
  emergencyContact?: string
  notes?: string
  createdAt: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Mock data for development
  useEffect(() => {
    setTimeout(() => {
      setEmployees([
        {
          id: "1",
          name: "John Smith",
          email: "john.smith@isp.com",
          phone: "+1-555-0101",
          role: "admin",
          department: "Management",
          hireDate: "2023-01-15",
          status: "active",
          salary: 75000,
          address: "123 Main St, City, State 12345",
          emergencyContact: "Jane Smith - +1-555-0102",
          createdAt: "2023-01-15"
        },
        {
          id: "2",
          name: "Sarah Johnson",
          email: "sarah.johnson@isp.com",
          phone: "+1-555-0103",
          role: "technician",
          department: "Technical Support",
          hireDate: "2023-03-20",
          status: "active",
          salary: 55000,
          address: "456 Oak Ave, City, State 12345",
          emergencyContact: "Mike Johnson - +1-555-0104",
          createdAt: "2023-03-20"
        },
        {
          id: "3",
          name: "Mike Wilson",
          email: "mike.wilson@isp.com",
          phone: "+1-555-0105",
          role: "technician",
          department: "Field Operations",
          hireDate: "2023-06-10",
          status: "active",
          salary: 52000,
          address: "789 Pine Rd, City, State 12345",
          emergencyContact: "Lisa Wilson - +1-555-0106",
          createdAt: "2023-06-10"
        },
        {
          id: "4",
          name: "Emily Davis",
          email: "emily.davis@isp.com",
          phone: "+1-555-0107",
          role: "sales",
          department: "Sales",
          hireDate: "2023-09-01",
          status: "active",
          salary: 48000,
          address: "321 Elm St, City, State 12345",
          emergencyContact: "Robert Davis - +1-555-0108",
          createdAt: "2023-09-01"
        },
        {
          id: "5",
          name: "Robert Brown",
          email: "robert.brown@isp.com",
          phone: "+1-555-0109",
          role: "support",
          department: "Customer Service",
          hireDate: "2023-11-15",
          status: "on_leave",
          salary: 42000,
          address: "654 Maple Dr, City, State 12345",
          emergencyContact: "Mary Brown - +1-555-0110",
          createdAt: "2023-11-15"
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === "all" || employee.role === roleFilter
    const matchesDepartment = departmentFilter === "all" || employee.department.toLowerCase().includes(departmentFilter.toLowerCase())
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus
  })

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      technician: "bg-blue-100 text-blue-800",
      sales: "bg-green-100 text-green-800",
      support: "bg-yellow-100 text-yellow-800"
    }

    return (
      <Badge className={colors[role as keyof typeof colors]}>
        {role.toUpperCase()}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      on_leave: "outline"
    } as const

    const icons = {
      active: <UserCheck className="h-3 w-3" />,
      inactive: <UserX className="h-3 w-3" />,
      on_leave: <UserX className="h-3 w-3" />
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]} className="flex items-center space-x-1">
        {icons[status as keyof typeof icons]}
        <span>{status.replace('_', ' ').toUpperCase()}</span>
      </Badge>
    )
  }

  const getDepartments = () => {
    const departments = [...new Set(employees.map(emp => emp.department))]
    return departments
  }

  const toggleEmployeeStatus = async (employeeId: string, currentStatus: string) => {
    // TODO: Implement actual API call
    const newStatus = currentStatus === "active" ? "inactive" : "active"

    setEmployees(prev => prev.map(employee =>
      employee.id === employeeId ? { ...employee, status: newStatus as any } : employee
    ))

    toast.success(`Employee ${newStatus === "active" ? "activated" : "deactivated"} successfully`)
  }

  const deleteEmployee = async (employeeId: string) => {
    // TODO: Implement actual API call
    setEmployees(prev => prev.filter(employee => employee.id !== employeeId))
    toast.success("Employee deleted successfully")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    )
  }

  const totalPayroll = employees
    .filter(emp => emp.status === 'active' && emp.salary)
    .reduce((sum, emp) => sum + (emp.salary || 0), 0)

  const activeEmployees = employees.filter(emp => emp.status === 'active')
  const adminCount = employees.filter(emp => emp.role === 'admin' && emp.status === 'active').length

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <div className="flex items-center space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>
                  Add a new employee to your team.
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
                  <label htmlFor="email" className="text-right">
                    Email
                  </label>
                  <Input id="email" type="email" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="phone" className="text-right">
                    Phone
                  </label>
                  <Input id="phone" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="role" className="text-right">
                    Role
                  </label>
                  <Select>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="department" className="text-right">
                    Department
                  </label>
                  <Input id="department" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Employee</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalPayroll / 12).toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
          <CardDescription>
            Manage your team, roles, and employee information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getDepartments().map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          {employee.address && (
                            <div className="text-sm text-muted-foreground">{employee.address}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{employee.email}</div>
                          <div className="text-sm text-muted-foreground">{employee.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(employee.role)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{employee.department}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(employee.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(employee.hireDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {employee.salary ? (
                          <div>
                            <div className="font-medium">${employee.salary.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">per year</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/employees/${employee.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/employees/${employee.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEmployeeStatus(employee.id, employee.status)}
                          >
                            {employee.status === 'active' ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEmployee(employee.id)}
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