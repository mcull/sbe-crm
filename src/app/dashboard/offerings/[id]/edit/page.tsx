'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getOffering, updateOffering } from '@/lib/actions/offerings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MarkdownEditor } from '@/components/ui/markdown-editor'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/ui/image-upload'
import { ArrowLeft, BookOpen, DollarSign, Save, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PageProps {
  params: {
    id: string
  }
}

export default function EditOfferingPage({ params }: PageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'wset_course' as const,
    wset_level: 1,
    base_price: 0,
    default_duration_hours: 24,
    default_capacity: 20,
    active: true,
    auto_create_products: true,
    image_url: '',
    image_alt: '',
    image_blob_token: '',
    image_file_size: 0,
    image_content_type: '',
    metadata: {}
  })

  useEffect(() => {
    loadOffering()
  }, [params.id])

  const loadOffering = async () => {
    try {
      const offering = await getOffering(params.id)
      setFormData({
        name: offering.name || '',
        description: offering.description || '',
        type: offering.type,
        wset_level: offering.wset_level || 1,
        base_price: offering.base_price || 0,
        default_duration_hours: offering.default_duration_hours || 24,
        default_capacity: offering.default_capacity || 20,
        active: offering.active,
        auto_create_products: offering.auto_create_products,
        image_url: offering.image_url || '',
        image_alt: offering.image_alt || '',
        image_blob_token: offering.image_blob_token || '',
        image_file_size: offering.image_file_size || 0,
        image_content_type: offering.image_content_type || '',
        metadata: offering.metadata || {}
      })
    } catch (err) {
      setError('Failed to load offering details. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      await updateOffering(params.id, formData)
      router.push('/dashboard/courses')
    } catch (err) {
      setError('Failed to update offering. Please try again.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading offering details...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Course Offering</h1>
          <p className="text-muted-foreground">
            Update the course offering details and settings
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
              <div>
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData(prev => ({ ...prev, image_url: url || '' }))}
                onMetadataChange={(metadata) => {
                  if (metadata) {
                    setFormData(prev => ({
                      ...prev,
                      image_blob_token: metadata.pathname,
                      image_file_size: metadata.size,
                      image_content_type: metadata.contentType
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      image_blob_token: '',
                      image_file_size: 0,
                      image_content_type: ''
                    }))
                  }
                }}
                label="Course Image"
                placeholder="Upload a course image..."
                entityType="offering"
                entityId={params.id}
                className="mb-4"
              />

              <div>
                <Label htmlFor="image_alt">Image Alt Text</Label>
                <Input
                  id="image_alt"
                  placeholder="Describe the image for accessibility"
                  value={formData.image_alt}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_alt: e.target.value }))}
                />
              </div>

              <MarkdownEditor
                label="Course Description *"
                required
                placeholder="Describe the course content, learning objectives, and what students will achieve..."
                value={formData.description}
                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                height={200}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wset_level">WSET Level</Label>
                  <Select value={formData.wset_level.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, wset_level: parseInt(value) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Level 1 - Award</SelectItem>
                      <SelectItem value="2">Level 2 - Award</SelectItem>
                      <SelectItem value="3">Level 3 - Certificate</SelectItem>
                      <SelectItem value="4">Level 4 - Diploma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Course Type</Label>
                  <Select value={formData.type} onValueChange={(value: 'wset_course' | 'standalone_exam' | 'tasting') => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wset_course">WSET Course</SelectItem>
                      <SelectItem value="standalone_exam">Standalone Exam</SelectItem>
                      <SelectItem value="tasting">Tasting Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    value={formData.base_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="default_duration_hours">Duration (Hours) *</Label>
                  <Input
                    id="default_duration_hours"
                    type="number"
                    min="1"
                    required
                    value={formData.default_duration_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_duration_hours: parseInt(e.target.value) || 1 }))}
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
                  value={formData.default_capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_capacity: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Create Products</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically generate products when sessions are created
                  </p>
                </div>
                <Switch
                  checked={formData.auto_create_products}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_create_products: checked }))}
                />
              </div>

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
              <CardTitle>Offering Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Course Name</Label>
                <p className="font-medium">{formData.name}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">WSET Level & Type</Label>
                <p className="font-medium">Level {formData.wset_level} - {formData.type.replace('_', ' ')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Price:</Label>
                  <div className="font-medium">${formData.base_price}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration:</Label>
                  <div className="font-medium">{formData.default_duration_hours}h</div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Status:</Label>
                <div className="font-medium">
                  {formData.active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}