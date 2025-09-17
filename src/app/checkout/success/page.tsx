import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface CheckoutSuccessProps {
  searchParams: { session_id?: string }
}

async function CheckoutSuccessContent({ sessionId }: { sessionId: string }) {
  const supabase = await createClient()

  // Find the order by Stripe checkout session ID
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        name,
        quantity,
        unit_price,
        total_price,
        products (
          name,
          description
        )
      )
    `)
    .eq('stripe_checkout_session_id', sessionId)
    .single()

  if (!order) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-red-600">Order Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            We couldn't find your order. Please contact support if you need assistance.
          </p>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Order Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="ml-2 font-medium">{order.order_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium">
                    ${order.total_amount.toFixed(2)} {order.currency?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2 font-medium">{order.customer_email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 font-medium capitalize">{order.status}</span>
                </div>
              </div>
            </div>

            {order.order_items && order.order_items.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Items Purchased</h3>
                <div className="space-y-2">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.products?.name || item.name}</h4>
                        {item.products?.description && (
                          <p className="text-sm text-muted-foreground">{item.products.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.total_price.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.unit_price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• You'll receive a confirmation email shortly</li>
                <li>• Course materials and instructions will be sent before your session</li>
                <li>• Check your email for any pre-course requirements</li>
                <li>• Contact us if you have any questions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage({ searchParams }: CheckoutSuccessProps) {
  const sessionId = searchParams.session_id

  if (!sessionId) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Request</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Missing session information. Please return to the checkout.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            Loading your order details...
          </CardContent>
        </Card>
      }>
        <CheckoutSuccessContent sessionId={sessionId} />
      </Suspense>
    </div>
  )
}