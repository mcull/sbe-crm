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
import { MoreHorizontal, Edit, Archive, RotateCcw, DollarSign, Clock, Users, BookOpen } from 'lucide-react'
import { archiveOffering, restoreOffering } from '@/lib/actions/offerings'

type Course = Database['public']['Tables']['offerings']['Row']

interface CoursesTableProps {
  courses: Course[]
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

export default function CoursesTable({ courses }: CoursesTableProps) {
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [courseToArchive, setCourseToArchive] = useState<Course | null>(null)
  const [isArchived, setIsArchived] = useState(false)

  const handleArchiveClick = (course: Course) => {
    setCourseToArchive(course)
    setIsArchived(course.metadata?.archived === true)
    setArchiveDialogOpen(true)
  }

  const handleConfirmArchiveAction = async () => {
    if (courseToArchive) {
      if (isArchived) {
        await restoreOffering(courseToArchive.id)
      } else {
        await archiveOffering(courseToArchive.id, 'Archived from courses management')
      }
      setArchiveDialogOpen(false)
      setCourseToArchive(null)
    }
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-10">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No course templates found.</p>
        <Button asChild>
          <Link href="/dashboard/offerings/course/new">Create your first course template</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Course Name</TableHead>
            <TableHead>WSET Level</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{course.name}</span>
                  {course.metadata?.archived && (
                    <Badge variant="secondary" className="text-xs">Archived</Badge>
                  )}
                  {!course.active && !course.metadata?.archived && (
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getWSETLevelColor(course.wset_level || 0)}>
                  Level {course.wset_level || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{course.default_duration_hours || 0} hours</span>
                </div>
              </TableCell>
              <TableCell>
                {course.base_price ? (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${course.base_price}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.default_capacity || 0} max</span>
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
                      <Link href={`/dashboard/offerings/${course.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Course
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleArchiveClick(course)}
                      className={course.metadata?.archived ? "text-blue-600" : "text-amber-600"}
                    >
                      {course.metadata?.archived ? (
                        <>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore Course
                        </>
                      ) : (
                        <>
                          <Archive className="mr-2 h-4 w-4" />
                          Archive Course
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArchived ? 'Restore Course' : 'Archive Course'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArchived ? (
                <>
                  Are you sure you want to restore{' '}
                  <strong>{courseToArchive?.name}</strong>? This will make the course active and available for new sessions.
                </>
              ) : (
                <>
                  Are you sure you want to archive{' '}
                  <strong>{courseToArchive?.name}</strong>? This will deactivate the course and hide it from the main course list, but you can restore it later if needed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={isArchived
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-amber-600 text-white hover:bg-amber-700"
              }
              onClick={handleConfirmArchiveAction}
            >
              {isArchived ? 'Restore Course' : 'Archive Course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}