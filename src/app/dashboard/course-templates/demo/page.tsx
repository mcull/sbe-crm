'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Calendar, MapPin, Users, DollarSign, Zap } from 'lucide-react'

// Mock data for demonstration
const courseTemplates = [
  {
    id: '1',
    wset_level: 1,
    name: 'WSET Level 1 Award in Wines',
    description: 'An introductory course for wine novices, covering the basic principles of wine and wine tasting.',
    duration_weeks: 1,
    max_capacity: 16,
    base_price: 299.00,
    early_bird_discount_percent: 15,
    early_bird_deadline_days: 30,
    registration_deadline_days: 7,
    is_active: true,
    auto_create_products: true,
    stripe_sync_enabled: true,
    metadata: {
      includes_tasting_kit: false,
      includes_materials: true,
      certificate_type: 'wset_level_1',
      course_format: 'hybrid'
    }
  },
  {
    id: '2',
    wset_level: 2,
    name: 'WSET Level 2 Award in Wines',
    description: 'For those with some knowledge who want to understand wine in greater depth.',
    duration_weeks: 2,
    max_capacity: 20,
    base_price: 599.00,
    early_bird_discount_percent: 15,
    early_bird_deadline_days: 30,
    registration_deadline_days: 7,
    is_active: true,
    auto_create_products: true,
    stripe_sync_enabled: true,
    metadata: {
      includes_tasting_kit: true,
      includes_materials: true,
      certificate_type: 'wset_level_2',
      course_format: 'hybrid'
    }
  }
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function generateProductPreview(template: any, sessionData: any) {
  if (!sessionData.start_date || !template) return null

  const startDate = new Date(sessionData.start_date)
  const endDate = sessionData.end_date ? new Date(sessionData.end_date) : startDate

  // Generate intelligent product name
  const productName = template.name + ' - ' +
    startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    (sessionData.location ? ` (${sessionData.location})` : '')

  // Calculate pricing
  const basePrice = template.base_price
  const earlyBirdPrice = Math.round(basePrice * (100 - template.early_bird_discount_percent) / 100)
  const earlyBirdDeadline = new Date(startDate)
  earlyBirdDeadline.setDate(earlyBirdDeadline.getDate() - template.early_bird_deadline_days)
  const registrationDeadline = new Date(startDate)
  registrationDeadline.setDate(registrationDeadline.getDate() - template.registration_deadline_days)

  // Generate description
  const productDescription = template.description + '\n\n' +
    'Session Details:\n' +
    `• Dates: ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` +
    (endDate.getTime() !== startDate.getTime() ? ` - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : '') + '\n' +
    (sessionData.location ? `• Location: ${sessionData.location}\n` : '') +
    `• Instructor: ${sessionData.instructor || 'TBA'}\n` +
    `• Capacity: ${sessionData.available_spots || template.max_capacity} spots`

  return {
    name: productName,
    description: productDescription,
    type: 'course_session',
    basePrice,
    earlyBirdPrice,
    earlyBirdDeadline: earlyBirdDeadline.toLocaleDateString(),
    registrationDeadline: registrationDeadline.toLocaleDateString(),
    capacity: sessionData.available_spots || template.max_capacity,
    metadata: {
      ...template.metadata,
      wset_level: template.wset_level,
      course_type: 'instructor_led',
      start_date: sessionData.start_date,
      end_date: sessionData.end_date,
      location: sessionData.location,
      instructor: sessionData.instructor,
      auto_generated: true,
      template_id: template.id
    }
  }
}

export default function TemplatesDemoPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [sessionData, setSessionData] = useState({
    start_date: '',
    end_date: '',
    location: '',
    instructor: '',
    available_spots: ''
  })

  const productPreview = generateProductPreview(selectedTemplate, sessionData)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auto Product Generation Demo</h1>
        <p className="text-muted-foreground">
          See how course sessions automatically generate products with intelligent pricing and naming
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Session Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Course Session
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill out the session details to see the auto-generated product
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="course-template">Course Template</Label>
              <Select onValueChange={(value) => setSelectedTemplate(courseTemplates.find(t => t.id === value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a WSET course template" />
                </SelectTrigger>
                <SelectContent>
                  {courseTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      WSET Level {template.wset_level} - {formatCurrency(template.base_price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={sessionData.start_date}
                  onChange={(e) => setSessionData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={sessionData.end_date}
                  onChange={(e) => setSessionData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Downtown Location, Online"
                value={sessionData.location}
                onChange={(e) => setSessionData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                placeholder="e.g., Sarah Johnson"
                value={sessionData.instructor}
                onChange={(e) => setSessionData(prev => ({ ...prev, instructor: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="capacity">Available Spots</Label>
              <Input
                id="capacity"
                type="number"
                placeholder={selectedTemplate ? String(selectedTemplate.max_capacity) : 'Default from template'}
                value={sessionData.available_spots}
                onChange={(e) => setSessionData(prev => ({ ...prev, available_spots: e.target.value }))}
              />
            </div>

            {selectedTemplate && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Template Settings:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Base Price: <span className="font-medium">{formatCurrency(selectedTemplate.base_price)}</span></div>
                  <div>Early Bird: <span className="font-medium">{selectedTemplate.early_bird_discount_percent}% off</span></div>
                  <div>Max Capacity: <span className="font-medium">{selectedTemplate.max_capacity}</span></div>
                  <div>Duration: <span className="font-medium">{selectedTemplate.duration_weeks} weeks</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Product Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Auto-Generated Product
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This product will be automatically created when you save the session
            </p>
          </CardHeader>
          <CardContent>
            {productPreview ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Product Name</Label>
                  <p className="font-medium">{productPreview.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <Textarea
                    value={productPreview.description}
                    readOnly
                    className="h-32 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Pricing</Label>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Base Price:</span>
                        <span className="font-medium">{formatCurrency(productPreview.basePrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Early Bird:</span>
                        <span className="font-medium text-green-600">{formatCurrency(productPreview.earlyBirdPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Savings:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(productPreview.basePrice - productPreview.earlyBirdPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Deadlines</Label>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Early Bird:</span>
                        <span className="font-medium">{productPreview.earlyBirdDeadline}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Registration:</span>
                        <span className="font-medium">{productPreview.registrationDeadline}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="default">WSET Level {productPreview.metadata.wset_level}</Badge>
                  <Badge variant="outline">Auto-generated</Badge>
                  <Badge variant="outline">Stripe Sync Ready</Badge>
                  {productPreview.metadata.includes_tasting_kit && (
                    <Badge variant="secondary">Includes Kit</Badge>
                  )}
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium text-sm">Automatic Actions</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Product created with intelligent naming</li>
                    <li>✓ Pricing calculated from template settings</li>
                    <li>✓ Early bird deadlines automatically set</li>
                    <li>✓ Course session linked to product</li>
                    <li>✓ Metadata includes all session details</li>
                    <li>✓ Ready for Stripe synchronization</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a course template and start date to see the auto-generated product</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How This Replaces Manual Product Creation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-semibold text-red-600">❌ Old Chaotic Process</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Phillip schedules a course session</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Someone manually creates a product in Stripe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Product name and pricing are inconsistent</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>CRM and Stripe products don't match</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Early bird pricing manually configured</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Prone to errors and omissions</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600">✅ New Opinionated Process</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Phillip schedules a course session</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Product auto-created</strong> with intelligent naming</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Consistent pricing</strong> from WSET level templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Auto-synced</strong> to Stripe with proper metadata</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Early bird pricing</strong> calculated automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  <span><strong>Zero manual work</strong> - fully automated</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}