'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getOfferings, createSession } from '@/lib/actions/offerings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, MapPin, Users, Clock, DollarSign, Zap } from 'lucide-react'
import Link from 'next/link'
import { MultiDatePicker, SessionDate } from '@/components/ui/multi-date-picker'

type Offering = {
  id: string
  name: string
  description: string
  type: string
  wset_level?: number
  base_price: number
  default_duration_hours: number
  default_capacity: number
  metadata: any
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
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

export default function NewSessionPage() {
  const router = useRouter()
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    offering_id: '',
    name: '',
    session_dates: [] as SessionDate[],
    location: '',
    instructor: '',
    delivery_method: 'in_person' as 'in_person' | 'online' | 'hybrid',
    max_capacity: '',
    early_bird_deadline: '',
    registration_deadline: '',
    early_bird_discount_percent: '15'
  })

  useEffect(() => {
    async function loadOfferings() {
      try {
        const data = await getOfferings()
        setOfferings(data)
      } catch (error) {
        console.error('Failed to load offerings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadOfferings()
  }, [])

  const handleOfferingSelect = (offeringId: string) => {
    const offering = offerings.find(o => o.id === offeringId)
    if (offering) {
      setSelectedOffering(offering)
      setFormData(prev => ({
        ...prev,
        offering_id: offeringId,
        max_capacity: offering.default_capacity.toString(),
        // Auto-set delivery method based on offering type
        delivery_method: offering.type === 'tasting' ? 'in_person' : prev.delivery_method
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOffering || formData.session_dates.length === 0) return

    setCreating(true)
    try {
      // Create session data with both new and legacy format for compatibility
      const sessionData = {
        ...formData,
        max_capacity: parseInt(formData.max_capacity),
        early_bird_discount_percent: parseInt(formData.early_bird_discount_percent),
        // Add legacy fields for backward compatibility
        session_date: formData.session_dates[0]?.date || '',
        end_date: formData.session_dates[formData.session_dates.length - 1]?.end_time || formData.session_dates[formData.session_dates.length - 1]?.date || '',
        // Include full session dates array
        session_dates: formData.session_dates
      }

      // Remove empty fields except session_dates which should always be included
      Object.keys(sessionData).forEach(key => {
        if (key !== 'session_dates' && sessionData[key as keyof typeof sessionData] === '') {
          delete sessionData[key as keyof typeof sessionData]
        }
      })

      const session = await createSession(sessionData)
      router.push(`/dashboard/sessions/${session.id}`)
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Failed to create session. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading offerings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/offerings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offerings
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule New Session</h1>
          <p className="text-muted-foreground">
            Create a new session that will automatically generate a product for customers to purchase
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Offering */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Step 1: Select Offering Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="offering">Offering</Label>
                <Select onValueChange={handleOfferingSelect} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose what type of session to schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {offerings.map((offering) => (
                      <SelectItem key={offering.id} value={offering.id}>
                        <div className="flex items-center gap-2">
                          <span>{offering.name}</span>
                          <span className="text-muted-foreground">
                            - {formatCurrency(offering.base_price)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOffering && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeBadge(selectedOffering.type, selectedOffering.wset_level)}
                    <span className="font-medium">{formatCurrency(selectedOffering.base_price)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedOffering.description}</p>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">{selectedOffering.default_duration_hours}h</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Default Capacity:</span>
                      <div className="font-medium">{selectedOffering.default_capacity}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium capitalize">{selectedOffering.type.replace('_', ' ')}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Session Details */}
          {selectedOffering && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Step 2: Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Custom Session Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="Leave blank for auto-generated name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <MultiDatePicker
                  value={formData.session_dates}
                  onChange={(dates) => setFormData(prev => ({ ...prev, session_dates: dates }))}
                  label="Session Dates *"
                  required
                  defaultLocation={formData.location}
                  defaultInstructor={formData.instructor}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delivery_method">Delivery Method</Label>
                    <Select
                      value={formData.delivery_method}
                      onValueChange={(value: 'in_person' | 'online' | 'hybrid') =>
                        setFormData(prev => ({ ...prev, delivery_method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_person">In-Person</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder={formData.delivery_method === 'online' ? 'Video link will be provided' : 'e.g., Nashville, TN'}
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input
                      id="instructor"
                      placeholder="e.g., Sarah Johnson"
                      value={formData.instructor}
                      onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_capacity">Maximum Capacity *</Label>
                    <Input
                      id="max_capacity"
                      type="number"
                      min="1"
                      required
                      value={formData.max_capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Pricing & Deadlines */}
          {selectedOffering && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Step 3: Pricing & Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="early_bird_discount_percent">Early Bird Discount (%)</Label>
                  <Input
                    id="early_bird_discount_percent"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.early_bird_discount_percent}
                    onChange={(e) => setFormData(prev => ({ ...prev, early_bird_discount_percent: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="early_bird_deadline">Early Bird Deadline</Label>
                    <Input
                      id="early_bird_deadline"
                      type="date"
                      value={formData.early_bird_deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, early_bird_deadline: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank for auto-calculated (30 days before)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="registration_deadline">Registration Deadline</Label>
                    <Input
                      id="registration_deadline"
                      type="date"
                      value={formData.registration_deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, registration_deadline: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank for auto-calculated (7 days before)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          {selectedOffering && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Auto-Generated Product Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Product Name</Label>
                  <p className="font-medium">
                    {formData.name ||
                     `${selectedOffering.name}${formData.session_dates.length > 0 ?
                       formData.session_dates.length === 1 ?
                       ` - ${new Date(formData.session_dates[0].date).toLocaleDateString('en-US', {
                         month: 'short', day: 'numeric', year: 'numeric'
                       })}` :
                       ` - ${formData.session_dates.length} Sessions (${new Date(formData.session_dates[0].date).toLocaleDateString('en-US', {
                         month: 'short', day: 'numeric'
                       })} - ${new Date(formData.session_dates[formData.session_dates.length - 1].date).toLocaleDateString('en-US', {
                         month: 'short', day: 'numeric', year: 'numeric'
                       })})`
                       : ''
                     }${formData.location ? ` (${formData.location})` : ''}`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Base Price:</Label>
                    <div className="font-medium">{formatCurrency(selectedOffering.base_price)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Early Bird:</Label>
                    <div className="font-medium text-green-600">
                      {formatCurrency(
                        selectedOffering.base_price * (100 - parseInt(formData.early_bird_discount_percent || '0')) / 100
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium text-sm">Automatic Actions</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Product created with intelligent naming</li>
                    <li>✓ Stripe sync ready with metadata</li>
                    <li>✓ Capacity tracking enabled</li>
                    <li>✓ Early bird pricing calculated</li>
                    <li>✓ Registration deadlines set</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={!selectedOffering || creating || formData.session_dates.length === 0} className="flex-1">
              {creating ? 'Creating Session...' : 'Create Session'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}