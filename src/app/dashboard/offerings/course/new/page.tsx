'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOffering } from '@/lib/actions/offerings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, BookOpen, DollarSign, Users, Clock, Settings, Zap } from 'lucide-react'
import Link from 'next/link'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function getQualificationDescription(category: string, level: number): string {
  const descriptions: Record<string, Record<number, string>> = {
    wines: {
      1: "The introductory qualification for those new to the world of wine. Perfect for beginners seeking foundational wine knowledge.",
      2: "Builds on Level 1 with deeper exploration of grape varieties, wine regions, and food pairing principles.",
      3: "Advanced qualification covering systematic wine tasting, major wine regions, and detailed viticulture and vinification.",
      4: "The prestigious Diploma program - the most advanced wine qualification requiring extensive study and professional development."
    },
    spirits: {
      1: "The introductory qualification covering all major spirit categories for those new to spirits.",
      2: "Broadens knowledge of various spirits categories, including production methods and mixology techniques.",
      3: "An advanced qualification providing in-depth spirits education across all major categories and regions."
    },
    sake: {
      1: "The introductory course for sake, covering basic production methods and tasting principles.",
      2: "For those seeking to expand their knowledge of sake production, styles, and service.",
      3: "The most advanced sake qualification offered by WSET, covering detailed production and regional variations."
    },
    beer: {
      1: "The introductory qualification for beer appreciation, covering styles, production, and tasting.",
      2: "A more comprehensive course for those with some prior beer experience, covering advanced styles and production methods."
    }
  }

  return descriptions[category]?.[level] || "Comprehensive WSET qualification providing systematic education and certification."
}

function generateDefaultCourseName(category: string, level: number, format: string): string {
  const categoryCapitalized = category.charAt(0).toUpperCase() + category.slice(1)
  const formatSuffix = format === 'online' ? ' - Online Course' : format === 'hybrid' ? ' - Hybrid Course' : ' - Classroom Course'

  if (category === 'wines') {
    const qualificationNames = {
      1: 'Award in Wines',
      2: 'Intermediate Award in Wines',
      3: 'Advanced Certificate in Wines',
      4: 'Diploma in Wines'
    }
    return `WSET Level ${level} ${qualificationNames[level as keyof typeof qualificationNames]}${formatSuffix}`
  } else {
    return `WSET Level ${level} Award in ${categoryCapitalized}${formatSuffix}`
  }
}

