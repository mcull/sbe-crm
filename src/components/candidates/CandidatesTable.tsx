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
import { MoreHorizontal, Edit, Trash2, Mail } from 'lucide-react'
import { deleteCandidate } from '@/lib/actions/candidates'

type Candidate = Database['public']['Tables']['candidates']['Row']

interface CandidatesTableProps {
  candidates: Candidate[]
}

export default function CandidatesTable({ candidates }: CandidatesTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null)

  const handleDeleteClick = (candidate: Candidate) => {
    setCandidateToDelete(candidate)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (candidateToDelete) {
      await deleteCandidate(candidateToDelete.id)
      setDeleteDialogOpen(false)
      setCandidateToDelete(null)
    }
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No candidates found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/candidates/new">Add your first candidate</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.id}>
              <TableCell>
                <div className="font-medium">
                  {candidate.first_name} {candidate.last_name}
                </div>
                {candidate.notes && (
                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                    {candidate.notes}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{candidate.email}</span>
                </div>
              </TableCell>
              <TableCell>
                {candidate.phone ? (
                  <Badge variant="secondary">{candidate.phone}</Badge>
                ) : (
                  <span className="text-muted-foreground">No phone</span>
                )}
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {new Date(candidate.created_at).toLocaleDateString()}
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
                      <Link href={`/dashboard/candidates/${candidate.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(candidate)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
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
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {candidateToDelete?.first_name} {candidateToDelete?.last_name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}