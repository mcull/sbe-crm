'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, Edit, Eye } from "lucide-react"
import Link from "next/link"
import { ExamTemplate } from "@/lib/types/exams"
import { getExamTemplates } from "@/lib/actions/exams"

export default function ExamTemplatesPage() {
  const [templates, setTemplates] = useState<ExamTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<ExamTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [examTypeFilter, setExamTypeFilter] = useState<string>('all')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, examTypeFilter, levelFilter])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await getExamTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load exam templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = [...templates]

    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.course_offering?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (examTypeFilter !== 'all') {
      filtered = filtered.filter(template => template.exam_type === examTypeFilter)
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(template => template.course_offering?.wset_level?.toString() === levelFilter)
    }

    setFilteredTemplates(filtered)
  }

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'theory': return 'bg-blue-100 text-blue-800'
      case 'tasting': return 'bg-purple-100 text-purple-800'
      case 'combined': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBundlingStatus = (template: ExamTemplate) => {
    if (!template.is_bundled_with_course) return 'Standalone Only'
    return `Bundled (${template.bundled_timing?.replace('_', ' ') || 'Unknown timing'})`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Exam Templates</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exam Templates</h1>
          <p className="text-muted-foreground">
            Manage exam templates for all course offerings
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/exams/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="theory">Theory</SelectItem>
                  <SelectItem value="tasting">Tasting</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg leading-6">
                    {template.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {template.course_offering?.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={getExamTypeColor(template.exam_type)}>
                    {template.exam_type}
                  </Badge>
                  {template.course_offering?.wset_level && (
                    <Badge variant="outline" className="text-xs">
                      Level {template.course_offering.wset_level}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{template.duration_minutes} min</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pass Mark</p>
                  <p className="font-medium">{template.pass_mark_percentage}%</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Bundling</p>
                  <p className="font-medium">{getBundlingStatus(template)}</p>
                </div>
                {template.can_schedule_independently && (
                  <div>
                    <p className="text-muted-foreground">Scheduling Window</p>
                    <p className="font-medium">{template.scheduling_window_days} days</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${template.allows_resits ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-muted-foreground">Resits</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${template.allows_enquiries ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-muted-foreground">Enquiries</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/dashboard/exams/templates/${template.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/dashboard/exams/templates/${template.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No templates found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || examTypeFilter !== 'all' || levelFilter !== 'all'
                    ? "Try adjusting your search or filters"
                    : "Create your first exam template to get started"
                  }
                </p>
              </div>
              {(!searchTerm && examTypeFilter === 'all' && levelFilter === 'all') && (
                <Button asChild>
                  <Link href="/dashboard/exams/templates/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}