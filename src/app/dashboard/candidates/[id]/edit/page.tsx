import { notFound } from 'next/navigation'
import { getCandidate } from '@/lib/actions/candidates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CandidateForm from '@/components/candidates/CandidateForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function EditCandidatePage({
  params,
}: {
  params: { id: string }
}) {
  let candidate
  try {
    candidate = await getCandidate(params.id)
  } catch {
    notFound()
  }

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
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Candidate
          </h1>
          <p className="text-muted-foreground">
            Update {candidate.first_name} {candidate.last_name}&apos;s information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidateForm candidate={candidate} />
        </CardContent>
      </Card>
    </div>
  )
}