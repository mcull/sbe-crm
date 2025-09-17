import { Suspense } from 'react'
import { getOrders, getOrderStats } from '@/lib/actions/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Eye,
  Download
} from 'lucide-react'
import Link from 'next/link'

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusBadge(status: string) {
  const variants: Record<string, any> = {
    paid: { variant: 'default', text: 'Paid' },
    pending: { variant: 'secondary', text: 'Pending' },
    processing: { variant: 'outline', text: 'Processing' },
    completed: { variant: 'default', text: 'Completed' },
    failed: { variant: 'destructive', text: 'Failed' },
    refunded: { variant: 'outline', text: 'Refunded' },
    cancelled: { variant: 'destructive', text: 'Cancelled' }
  }

  const config = variants[status] || variants.pending
  return (
    <Badge variant={config.variant}>
      {config.text}
    </Badge>
  )
}

function getFulfillmentBadge(status: string) {
  const variants: Record<string, any> = {
    fulfilled: { variant: 'default', text: 'Fulfilled' },
    unfulfilled: { variant: 'secondary', text: 'Unfulfilled' },
    partial: { variant: 'outline', text: 'Partial' },
    pending: { variant: 'secondary', text: 'Pending' }
  }

  const config = variants[status] || variants.unfulfilled
  return (
    <Badge variant={config.variant}>
      {config.text}
    </Badge>
  )
}

async function OrdersStats() {
  const stats = await getOrderStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalOrders}</div>
          <p className="text-xs text-muted-foreground">
            All time orders
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.paidOrders}</div>
          <p className="text-xs text-muted-foreground">
            Successfully completed
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingOrders}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting payment
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">
            From paid orders
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function OrdersTable() {
  const orders = await getOrders()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Order</th>
                <th className="text-left py-3 px-2">Customer</th>
                <th className="text-left py-3 px-2">Items</th>
                <th className="text-left py-3 px-2">Total</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Fulfillment</th>
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div className="font-medium">{order.order_number}</div>
                    {order.notes && (
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                        {order.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer_email}
                    </div>
                    {order.candidates && (
                      <div className="text-xs text-muted-foreground">
                        ID: {order.candidates.id.slice(0, 8)}...
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm">
                      {order.order_items?.length || 0} item{order.order_items?.length !== 1 ? 's' : ''}
                    </div>
                    {order.order_items?.length > 0 && (
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {order.order_items[0].name}
                        {order.order_items.length > 1 && ` +${order.order_items.length - 1} more`}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="font-medium">
                      {formatCurrency(order.total_amount, order.currency)}
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        -{formatCurrency(order.discount_amount)} discount
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {getStatusBadge(order.status)}
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.payment_status}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {getFulfillmentBadge(order.fulfillment_status)}
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm">
                      {formatDate(order.created_at)}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No orders found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track fulfillment
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <OrdersStats />
      </Suspense>

      <Suspense fallback={
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      }>
        <OrdersTable />
      </Suspense>
    </div>
  )
}