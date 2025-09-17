'use client'

import { useState } from 'react'
import { updateOrderStatus, addOrderNote } from '@/lib/actions/orders'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Edit, MessageSquare, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OrderStatusActionsProps {
  order: any
}

export default function OrderStatusActions({ order }: OrderStatusActionsProps) {
  const [loading, setLoading] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState(order.status)
  const [newFulfillmentStatus, setNewFulfillmentStatus] = useState(order.fulfillment_status)
  const [note, setNote] = useState('')
  const [isAdminNote, setIsAdminNote] = useState(true)
  const router = useRouter()

  const handleStatusUpdate = async () => {
    setLoading(true)
    try {
      await updateOrderStatus(order.id, newStatus, newFulfillmentStatus)
      setStatusDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!note.trim()) return

    setLoading(true)
    try {
      await addOrderNote(order.id, note, isAdminNote)
      setNote('')
      setNoteDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error adding note:', error)
      alert('Failed to add note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Update Status */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <Edit className="mr-2 h-4 w-4" />
            Update Status
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the order and fulfillment status for order {order.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Order Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fulfillment">Fulfillment Status</Label>
              <Select value={newFulfillmentStatus} onValueChange={setNewFulfillmentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <MessageSquare className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              Add a note to order {order.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your note here..."
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="admin-note"
                checked={isAdminNote}
                onChange={(e) => setIsAdminNote(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="admin-note" className="text-sm">
                Admin note (not visible to customer)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} disabled={loading || !note.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}