import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/actions/offerings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  DollarSign,
  ExternalLink,
  Edit,
  Package,
  Zap,
  CheckCircle,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'

interface SessionPageProps {
  params: { id: string }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getTypeBadge(type: string, wsetLevel?: number) {
  const variants = {
    wset_course: { variant: 'default' as const, text: wsetLevel ? `WSET Level ${wsetLevel}` : 'WSET Course' },
    standalone_exam: { variant: 'secondary' as const, text: 'Standalone Exam' },
    tasting: { variant: 'outline' as const, text: 'Wine Tasting' },
    product: { variant: 'outline' as const, text: 'Product' }
  }
  const config = variants[type as keyof typeof variants] || variants.product
  return <Badge variant={config.variant}>{config.text}</Badge>
}

async function SessionDetailContent({ sessionId }: { sessionId: string }) {
  let session

  try {
    session = await getSession(sessionId)
  } catch (error) {
    notFound()
  }

  const offering = session.offerings
  const product = session.products
  const metadata = offering?.metadata || {}

  // Calculate pricing
  const basePrice = offering?.base_price || 0
  const earlyBirdPrice = session.early_bird_discount_percent
    ? basePrice * (100 - session.early_bird_discount_percent) / 100
    : basePrice
  const savings = basePrice - earlyBirdPrice

  const enrollmentPercentage = session.max_capacity > 0
    ? (session.current_enrollment / session.max_capacity) * 100
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/offerings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offerings
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {session.name || offering?.name}
          </h1>
          <p className="text-muted-foreground">
            Session ID: {session.id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/sessions/${session.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Session
            </Link>
          </Button>
          {product?.stripe_product_id && (
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
          {/* Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                {getTypeBadge(offering?.type, offering?.wset_level)}
                <Badge variant={session.booking_enabled ? 'default' : 'secondary'}>
                  {session.booking_enabled ? 'Booking Open' : 'Booking Closed'}
                </Badge>
                {session.available_spots <= 0 && session.booking_enabled && (
                  <Badge variant="destructive">Session Full</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                  <p className="font-medium">{formatDate(session.session_date)}</p>
                </div>
                {session.end_date && session.end_date !== session.session_date && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="font-medium">{formatDate(session.end_date)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{session.location || 'Online'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Delivery Method</label>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{session.delivery_method?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {session.instructor && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Instructor</label>
                  <p className="font-medium">{session.instructor}</p>
                </div>
              )}


              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <p className="font-medium">{offering?.default_duration_hours}h</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'} className="capitalize">
                    {session.status}
                  </Badge>
                </div>
              </div>

              {(session.early_bird_deadline || session.registration_deadline) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {session.early_bird_deadline && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Early Bird Deadline</label>
                        <p className="font-medium">{formatShortDate(session.early_bird_deadline)}</p>
                      </div>
                    )}
                    {session.registration_deadline && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Registration Deadline</label>
                        <p className="font-medium">{formatShortDate(session.registration_deadline)}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Auto-Generated Product */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Auto-Generated Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product ? (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{product.name}</span>
                        <Badge variant={product.active ? 'default' : 'secondary'} className="text-xs">
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Product ID: {product.id}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/products/${product.id}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Product
                      </Link>
                    </Button>
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">Product Successfully Created</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>✓ Intelligent product naming applied</li>
                      <li>✓ Session details included in description</li>
                      <li>✓ Pricing configured from offering template</li>
                      <li>✓ {product.stripe_product_id ? 'Ready for Stripe sync' : 'Stripe sync pending'}</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No product generated yet</p>
                  <p className="text-sm">Products are created automatically when sessions are saved</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Enrollment & Capacity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {session.current_enrollment || 0}/{session.max_capacity}
                </div>
                <p className="text-sm text-muted-foreground">enrolled / capacity</p>
              </div>

              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, enrollmentPercentage)}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">{session.available_spots}</div>
                  <div className="text-muted-foreground">Available</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{Math.round(enrollmentPercentage)}%</div>
                  <div className="text-muted-foreground">Full</div>
                </div>
              </div>

              {session.available_spots <= 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Session is full</p>
                  <p className="text-xs text-red-600 mt-1">
                    New bookings will be automatically disabled
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className="font-medium">{formatCurrency(basePrice)}</span>
                </div>

                {session.early_bird_discount_percent && session.early_bird_discount_percent > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Early Bird Price:</span>
                      <span className="font-medium text-green-600">{formatCurrency(earlyBirdPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Early Bird Savings:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(savings)} ({session.early_bird_discount_percent}% off)
                      </span>
                    </div>
                  </>
                )}
              </div>

              {offering && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground mb-2">From offering:</p>
                  <p className="text-sm font-medium">{offering.name}</p>
                  <p className="text-xs text-muted-foreground">{offering.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Components */}
          {session.session_components && session.session_components.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Optional Components</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {session.session_components.map((sc: any) => (
                    <div key={sc.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{sc.components.name}</div>
                        <div className="text-sm text-muted-foreground">{sc.components.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {sc.is_included ? 'Included' : formatCurrency(sc.override_price || sc.components.price)}
                        </div>
                        <Badge variant={sc.is_required ? 'default' : 'outline'} className="text-xs">
                          {sc.is_required ? 'Required' : sc.is_included ? 'Included' : 'Optional'}
                        </Badge>
                      </div>
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

export default function SessionPage({ params }: SessionPageProps) {
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
      <SessionDetailContent sessionId={params.id} />
    </Suspense>
  )
}