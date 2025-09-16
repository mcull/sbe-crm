'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { MoreHorizontal, Edit, Trash2, Calendar, MapPin, User } from 'lucide-react'
import { deleteCourseSession } from '@/lib/actions/courses'

type CourseSession = {
  id: string
  start_date: string
  end_date: string
  instructor: string | null
  location: string | null
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  current_enrollment: number | null
  courses: {
    name: string
    wset_level: number
    max_capacity: number
  } | null
}

interface SessionsTableProps {
  sessions: CourseSession[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getWSETLevelColor = (level: number) => {
  switch (level) {
    case 1: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 3: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 4: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export default function SessionsTable({ sessions }: SessionsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<CourseSession | null>(null)

  const handleDeleteClick = (session: CourseSession) => {
    setSessionToDelete(session)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (sessionToDelete) {
      await deleteCourseSession(sessionToDelete.id)
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-10">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No course sessions scheduled.</p>
        <Button asChild>
          <Link href="/dashboard/courses/sessions/new">Schedule your first session</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course & Dates</TableHead>
            <TableHead>Instructor & Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Enrollment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{session.courses?.name}</span>
                    <Badge className={getWSETLevelColor(session.courses?.wset_level || 0)}>
                      Level {session.courses?.wset_level}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(session.start_date).toLocaleDateString()} -{' '}
                      {new Date(session.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  {session.instructor && (
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{session.instructor}</span>
                    </div>
                  )}
                  {session.location && (
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{session.location}</span>
                    </div>
                  )}
                  {!session.instructor && !session.location && (
                    <span className="text-sm text-muted-foreground">Not set</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(session.status)}>
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <span className="font-medium">{session.current_enrollment || 0}</span>
                  <span className="text-muted-foreground"> / {session.courses?.max_capacity || 0}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 mt-1">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        ((session.current_enrollment || 0) / (session.courses?.max_capacity || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
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
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/courses/sessions/${session.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Session
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(session)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this{' '}
              <strong>{sessionToDelete?.courses?.name}</strong> session? This will also remove all associated enrollments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}