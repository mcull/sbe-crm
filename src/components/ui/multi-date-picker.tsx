'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Calendar, Clock, MapPin, User } from 'lucide-react'
import { format } from 'date-fns'

export interface SessionDate {
  date: string // ISO date string
  end_time?: string // ISO date string
  location?: string
  instructor?: string
  notes?: string
}

interface MultiDatePickerProps {
  value: SessionDate[]
  onChange: (dates: SessionDate[]) => void
  label?: string
  required?: boolean
  className?: string
  defaultLocation?: string
  defaultInstructor?: string
}

export function MultiDatePicker({
  value = [],
  onChange,
  label = "Session Dates",
  required = false,
  className = "",
  defaultLocation = "",
  defaultInstructor = ""
}: MultiDatePickerProps) {
  const [newDate, setNewDate] = useState<SessionDate>({
    date: '',
    end_time: '',
    location: defaultLocation,
    instructor: defaultInstructor,
    notes: ''
  })

  const addDate = () => {
    if (!newDate.date) return

    const updatedDates = [...value, { ...newDate }]
    // Sort by date
    updatedDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    onChange(updatedDates)
    setNewDate({
      date: '',
      end_time: '',
      location: defaultLocation,
      instructor: defaultInstructor,
      notes: ''
    })
  }

  const removeDate = (index: number) => {
    const updatedDates = value.filter((_, i) => i !== index)
    onChange(updatedDates)
  }

  const updateDate = (index: number, field: keyof SessionDate, newValue: string) => {
    const updatedDates = [...value]
    updatedDates[index] = { ...updatedDates[index], [field]: newValue }
    onChange(updatedDates)
  }

  const formatDateForInput = (isoString: string) => {
    if (!isoString) return ''
    return format(new Date(isoString), "yyyy-MM-dd'T'HH:mm")
  }

  const formatDateForDisplay = (isoString: string) => {
    if (!isoString) return ''
    return format(new Date(isoString), 'EEE, MMM d, yyyy at h:mm a')
  }

  return (
    <div className={className}>
      <Label className="text-base font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {value.length > 0 && (
        <div className="mt-3 space-y-3">
          {value.map((sessionDate, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Session {index + 1}: {formatDateForDisplay(sessionDate.date)}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDate(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Start Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={formatDateForInput(sessionDate.date)}
                      onChange={(e) => updateDate(index, 'date', new Date(e.target.value).toISOString())}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">End Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={sessionDate.end_time ? formatDateForInput(sessionDate.end_time) : ''}
                      onChange={(e) => updateDate(index, 'end_time', e.target.value ? new Date(e.target.value).toISOString() : '')}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </Label>
                    <Input
                      value={sessionDate.location || ''}
                      onChange={(e) => updateDate(index, 'location', e.target.value)}
                      placeholder="e.g., Room A, Online, TBD"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Instructor
                    </Label>
                    <Input
                      value={sessionDate.instructor || ''}
                      onChange={(e) => updateDate(index, 'instructor', e.target.value)}
                      placeholder="e.g., John Doe, TBD"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Session Notes</Label>
                  <Textarea
                    value={sessionDate.notes || ''}
                    onChange={(e) => updateDate(index, 'notes', e.target.value)}
                    placeholder="e.g., Day 1: Introduction to wines, Theory exam"
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-3 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Add Session Date
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Start Date & Time *</Label>
              <Input
                type="datetime-local"
                value={newDate.date ? formatDateForInput(newDate.date) : ''}
                onChange={(e) => setNewDate(prev => ({
                  ...prev,
                  date: e.target.value ? new Date(e.target.value).toISOString() : ''
                }))}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date & Time</Label>
              <Input
                type="datetime-local"
                value={newDate.end_time ? formatDateForInput(newDate.end_time) : ''}
                onChange={(e) => setNewDate(prev => ({
                  ...prev,
                  end_time: e.target.value ? new Date(e.target.value).toISOString() : ''
                }))}
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </Label>
              <Input
                value={newDate.location || ''}
                onChange={(e) => setNewDate(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Room A, Online, TBD"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Instructor
              </Label>
              <Input
                value={newDate.instructor || ''}
                onChange={(e) => setNewDate(prev => ({ ...prev, instructor: e.target.value }))}
                placeholder="e.g., John Doe, TBD"
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Session Notes</Label>
            <Textarea
              value={newDate.notes || ''}
              onChange={(e) => setNewDate(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g., Day 1: Introduction to wines, Theory exam"
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <Button
            onClick={addDate}
            disabled={!newDate.date}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Session Date
          </Button>
        </CardContent>
      </Card>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground mt-2">
          Add one or more session dates for this course offering.
        </p>
      )}

      {value.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>{value.length}</strong> session{value.length !== 1 ? 's' : ''} scheduled
          </p>
          {value.length > 1 && (
            <p className="text-xs text-blue-600 mt-1">
              Course runs from {formatDateForDisplay(value[0].date)} to {formatDateForDisplay(value[value.length - 1].date)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}