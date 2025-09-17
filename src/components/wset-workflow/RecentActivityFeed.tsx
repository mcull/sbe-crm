'use client'

import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle,
  Users,
  Settings,
  XCircle
} from 'lucide-react'

interface RecentActivityFeedProps {
  activities: any[]
}

const activityIcons = {
  'squarespace_order_received': Users,
  'candidate_created': Users,
  'candidate_updated': Users,
  'forms_generation_started': FileText,
  'exam_order_form_generated': FileText,
  'candidate_registration_generated': FileText,
  'forms_generation_completed': CheckCircle,
  'wset_submission_started': Mail,
  'wset_email_sent': Mail,
  'wset_confirmation_received': CheckCircle,
  'wset_results_received': Mail,
  'certificates_extracted': FileText,
  'student_results_sent': Mail,
  'manual_review_started': AlertTriangle,
  'manual_review_completed': CheckCircle,
  'manual_form_edit': Settings,
  'manual_resubmission': Mail,
  'processing_error': XCircle,
  'error_resolved': CheckCircle,
  'workflow_restarted': Settings,
  'deadline_warning': AlertTriangle,
  'compliance_check': Settings
}

const activityColors = {
  'squarespace_order_received': 'bg-blue-100 text-blue-800',
  'candidate_created': 'bg-green-100 text-green-800',
  'candidate_updated': 'bg-blue-100 text-blue-800',
  'forms_generation_started': 'bg-purple-100 text-purple-800',
  'exam_order_form_generated': 'bg-purple-100 text-purple-800',
  'candidate_registration_generated': 'bg-purple-100 text-purple-800',
  'forms_generation_completed': 'bg-green-100 text-green-800',
  'wset_submission_started': 'bg-orange-100 text-orange-800',
  'wset_email_sent': 'bg-orange-100 text-orange-800',
  'wset_confirmation_received': 'bg-green-100 text-green-800',
  'wset_results_received': 'bg-green-100 text-green-800',
  'certificates_extracted': 'bg-purple-100 text-purple-800',
  'student_results_sent': 'bg-green-100 text-green-800',
  'manual_review_started': 'bg-yellow-100 text-yellow-800',
  'manual_review_completed': 'bg-green-100 text-green-800',
  'manual_form_edit': 'bg-blue-100 text-blue-800',
  'manual_resubmission': 'bg-orange-100 text-orange-800',
  'processing_error': 'bg-red-100 text-red-800',
  'error_resolved': 'bg-green-100 text-green-800',
  'workflow_restarted': 'bg-blue-100 text-blue-800',
  'deadline_warning': 'bg-yellow-100 text-yellow-800',
  'compliance_check': 'bg-blue-100 text-blue-800'
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No recent activity found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Activity will appear here as orders are processed.
        </p>
      </div>
    )
  }

  const formatActionName = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.action as keyof typeof activityIcons] || Clock
        const colorClass = activityColors[activity.action as keyof typeof activityColors] || 'bg-gray-100 text-gray-800'

        return (
          <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
            <div className="flex-shrink-0">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={colorClass}>
                    {formatActionName(activity.action)}
                  </Badge>
                  {activity.automated === false && (
                    <Badge variant="outline" className="text-xs">
                      Manual
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {getRelativeTime(activity.created_at)}
                </div>
              </div>

              <div className="mt-1 space-y-1">
                {/* User info */}
                {activity.users && (
                  <div className="text-sm text-muted-foreground">
                    by {activity.users.first_name} {activity.users.last_name}
                  </div>
                )}

                {/* Workflow context */}
                {activity.wset_workflow_states && (
                  <div className="text-sm text-muted-foreground">
                    Order: {activity.wset_workflow_states.squarespace_order_id}
                    {activity.wset_workflow_states.status && (
                      <span className="ml-2">
                        • Status: {activity.wset_workflow_states.status}
                      </span>
                    )}
                  </div>
                )}

                {/* Activity details */}
                {activity.details && Object.keys(activity.details).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {/* Display relevant details based on action type */}
                    {activity.details.orderId && (
                      <span>Order: {activity.details.orderId}</span>
                    )}
                    {activity.details.orderNumber && (
                      <span>Order #{activity.details.orderNumber}</span>
                    )}
                    {activity.details.customerEmail && (
                      <span> • Customer: {activity.details.customerEmail}</span>
                    )}
                    {activity.details.error && (
                      <div className="text-red-600 mt-1">
                        Error: {activity.details.error}
                      </div>
                    )}
                    {activity.details.formType && (
                      <span>Form: {activity.details.formType}</span>
                    )}
                    {activity.details.emailTo && (
                      <span>To: {activity.details.emailTo}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Load more activities */}
      <div className="text-center pt-4">
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Load more activities...
        </button>
      </div>
    </div>
  )
}