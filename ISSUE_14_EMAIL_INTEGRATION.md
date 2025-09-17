# Issue #14: Email-Based Squarespace Order Integration

## Problem Statement
Squarespace API is not available until October 30, but we need WSET workflow automation now. Currently, Phillip receives email notifications for every Squarespace order containing student information.

## Proposed Solution
Create an email-based integration system that:
1. Sets up dedicated `crm@sebeved.com` email account
2. Configures Gmail forwarding rules to send Squarespace order emails to CRM account
3. Implements scheduled job to parse incoming order emails
4. Extracts student data and creates WSET workflow records

## Technical Implementation Plan

### Phase 1: Email Account & Gmail API Setup
- [ ] Create `crm@sebeved.com` Google Workspace account
- [ ] Set up Gmail API service account with appropriate scopes
- [ ] Configure OAuth2 authentication for email access
- [ ] Test email reading capabilities

### Phase 2: Email Forwarding Configuration
- [ ] Set up automatic forwarding rule in Phillip's Gmail
- [ ] Forward Squarespace order emails → `crm@sebeved.com`
- [ ] Test forwarding with sample orders
- [ ] Document email format/structure from Squarespace

### Phase 3: Email Parser Implementation
```typescript
// Core components needed:
- src/lib/email/gmail-client.ts          // Gmail API client
- src/lib/email/order-parser.ts          // Parse Squarespace order emails
- src/lib/email/email-processor.ts       // Main processing logic
- src/app/api/cron/process-emails/route.ts // Scheduled endpoint
```

### Phase 4: Order Data Extraction
- [ ] Parse email subject lines for order identification
- [ ] Extract student information (name, email, phone)
- [ ] Identify WSET course level and exam preferences
- [ ] Handle email attachments if present
- [ ] Map parsed data to existing WSET workflow schema

### Phase 5: Integration with Existing Workflow
- [ ] Connect to existing `workflow_states` table
- [ ] Trigger WSET deadline tracking
- [ ] Create candidate records automatically
- [ ] Send confirmation emails to students
- [ ] Update dashboard with new orders

### Phase 6: Error Handling & Monitoring
- [ ] Handle malformed/unexpected email formats
- [ ] Duplicate order detection and prevention
- [ ] Email processing failure notifications
- [ ] Admin dashboard for email processing status
- [ ] Retry mechanisms for failed parsing

## Gmail API Scopes Required
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.modify  // For marking emails as processed
```

## Environment Variables
```env
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
CRM_EMAIL_ADDRESS=crm@sebeved.com
```

## Cron Job Schedule
- Run every 15 minutes during business hours
- Run every hour outside business hours
- Use Vercel Cron Jobs or similar scheduling service

## Email Processing Workflow
1. **Connect** to Gmail API using service account
2. **Fetch** unread emails in CRM inbox
3. **Filter** for Squarespace order emails (by sender/subject)
4. **Parse** email content to extract order data
5. **Validate** extracted data completeness
6. **Create** candidate and workflow records
7. **Mark** email as processed (apply label)
8. **Log** processing results for monitoring

## Data Mapping Strategy
```typescript
// Email content → Database records
interface SquarespaceEmailOrder {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  courseTitle: string
  orderDate: Date
  orderTotal: number
  // Parse these from email body/subject
}

// Map to existing workflow schema
interface WSETWorkflowState {
  squarespace_order_id: string  // from email
  candidate_id: string          // create new candidate
  course_session_id: string     // match to existing sessions
  submission_deadline: Date     // calculate from order date
  status: 'email_received'      // new status type
}
```

## Benefits
- ✅ Immediate automation without waiting for Squarespace API
- ✅ Uses existing Gmail infrastructure
- ✅ Maintains complete audit trail
- ✅ Can handle all current order formats
- ✅ Easy to extend when Squarespace API becomes available
- ✅ Cost-effective solution

## Migration Path
When Squarespace API becomes available in October:
1. Keep email system as backup
2. Gradually migrate to direct API integration
3. Compare email vs API data for accuracy
4. Eventually deprecate email parsing

## Acceptance Criteria
- [ ] CRM automatically detects new Squarespace orders via email
- [ ] Student data extracted with 95%+ accuracy
- [ ] WSET workflow initiated within 15 minutes of order
- [ ] Admin notifications for processing failures
- [ ] Dashboard shows email processing status
- [ ] No duplicate order processing
- [ ] System handles 50+ orders per day reliably

## Implementation Timeline
- **Week 1**: Gmail API setup + email forwarding
- **Week 2**: Email parser development + testing
- **Week 3**: Integration with existing workflow system
- **Week 4**: Error handling + monitoring + production deployment

## Risk Mitigation
- **Email format changes**: Implement flexible parsing with fallback patterns
- **API rate limits**: Implement exponential backoff and caching
- **Processing failures**: Queue failed emails for manual review
- **Data privacy**: Ensure email content is handled securely and GDPR compliant