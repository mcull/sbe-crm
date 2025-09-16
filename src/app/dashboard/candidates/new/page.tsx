import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CandidateForm from '@/components/candidates/CandidateForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewCandidatePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/candidates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Candidate</h1>
          <p className="text-muted-foreground">
            Create a new student record for WSET course enrollment
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidateForm />
        </CardContent>
      </Card>
    </div>
  )
}