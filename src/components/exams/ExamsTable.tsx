'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Database } from '@/lib/database.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MoreHorizontal, Edit, Trash2, Users, MapPin, Calendar, Clock } from 'lucide-react'
import { deleteExam } from '@/lib/actions/exams'

type Exam = Database['public']['Tables']['exams']['Row'] & {
  courses: {
    id: string
    name: string
    wset_level: number
  } | null
}

interface ExamsTableProps {
  exams: Exam[]
}

const examTypeColors = {
  theory: 'bg-blue-100 text-blue-800',
  tasting: 'bg-purple-100 text-purple-800',
  practical: 'bg-green-100 text-green-800',
}

const examTypeIcons = {
  theory: '📚',
  tasting: '🍷',
  practical: '🔧',
}

export default function ExamsTable({ exams }: ExamsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)

  const handleDeleteClick = (exam: Exam) => {
    setExamToDelete(exam)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (examToDelete) {
      await deleteExam(examToDelete.id)
      setDeleteDialogOpen(false)
      setExamToDelete(null)
    }
  }

  const getExamStatus = (examDate: string) => {
    const now = new Date()
    const exam = new Date(examDate)
    const diffDays = Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return { label: 'Completed', variant: 'secondary' as const }
    } else if (diffDays === 0) {
      return { label: 'Today', variant: 'destructive' as const }
    } else if (diffDays <= 7) {
      return { label: 'This Week', variant: 'destructive' as const }
    } else if (diffDays <= 30) {
      return { label: 'This Month', variant: 'default' as const }
    } else {
      return { label: 'Scheduled', variant: 'outline' as const }
    }
  }

  if (exams.length === 0) {
    return (
      <div className="text-center py-10">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">No exams scheduled.</p>
        <Button asChild>
          <Link href="/dashboard/exams/new">Schedule your first exam</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course & Type</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.map((exam) => {
            const status = getExamStatus(exam.exam_date)
            const capacityPercentage = exam.max_candidates > 0
              ? ((exam.current_registrations || 0) / exam.max_candidates) * 100
              : 0

            return (
              <TableRow key={exam.id}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {exam.courses?.name || 'Unknown Course'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={examTypeColors[exam.exam_type]}>
                        {examTypeIcons[exam.exam_type]} {exam.exam_type}
                      </Badge>
                      <Badge variant="outline">
                        Level {exam.courses?.wset_level || '?'}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {new Date(exam.exam_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(exam.exam_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{exam.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        {exam.current_registrations || 0} / {exam.max_candidates}
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            capacityPercentage >= 100 ? 'bg-red-500' :
                            capacityPercentage >= 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/exams/${exam.id}`}>
                          <Users className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/exams/${exam.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteClick(exam)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this exam for{' '}
              <strong>{examToDelete?.courses?.name}</strong> on{' '}
              <strong>{examToDelete && new Date(examToDelete.exam_date).toLocaleDateString()}</strong>?
              This action cannot be undone and will remove all associated registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete Exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}