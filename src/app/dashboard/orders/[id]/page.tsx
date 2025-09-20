import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getOrder, updateOrderStatus, addOrderNote } from '@/lib/actions/orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Package,
  User,
  CreditCard,
  MapPin,
  FileText,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import OrderStatusActions from '@/components/orders/OrderStatusActions'

function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface OrderPageProps {
  params: Promise<{ id: string }>
}

async function OrderDetailContent({ orderId }: { orderId: string }) {
  let order

  try {
    order = await getOrder(orderId)
  } catch (error) {
    notFound()
  }

  const billingAddress = order.billing_address as any || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Order {order.order_number}
          </h1>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      )}
                      {item.products && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Product: {item.products.name}
                        </p>
                      )}
                      {item.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(item.total_price, order.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatCurrency(item.unit_price, order.currency)}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground">No items found</p>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal_amount, order.currency)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discount {order.discount_code && `(${order.discount_code})`}</span>
                    <span className="text-green-600">
                      -{formatCurrency(order.discount_amount, order.currency)}
                    </span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax_amount, order.currency)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount, order.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="font-medium">Order placed</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                </div>
                {order.paid_at && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="font-medium">Payment received</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.paid_at)}
                      </p>
                    </div>
                  </div>
                )}
                {order.updated_at !== order.created_at && (
                  <div className="flex items-start gap-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <p className="font-medium">Last updated</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.updated_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Payment Status</label>
                <div className="mt-1">
                  <Badge variant={order.payment_status === 'succeeded' ? 'default' : 'secondary'}>
                    {order.payment_status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Order Status</label>
                <div className="mt-1">
                  <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Fulfillment</label>
                <div className="mt-1">
                  <Badge variant={order.fulfillment_status === 'fulfilled' ? 'default' : 'secondary'}>
                    {order.fulfillment_status}
                  </Badge>
                </div>
              </div>
              <OrderStatusActions order={order} />
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                {order.customer_phone && (
                  <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                )}
              </div>
              {order.candidates && (
                <div>
                  <Link
                    href={`/dashboard/candidates/${order.candidates.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Customer Profile
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Address */}
          {billingAddress.address1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className="text-sm not-italic space-y-1">
                  <div>{billingAddress.address1}</div>
                  {billingAddress.address2 && <div>{billingAddress.address2}</div>}
                  <div>
                    {billingAddress.city}, {billingAddress.province} {billingAddress.zip}
                  </div>
                  <div>{billingAddress.country}</div>
                </address>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Method:</span> Credit Card
              </div>
              {order.stripe_payment_intent_id && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Payment ID:</span>
                  <code className="ml-2 text-xs">{order.stripe_payment_intent_id}</code>
                </div>
              )}
              {order.stripe_customer_id && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Customer ID:</span>
                  <code className="ml-2 text-xs">{order.stripe_customer_id}</code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.notes || order.admin_notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.notes && (
                  <div>
                    <label className="text-sm font-medium">Customer Notes:</label>
                    <p className="text-sm mt-1">{order.notes}</p>
                  </div>
                )}
                {order.admin_notes && (
                  <div>
                    <label className="text-sm font-medium">Admin Notes:</label>
                    <p className="text-sm mt-1">{order.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="h-96 bg-muted rounded animate-pulse" />
          </div>
          <div>
            <div className="h-96 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    }>
      <OrderDetailContent orderId={id} />
    </Suspense>
  )
}