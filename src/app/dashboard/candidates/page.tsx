import { Suspense } from 'react'
import { getCandidates } from '@/lib/actions/candidates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import CandidatesTable from '@/components/candidates/CandidatesTable'
import CandidatesSearch from '@/components/candidates/CandidatesSearch'

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  const candidates = await getCandidates()

  // Filter candidates based on search query
  const filteredCandidates = searchParams.search
    ? candidates.filter(
        (candidate) =>
          candidate.first_name.toLowerCase().includes(searchParams.search!.toLowerCase()) ||
          candidate.last_name.toLowerCase().includes(searchParams.search!.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchParams.search!.toLowerCase())
      )
    : candidates

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground">
            Manage students enrolled in WSET courses
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/candidates/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <CandidatesSearch />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All Candidates ({filteredCandidates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading candidates...</div>}>
            <CandidatesTable candidates={filteredCandidates} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}