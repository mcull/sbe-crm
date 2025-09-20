'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, AlertCircle, Info, Trash2 } from "lucide-react"
import Link from "next/link"
import { ExamTemplate, UpdateExamTemplateData, ExamType, BundledTiming } from "@/lib/types/exams"
import { getExamTemplate, updateExamTemplate } from "@/lib/actions/exams"

export default function EditExamTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<ExamTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<UpdateExamTemplateData>({})

  useEffect(() => {
    if (params.id) {
      loadTemplate(params.id as string)
    }
  }, [params.id])

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true)
      const templateData = await getExamTemplate(templateId)

      setTemplate(templateData)

      // Initialize form with current template data
      setFormData({
        name: templateData.name,
        exam_type: templateData.exam_type,
        duration_minutes: templateData.duration_minutes,
        pass_mark_percentage: templateData.pass_mark_percentage,
        max_score: templateData.max_score,
        is_bundled_with_course: templateData.is_bundled_with_course,
        bundled_timing: templateData.bundled_timing,
        can_schedule_independently: templateData.can_schedule_independently,
        scheduling_window_days: templateData.scheduling_window_days,
        allows_resits: templateData.allows_resits,
        allows_enquiries: templateData.allows_enquiries,
        makeup_fee: templateData.makeup_fee,
        resit_fee: templateData.resit_fee,
        remote_invigilation_fee: templateData.remote_invigilation_fee,
        enquiry_fee: templateData.enquiry_fee,
        active: templateData.active,
        metadata: templateData.metadata
      })
    } catch (error) {
      console.error('Failed to load template:', error)
      setError('Failed to load exam template')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!template) return

    try {
      setSaving(true)
      setError(null)

      await updateExamTemplate(template.id, formData)
      router.push(`/dashboard/exams/templates/${template.id}`)
    } catch (error) {
      console.error('Failed to update exam template:', error)
      setError('Failed to update exam template. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Check if form has changes
  const hasChanges = template && Object.keys(formData).some(key => {
    const formValue = formData[key as keyof UpdateExamTemplateData]
    const templateValue = template[key as keyof ExamTemplate]
    return formValue !== templateValue
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Exam Template</h1>
            <p className="text-muted-foreground">Loading template data...</p>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !template) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/exams/templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Template Not Found</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!template) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/exams/templates/${template.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Template
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Exam Template</h1>
          <p className="text-muted-foreground">
            {template.course_offering?.name} • {template.name}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 text-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter exam template name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="exam_type">Exam Type</Label>
                    <Select
                      value={formData.exam_type || ''}
                      onValueChange={(value: ExamType) => setFormData(prev => ({ ...prev, exam_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory">Theory Only</SelectItem>
                        <SelectItem value="tasting">Tasting Only</SelectItem>
                        <SelectItem value="combined">Combined (Theory + Tasting)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                      min="15"
                      max="300"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pass_mark">Pass Mark (%)</Label>
                    <Input
                      id="pass_mark"
                      type="number"
                      value={formData.pass_mark_percentage || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, pass_mark_percentage: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      max="100"
                      step="0.1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_score">Maximum Score</Label>
                    <Input
                      id="max_score"
                      type="number"
                      value={formData.max_score || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_score: parseInt(e.target.value) || 0 }))}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bundling Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Bundling & Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="bundled">Bundle with Course</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically create exam sessions when course sessions are scheduled
                    </p>
                  </div>
                  <Switch
                    id="bundled"
                    checked={formData.is_bundled_with_course ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bundled_with_course: checked }))}
                  />
                </div>

                {formData.is_bundled_with_course && (
                  <div className="space-y-2">
                    <Label htmlFor="bundled_timing">Bundled Timing</Label>
                    <Select
                      value={formData.bundled_timing || ''}
                      onValueChange={(value: BundledTiming) => setFormData(prev => ({ ...prev, bundled_timing: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="same_day">Same Day as Course</SelectItem>
                        <SelectItem value="final_day">Final Day of Course</SelectItem>
                        <SelectItem value="separate_day">Day After Course</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="independent">Allow Independent Scheduling</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can schedule this exam independently (for online courses)
                    </p>
                  </div>
                  <Switch
                    id="independent"
                    checked={formData.can_schedule_independently ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_schedule_independently: checked }))}
                  />
                </div>

                {formData.can_schedule_independently && (
                  <div className="space-y-2">
                    <Label htmlFor="window">Scheduling Window (days)</Label>
                    <Input
                      id="window"
                      type="number"
                      value={formData.scheduling_window_days || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduling_window_days: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="730"
                      placeholder="365"
                    />
                    <p className="text-xs text-muted-foreground">
                      How long students have to schedule their exam after course enrollment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exam Services */}
            <Card>
              <CardHeader>
                <CardTitle>Exam Services & Fees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="resits">Allow Resits</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can retake this exam if they fail
                    </p>
                  </div>
                  <Switch
                    id="resits"
                    checked={formData.allows_resits ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allows_resits: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enquiries">Allow Enquiries</Label>
                    <p className="text-sm text-muted-foreground">
                      Students can challenge exam results
                    </p>
                  </div>
                  <Switch
                    id="enquiries"
                    checked={formData.allows_enquiries ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allows_enquiries: checked }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="makeup_fee">Makeup Fee (£)</Label>
                    <Input
                      id="makeup_fee"
                      type="number"
                      value={formData.makeup_fee || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, makeup_fee: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="75.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resit_fee">Resit Fee (£)</Label>
                    <Input
                      id="resit_fee"
                      type="number"
                      value={formData.resit_fee || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, resit_fee: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="75.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invigilation_fee">Remote Invigilation Fee (£)</Label>
                    <Input
                      id="invigilation_fee"
                      type="number"
                      value={formData.remote_invigilation_fee || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, remote_invigilation_fee: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enquiry_fee">Enquiry Fee (£)</Label>
                    <Input
                      id="enquiry_fee"
                      type="number"
                      value={formData.enquiry_fee || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, enquiry_fee: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Status */}
            <Card>
              <CardHeader>
                <CardTitle>Template Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="active">Active Template</Label>
                    <p className="text-sm text-muted-foreground">
                      Only active templates can be used to create new exam sessions
                    </p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.active ?? false}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{template.course_offering?.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {template.course_offering?.wset_level && (
                      <Badge variant="outline">Level {template.course_offering.wset_level}</Badge>
                    )}
                    <Badge variant="secondary">{template.course_offering?.type}</Badge>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Template ID:</p>
                  <p className="font-mono text-xs">{template.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Changes Preview */}
            {hasChanges && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-800">Unsaved Changes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-orange-700">
                  <p>You have unsaved changes to this template.</p>
                  <p className="mt-2">Remember to save your changes before leaving this page.</p>
                </CardContent>
              </Card>
            )}

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Sessions:</p>
                  <p className="font-medium">{template.exam_sessions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created:</p>
                  <p className="font-medium">{new Date(template.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated:</p>
                  <p className="font-medium">{new Date(template.updated_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">
                  Changes to this template won't affect existing sessions, only new ones created after saving.
                </p>
                <p className="text-muted-foreground">
                  If you deactivate this template, you won't be able to create new sessions with it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={`/dashboard/exams/templates/${template.id}`}>Cancel</Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="text-xs"
              disabled={saving}
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </Button>
          </div>
          <Button type="submit" disabled={saving || !hasChanges}>
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}