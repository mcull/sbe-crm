'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TestCheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [customerEmail, setCustomerEmail] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')

  // Sample products for testing (real Stripe price IDs from our sync)
  const testProducts = [
    {
      id: 'level1-wine-online',
      name: 'Online WSET Level 1 Award in Wines with Kit',
      price: '$310.00',
      stripe_price_id: 'price_1S8NmXE0HnNOYN8X49YbEGav'
    },
    {
      id: 'level1-wine-online-2',
      name: 'Online WSET Level 1 Award in Wines (Alternative)',
      price: '$195.00',
      stripe_price_id: 'price_1S8Nn6E0HnNOYN8XisfWMxFI'
    },
    {
      id: 'palate-kit',
      name: 'Palate Calibration Tasting Kit',
      price: '$100.00',
      stripe_price_id: 'price_1S8No2E0HnNOYN8XfEgPsxuC' // Estimate - will work if exists
    }
  ]

  const handleCheckout = async () => {
    if (!customerEmail || !selectedProduct) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              stripe_price_id: selectedProduct,
              quantity: 1
            }
          ],
          customer_email: customerEmail,
          success_url: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/checkout/cancelled`
        })
      })

      const { sessionId, url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Stripe Integration Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the complete checkout flow with real Stripe integration
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Customer Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Select Course</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course to purchase" />
              </SelectTrigger>
              <SelectContent>
                {testProducts.map((product) => (
                  <SelectItem key={product.id} value={product.stripe_price_id}>
                    {product.name} - {product.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 space-y-2">
            <Button
              onClick={handleCheckout}
              disabled={loading || !customerEmail || !selectedProduct}
              className="w-full"
            >
              {loading ? 'Creating Checkout...' : 'Proceed to Checkout'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This will redirect to Stripe Checkout for payment processing
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Test Cards:</h3>
            <div className="text-sm space-y-1">
              <p><strong>Success:</strong> 4242 4242 4242 4242</p>
              <p><strong>Decline:</strong> 4000 0000 0000 0002</p>
              <p className="text-muted-foreground">Use any future date for expiry, any CVC</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}