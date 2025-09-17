'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getOfferings, createSession } from '@/lib/actions/offerings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, MapPin, Users, Clock, DollarSign, Zap, BookOpen } from 'lucide-react'
import Link from 'next/link'

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

export default function NewExamPage() {
  const router = useRouter()
  const [examOfferings, setExamOfferings] = useState<Offering[]>([])
  const [courseOfferings, setCourseOfferings] = useState<Offering[]>([])
  const [selectedExamOffering, setSelectedExamOffering] = useState<Offering | null>(null)
  const [selectedCourseOffering, setSelectedCourseOffering] = useState<Offering | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    offering_id: '',
    linked_course_offering_id: '',
    name: '',
    session_date: '',
    location: 'Online',
    instructor: '',
    delivery_method: 'online' as 'in_person' | 'online' | 'hybrid',
    max_capacity: '50',
    early_bird_deadline: '',
    registration_deadline: '',
    early_bird_discount_percent: '0'
  })

  useEffect(() => {
    async function loadOfferings() {
      try {
        const [exams, courses] = await Promise.all([
          getOfferings('standalone_exam'),
          getOfferings('wset_course')
        ])
        setExamOfferings(exams)
        setCourseOfferings(courses)
      } catch (error) {
        console.error('Failed to load offerings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadOfferings()
  }, [])

  const handleExamOfferingSelect = (offeringId: string) => {
    const offering = examOfferings.find(o => o.id === offeringId)
    if (offering) {
      setSelectedExamOffering(offering)
      setFormData(prev => ({
        ...prev,
        offering_id: offeringId,
        max_capacity: offering.default_capacity.toString(),
        delivery_method: 'online' // Exams are typically online
      }))
    }
  }

  const handleCourseOfferingSelect = (offeringId: string) => {
    const offering = courseOfferings.find(o => o.id === offeringId)
    setSelectedCourseOffering(offering)
    setFormData(prev => ({
      ...prev,
      linked_course_offering_id: offeringId
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExamOffering) return

    setCreating(true)
    try {
      const examData = {
        ...formData,
        max_capacity: parseInt(formData.max_capacity),
        early_bird_discount_percent: parseInt(formData.early_bird_discount_percent)
      }

      // Remove empty fields except linked_course_offering_id which we want to keep
      Object.keys(examData).forEach(key => {
        if (examData[key as keyof typeof examData] === '' && key !== 'linked_course_offering_id') {
          delete examData[key as keyof typeof examData]
        }
      })

      const session = await createSession(examData)
      router.push(`/dashboard/sessions/${session.id}`)
    } catch (error) {
      console.error('Failed to create exam session:', error)
      alert('Failed to create exam session. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading exam offerings...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Schedule New Exam</h1>
          <p className="text-muted-foreground">
            Schedule a standalone exam session with optional connection to a course
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Exam Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Step 1: Select Exam Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="exam-offering">Exam Type</Label>
                <Select onValueChange={handleExamOfferingSelect} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose what type of exam to schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {examOfferings.map((offering) => (
                      <SelectItem key={offering.id} value={offering.id}>
                        <div className="flex items-center gap-2">
                          <span>WSET Level {offering.wset_level} - {offering.name}</span>
                          <span className="text-muted-foreground">
                            - {formatCurrency(offering.base_price)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExamOffering && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">WSET Level {selectedExamOffering.wset_level}</Badge>
                    <Badge variant="outline">Standalone Exam</Badge>
                    <span className="font-medium">{formatCurrency(selectedExamOffering.base_price)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedExamOffering.description}</p>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">{selectedExamOffering.default_duration_hours}h</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Default Capacity:</span>
                      <div className="font-medium">{selectedExamOffering.default_capacity}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <div className="font-medium">Online Proctored</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Link to Course (Optional) */}
          {selectedExamOffering && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Step 2: Link to Course (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="course-offering">Related Course (Optional)</Label>
                  <Select onValueChange={handleCourseOfferingSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose course this exam is for (leave blank if standalone)" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseOfferings
                        .filter(course => course.wset_level === selectedExamOffering.wset_level)
                        .map((offering) => (
                          <SelectItem key={offering.id} value={offering.id}>
                            <div className="flex items-center gap-2">
                              <span>WSET Level {offering.wset_level} - {offering.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link this exam to a specific course offering. This helps track which students need retakes or are transferring from other providers.
                  </p>
                </div>

                {selectedCourseOffering && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium text-sm">Course Connection</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      This exam will be linked to <strong>{selectedCourseOffering.name}</strong>
                    </p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Students from this course can easily register for retakes</li>
                      <li>• Exam results will be associated with the course</li>
                      <li>• Reporting will show course completion rates</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Exam Details */}
          {selectedExamOffering && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Step 3: Exam Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Custom Exam Session Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="Leave blank for auto-generated name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="session_date">Exam Date & Time *</Label>
                    <Input
                      id="session_date"
                      type="datetime-local"
                      required
                      value={formData.session_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, session_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location/Platform</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Online (ProctorU)"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instructor">Proctor/Instructor</Label>
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

                <div className="grid grid-cols-2 gap-4">
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
          {selectedExamOffering && (
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
                     `${selectedExamOffering.name}${formData.session_date ?
                       ` - ${new Date(formData.session_date).toLocaleDateString('en-US', {
                         month: 'short', day: 'numeric', year: 'numeric'
                       })}` : ''
                     }${selectedCourseOffering ? ` (${selectedCourseOffering.name})` : ''}`
                    }
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Exam Price:</Label>
                    <div className="font-medium">{formatCurrency(selectedExamOffering.base_price)}</div>
                  </div>
                </div>

                {selectedCourseOffering && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium text-sm">Course Integration</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Linked to: <strong>{selectedCourseOffering.name}</strong>
                    </p>
                  </div>
                )}

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium text-sm">Automatic Actions</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Exam product created automatically</li>
                    <li>✓ Online proctoring metadata included</li>
                    <li>✓ Registration capacity tracking</li>
                    <li>✓ {selectedCourseOffering ? 'Course linkage established' : 'Standalone exam setup'}</li>
                    <li>✓ Student results tracking enabled</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={!selectedExamOffering || creating} className="flex-1">
              {creating ? 'Creating Exam Session...' : 'Create Exam Session'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}