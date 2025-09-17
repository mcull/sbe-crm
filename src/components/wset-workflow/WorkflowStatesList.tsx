'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WorkflowState {
  id: string
  status: string
  created_at: string
  requires_review: boolean
  wset_candidates?: {
    order_number: string
    course_type: string
    course_level: number
    exam_type: string
    candidates?: {
      first_name: string
      last_name: string
    }
  }
}

interface DeadlineValidation {
  workflowStateId: string
  examDate: string
  workingDaysRemaining: number
  errors: string[]
}

interface WorkflowStatesListProps {
  workflowStates: WorkflowState[]
  deadlineValidations: DeadlineValidation[]
}

const statusColors = {
  'received': 'bg-blue-100 text-blue-800',
  'processing': 'bg-yellow-100 text-yellow-800',
  'forms_generated': 'bg-purple-100 text-purple-800',
  'submitted': 'bg-orange-100 text-orange-800',
  'confirmed': 'bg-green-100 text-green-800',
  'completed': 'bg-green-100 text-green-800',
  'error': 'bg-red-100 text-red-800'
}

const statusIcons = {
  'received': Clock,
  'processing': Clock,
  'forms_generated': CheckCircle,
  'submitted': Clock,
  'confirmed': CheckCircle,
  'completed': CheckCircle,
  'error': XCircle
}

export default function WorkflowStatesList({
  workflowStates,
  deadlineValidations
}: WorkflowStatesListProps) {
  if (workflowStates.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No active workflows found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Workflows will appear here when Squarespace orders are received.
        </p>
      </div>
    )
  }

  const getDeadlineInfo = (workflowStateId: string) => {
    return deadlineValidations.find(v => v.workflowStateId === workflowStateId)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Candidate</TableHead>
          <TableHead>Course</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workflowStates.map((workflow) => {
          const StatusIcon = statusIcons[workflow.status as keyof typeof statusIcons] || Clock
          const deadlineInfo = getDeadlineInfo(workflow.id)
          const candidate = workflow.wset_candidates?.candidates

          return (
            <TableRow key={workflow.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {candidate ?
                      `${candidate.first_name} ${candidate.last_name}` :
                      'Loading...'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {workflow.wset_candidates?.order_number || 'No order number'}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm font-medium">
                    {workflow.wset_candidates?.course_type || 'Unknown Course'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Level {workflow.wset_candidates?.course_level} • {workflow.wset_candidates?.exam_type}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <StatusIcon className="h-4 w-4" />
                  <Badge className={statusColors[workflow.status as keyof typeof statusColors]}>
                    {workflow.status.replace('_', ' ')}
                  </Badge>
                </div>
                {workflow.requires_review && (
                  <Badge variant="destructive" className="mt-1">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Review Required
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {deadlineInfo ? (
                  <div>
                    <div className={`text-sm font-medium ${
                      deadlineInfo.errors.length > 0 ? 'text-red-600' :
                      deadlineInfo.workingDaysRemaining <= 2 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {deadlineInfo.errors.length > 0 ? 'Overdue' :
                       deadlineInfo.workingDaysRemaining <= 2 ? 'Urgent' :
                       `${deadlineInfo.workingDaysRemaining} days`
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {deadlineInfo.examDate ?
                        new Date(deadlineInfo.examDate).toLocaleDateString() :
                        'No exam date'
                      }
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {new Date(workflow.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(workflow.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Clock className="mr-2 h-4 w-4" />
                      View Logs
                    </DropdownMenuItem>
                    {workflow.requires_review && (
                      <DropdownMenuItem>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Review
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}