export default function NewCoursePage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    qualification_category: 'wines' as 'wines' | 'spirits' | 'sake' | 'beer',
    wset_level: '1',
    base_price: '',
    default_duration_hours: '24',
    default_capacity: '20',
    auto_create_products: true,
    active: true,

    // Metadata fields
    course_format: 'online' as 'online' | 'in_person' | 'hybrid',
    certification_body: 'WSET',
    prerequisites: '',
    learning_outcomes: '',
    materials_included: '',
    assessment_format: '',
    certification_requirements: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const courseName = formData.name || generateDefaultCourseName(
        formData.qualification_category,
        parseInt(formData.wset_level),
        formData.course_format
      )

      const offeringData = {
        name: courseName,
        description: formData.description,
        type: 'wset_course' as const,
        wset_level: parseInt(formData.wset_level),
        base_price: parseFloat(formData.base_price),
        default_duration_hours: parseInt(formData.default_duration_hours),
        default_capacity: parseInt(formData.default_capacity),
        active: formData.active,
        auto_create_products: formData.auto_create_products,
        metadata: {
          qualification_category: formData.qualification_category,
          course_format: formData.course_format,
          certification_body: formData.certification_body,
          prerequisites: formData.prerequisites || null,
          learning_outcomes: formData.learning_outcomes || null,
          materials_included: formData.materials_included || null,
          assessment_format: formData.assessment_format || null,
          certification_requirements: formData.certification_requirements || null
        }
      }

      const offering = await createOffering(offeringData)
      router.push(`/dashboard/offerings`)
    } catch (error) {
      console.error('Failed to create course offering:', error)
      alert('Failed to create course offering. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  // Calculate pricing preview
  const basePrice = parseFloat(formData.base_price) || 0
  const earlyBirdPrice = basePrice * 0.85 // 15% early bird discount
  const pricePerHour = basePrice / (parseInt(formData.default_duration_hours) || 1)

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
          <h1 className="text-3xl font-bold tracking-tight">Create New WSET Course Offering</h1>
          <p className="text-muted-foreground">
            Create a course offering for any WSET qualification: Wines, Spirits, Sake, or Beer - at any level
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qualification_category">Qualification Category *</Label>
                  <Select value={formData.qualification_category} onValueChange={(value: 'wines' | 'spirits' | 'sake' | 'beer') => setFormData(prev => ({ ...prev, qualification_category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wines">Wines</SelectItem>
                      <SelectItem value="spirits">Spirits</SelectItem>
                      <SelectItem value="sake">Sake</SelectItem>
                      <SelectItem value="beer">Beer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="wset_level">WSET Level *</Label>
                  <Select value={formData.wset_level} onValueChange={(value) => setFormData(prev => ({ ...prev, wset_level: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Award</SelectItem>
                      <SelectItem value="2">Level 2 - {formData.qualification_category === 'wines' ? 'Intermediate Award' : 'Award'}</SelectItem>
                      <SelectItem value="3">Level 3 - {formData.qualification_category === 'wines' ? 'Advanced Certificate' : 'Award'}</SelectItem>
                      {formData.qualification_category === 'wines' && (
                        <SelectItem value="4">Level 4 - Diploma</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 text-sm mb-2">
                  WSET Level {formData.wset_level} Award in {formData.qualification_category.charAt(0).toUpperCase() + formData.qualification_category.slice(1)}
                </h4>
                <p className="text-sm text-blue-700">
                  {getQualificationDescription(formData.qualification_category, parseInt(formData.wset_level))}
                </p>
              </div>

              <div>
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  required
                  placeholder={generateDefaultCourseName(formData.qualification_category, parseInt(formData.wset_level), formData.course_format)}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to use: "{generateDefaultCourseName(formData.qualification_category, parseInt(formData.wset_level), formData.course_format)}"
                </p>
              </div>

              <MarkdownEditor
                label="Course Description *"
                required
                placeholder={`Describe the ${formData.qualification_category} course content, learning objectives, and what students will achieve...

**Example:**
## Course Overview
Learn the fundamentals of ${formData.qualification_category} appreciation and tasting technique.

## What You'll Learn
- Basic principles and terminology
- Tasting methodology and note-taking
- Key regions and styles
- Food and ${formData.qualification_category} pairing basics

[More information](https://example.com)
`}
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                height={200}
              />

              <div>
                <Label htmlFor="course_format">Course Format</Label>
                <Select value={formData.course_format} onValueChange={(value: 'online' | 'in_person' | 'hybrid') => setFormData(prev => ({ ...prev, course_format: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online Self-Paced</SelectItem>
                    <SelectItem value="in_person">In-Person Classroom</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Online + In-Person)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Logistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Logistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_price">Base Price (USD) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="295.00"
                    value={formData.base_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="default_duration_hours">Duration (Hours) *</Label>
                  <Input
                    id="default_duration_hours"
                    type="number"
                    min="1"
                    required
                    placeholder="24"
                    value={formData.default_duration_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_duration_hours: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="default_capacity">Default Session Capacity *</Label>
                <Input
                  id="default_capacity"
                  type="number"
                  min="1"
                  required
                  placeholder="20"
                  value={formData.default_capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_capacity: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default capacity for sessions created from this offering (can be adjusted per session)
                </p>
              </div>

              {basePrice > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Pricing Preview</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Base Price:</span>
                      <div className="font-medium">{formatCurrency(basePrice)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Early Bird (15% off):</span>
                      <div className="font-medium text-green-600">{formatCurrency(earlyBirdPrice)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Per Hour:</span>
                      <div className="font-medium">{formatCurrency(pricePerHour)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Course Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prerequisites">Prerequisites</Label>
                <Textarea
                  id="prerequisites"
                  rows={2}
                  placeholder="e.g., WSET Level 1 Award in Wines or equivalent wine knowledge"
                  value={formData.prerequisites}
                  onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="learning_outcomes">Learning Outcomes</Label>
                <Textarea
                  id="learning_outcomes"
                  rows={3}
                  placeholder="List the key learning objectives and outcomes students will achieve..."
                  value={formData.learning_outcomes}
                  onChange={(e) => setFormData(prev => ({ ...prev, learning_outcomes: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="materials_included">Materials Included</Label>
                <Textarea
                  id="materials_included"
                  rows={2}
                  placeholder="e.g., Study pack, tasting mat, digital classroom access, practice exams..."
                  value={formData.materials_included}
                  onChange={(e) => setFormData(prev => ({ ...prev, materials_included: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assessment_format">Assessment Format</Label>
                  <Input
                    id="assessment_format"
                    placeholder="e.g., 50 question multiple choice exam"
                    value={formData.assessment_format}
                    onChange={(e) => setFormData(prev => ({ ...prev, assessment_format: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="certification_requirements">Certification Requirements</Label>
                  <Input
                    id="certification_requirements"
                    placeholder="e.g., 55% pass mark required"
                    value={formData.certification_requirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, certification_requirements: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Create Products</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate products when sessions are created from this offering
                  </p>
                </div>
                <Switch
                  checked={formData.auto_create_products}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_create_products: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Offering</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow new sessions to be created from this offering
                  </p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Offering Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Course Name</Label>
                <p className="font-medium">
                  {formData.name || generateDefaultCourseName(formData.qualification_category, parseInt(formData.wset_level), formData.course_format)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default">WSET Level {formData.wset_level}</Badge>
                <Badge variant="secondary" className="capitalize">{formData.qualification_category}</Badge>
                <Badge variant="outline" className="capitalize">{formData.course_format.replace('_', ' ')}</Badge>
                {!formData.active && <Badge variant="destructive">Inactive</Badge>}
              </div>

              {basePrice > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Pricing</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Base Price:</span>
                      <span className="font-medium">{formatCurrency(basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Early Bird:</span>
                      <span className="font-medium text-green-600">{formatCurrency(earlyBirdPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Duration:</Label>
                  <div className="font-medium">{formData.default_duration_hours}h</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Capacity:</Label>
                  <div className="font-medium">{formData.default_capacity}</div>
                </div>
              </div>

              {formData.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm text-muted-foreground line-clamp-4">{formData.description}</p>
                </div>
              )}

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium text-sm">Ready for Sessions</span>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Course template will be created</li>
                  <li>✓ {formData.auto_create_products ? 'Auto product generation enabled' : 'Manual product creation'}</li>
                  <li>✓ Available for session scheduling</li>
                  <li>✓ Exam relationships will be auto-linked</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={creating} className="flex-1">
              {creating ? 'Creating Course...' : 'Create Course Offering'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}