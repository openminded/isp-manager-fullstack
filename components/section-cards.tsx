import { IconTrendingDown, IconTrendingUp, IconNetwork, IconPackage, IconUsers, IconGauge } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StatCardProps {
  title: string
  value: string | number
  trend?: {
    value: string
    direction: 'up' | 'down'
  }
  description: string
  icon: React.ReactNode
  href?: string
}

function StatCard({ title, value, trend, description, icon, href }: StatCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className="flex items-center gap-2">
            {icon}
            {title}
          </CardDescription>
          {trend && (
            <Badge variant="outline">
              {trend.direction === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
              {trend.value}
            </Badge>
          )}
        </div>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {description}
          {trend && (
            trend.direction === 'up' ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />
          )}
        </div>
        <div className="text-muted-foreground">
          Click to view details
        </div>
      </CardFooter>
    </Card>
  )
}

export function SectionCards() {
  // TODO: Replace with real data from API
  const stats = [
    {
      title: "Total Clients",
      value: "248",
      trend: { value: "+12.5%", direction: 'up' as const },
      description: "Growing customer base",
      icon: <IconNetwork className="size-4" />,
      href: "/dashboard/clients"
    },
    {
      title: "Monthly Revenue",
      value: "$12,450",
      trend: { value: "+8.2%", direction: 'up' as const },
      description: "Up from last month",
      icon: <IconGauge className="size-4" />,
      href: "/dashboard/analytics"
    },
    {
      title: "Inventory Items",
      value: "1,234",
      trend: { value: "+5.1%", direction: 'up' as const },
      description: "Equipment in stock",
      icon: <IconPackage className="size-4" />,
      href: "/dashboard/inventory"
    },
    {
      title: "Active Employees",
      value: "12",
      trend: { value: "0%", direction: 'up' as const },
      description: "Staff members",
      icon: <IconUsers className="size-4" />,
      href: "/dashboard/employees"
    }
  ]

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}