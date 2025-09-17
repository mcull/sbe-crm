'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react'

interface WSETDeadlineTrackerProps {
  validations: any[]
}

export default function WSETDeadlineTracker({ validations }: WSETDeadlineTrackerProps) {
  if (validations.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No active exam deadlines to track.</p>
      </div>
    )
  }

  // Group validations by urgency
  const overdue = validations.filter(v => v.errors.length > 0)
  const urgent = validations.filter(v => v.workingDaysRemaining <= 2 && v.errors.length === 0)
  const warning = validations.filter(v =>
    v.workingDaysRemaining > 2 && v.workingDaysRemaining <= 5 && v.errors.length === 0
  )
  const compliant = validations.filter(v => v.workingDaysRemaining > 5)

  const getUrgencyColor = (validation: any) => {
    if (validation.errors.length > 0) return 'text-red-600'
    if (validation.workingDaysRemaining <= 2) return 'text-orange-600'
    if (validation.workingDaysRemaining <= 5) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getUrgencyIcon = (validation: any) => {
    if (validation.errors.length > 0) return XCircle
    if (validation.workingDaysRemaining <= 2) return AlertTriangle
    if (validation.workingDaysRemaining <= 5) return Clock
    return CheckCircle
  }

  const calculateProgress = (validation: any) => {
    // Assume 10 working days is the standard (adjust based on exam type)
    const totalDays = validation.examType === 'RI' ? 7 : 10
    const remaining = Math.max(0, validation.workingDaysRemaining)
    return Math.max(0, Math.min(100, ((totalDays - remaining) / totalDays) * 100))
  }

  return (
    <div className="space-y-6">
      {/* Overview alerts */}
      {overdue.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {overdue.length} exam{overdue.length !== 1 ? 's' : ''} past WSET deadline - immediate action required
          </AlertDescription>
        </Alert>
      )}

      {urgent.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {urgent.length} exam{urgent.length !== 1 ? 's' : ''} require urgent submission (≤2 working days remaining)
          </AlertDescription>
        </Alert>
      )}

      {/* Deadline list */}
      <div className="space-y-4">
        {[...overdue, ...urgent, ...warning, ...compliant].map((validation) => {
          const UrgencyIcon = getUrgencyIcon(validation)
          const urgencyColor = getUrgencyColor(validation)
          const progress = calculateProgress(validation)

          return (
            <div key={validation.workflowStateId} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <UrgencyIcon className={`h-5 w-5 mt-0.5 ${urgencyColor}`} />
                  <div>
                    <div className="font-medium">
                      {validation.candidateName || 'Unknown Candidate'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {validation.courseType} • Order: {validation.orderNumber}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    {validation.examType} Exam • Level {validation.level}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    Exam: {new Date(validation.examDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>WSET Submission Progress</span>
                  <span className={urgencyColor}>
                    {validation.errors.length > 0 ? 'Overdue' :
                     validation.workingDaysRemaining === 0 ? 'Due Today' :
                     `${validation.workingDaysRemaining} working days remaining`
                    }
                  </span>
                </div>
                <Progress
                  value={progress}
                  className={`h-2 ${
                    validation.errors.length > 0 ? 'progress-red' :
                    validation.workingDaysRemaining <= 2 ? 'progress-orange' :
                    validation.workingDaysRemaining <= 5 ? 'progress-yellow' :
                    'progress-green'
                  }`}
                />
                <div className="text-xs text-muted-foreground">
                  Deadline: {new Date(validation.submissionDeadline).toLocaleDateString()}
                  {validation.canSubmitLate && (
                    <span className="text-orange-600 ml-2">
                      • Level 1 late submission allowed
                    </span>
                  )}
                </div>
              </div>

              {/* Warnings and errors */}
              {validation.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {validation.warnings.map((warning: string, index: number) => (
                    <div key={index} className="text-xs text-yellow-600 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}

              {validation.errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {validation.errors.map((error: string, index: number) => (
                    <div key={index} className="text-xs text-red-600 flex items-center">
                      <XCircle className="h-3 w-3 mr-1" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{overdue.length}</div>
          <div className="text-xs text-muted-foreground">Overdue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{urgent.length}</div>
          <div className="text-xs text-muted-foreground">Urgent</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{warning.length}</div>
          <div className="text-xs text-muted-foreground">Warning</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{compliant.length}</div>
          <div className="text-xs text-muted-foreground">Compliant</div>
        </div>
      </div>
    </div>
  )
}