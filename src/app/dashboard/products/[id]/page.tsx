import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/actions/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Edit,
  Eye
} from 'lucide-react'
import Link from 'next/link'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
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

interface ProductPageProps {
  params: { id: string }
}

async function ProductDetailContent({ productId }: { productId: string }) {
  let product

  try {
    product = await getProduct(productId)
  } catch (error) {
    notFound()
  }

  const metadata = product.metadata as any || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {product.name}
          </h1>
          <p className="text-muted-foreground">
            Product ID: {product.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/products/${product.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Link>
          </Button>
          {product.stripe_product_id && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://dashboard.stripe.com/products/${product.stripe_product_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View in Stripe
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-1">
                  {product.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <p className="mt-1 capitalize">{product.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge variant={product.active ? 'default' : 'secondary'}>
                      {product.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {metadata.wset_level && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    WSET Level
                  </label>
                  <p className="mt-1">Level {metadata.wset_level}</p>
                </div>
              )}

              {metadata.course_type && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Course Type
                  </label>
                  <p className="mt-1 capitalize">{metadata.course_type}</p>
                </div>
              )}

              {metadata.subject && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Subject
                  </label>
                  <p className="mt-1 capitalize">{metadata.subject}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created
                  </label>
                  <p className="mt-1 text-sm">{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="mt-1 text-sm">{formatDate(product.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Sessions */}
          {product.course_sessions && product.course_sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Course Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.course_sessions.map((session: any) => (
                    <div key={session.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {formatDate(session.start_date)} - {formatDate(session.end_date)}
                            </span>
                          </div>
                          {session.location && (
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {session.location}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {session.available_spots} / {session.max_capacity} spots available
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(session.base_price || 0)}
                          </div>
                          <Badge
                            variant={session.booking_enabled ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {session.booking_enabled ? 'Bookable' : 'Closed'}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/courses/sessions/${session.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Session
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Stripe Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Stripe Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.stripe_product_id ? (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Stripe Product ID
                    </label>
                    <code className="block mt-1 text-xs p-2 bg-muted rounded">
                      {product.stripe_product_id}
                    </code>
                  </div>
                  {product.stripe_price_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Stripe Price ID
                      </label>
                      <code className="block mt-1 text-xs p-2 bg-muted rounded">
                        {product.stripe_price_id}
                      </code>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a
                      href={`https://dashboard.stripe.com/products/${product.stripe_product_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Stripe
                    </a>
                  </Button>
                </>
              ) : (
                <div>
                  <Badge variant="destructive" className="mb-3">
                    Not synced with Stripe
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-3">
                    This product hasn't been synced to Stripe yet.
                  </p>
                  <Button variant="outline" size="sm" className="w-full">
                    Sync to Stripe
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.course_sessions && product.course_sessions.length > 0 ? (
                <div className="space-y-3">
                  {product.course_sessions.map((session: any, index: number) => (
                    <div key={session.id} className="flex justify-between items-center">
                      <span className="text-sm">
                        Session {index + 1}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(session.base_price || 0)}
                      </span>
                    </div>
                  ))}
                  {product.course_sessions.length > 1 && (
                    <>
                      <Separator />
                      <div className="flex justify-between items-center font-medium">
                        <span>Average Price</span>
                        <span>
                          {formatCurrency(
                            product.course_sessions.reduce(
                              (sum: number, session: any) => sum + (session.base_price || 0),
                              0
                            ) / product.course_sessions.length
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No pricing information available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Product Metadata */}
          {Object.keys(metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="flex-1">
            <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-muted rounded animate-pulse" />
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
      <ProductDetailContent productId={params.id} />
    </Suspense>
  )
}