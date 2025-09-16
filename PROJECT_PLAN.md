# Southeastern Beverage Education (SBE) CRM - Project Plan

## Project Overview
A simple, reliable CRM and workflow manager for managing WSET-certified wine and spirits education classes and exams. Designed for ease of use and minimal maintenance.

## Core Entities
- **Candidates**: Students enrolled in courses
- **Courses**: WSET-aligned educational programs
- **Exams**: Assessments tied to courses
- **Exam Results**: Performance data and certification status

## Architecture Recommendations

### Tech Stack
- **Frontend/Backend**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **Hosting**: Vercel (seamless Next.js integration)
- **Workflow Engine**: Inngest (event-driven automation)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (for certificates, documents)

### Why This Stack?
1. **Cheap**: Vercel hobby plan + Supabase free tier covers small-medium usage
2. **Easy**: Minimal configuration, great developer experience
3. **Reliable**: Managed services with built-in scaling and backups
4. **Future-proof**: Easy to extend without major rewrites

### Alternative Consideration: Airtable
**Pros**: No-code, immediate admin interface, built-in workflows
**Cons**: Limited customization, API rate limits, vendor lock-in
**Recommendation**: Start with Next.js + Supabase for better long-term flexibility

## Database Schema (Draft)

### Candidates
```sql
- id (uuid, primary key)
- first_name (text)
- last_name (text)
- email (text, unique)
- phone (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### Courses
```sql
- id (uuid, primary key)
- name (text)
- wset_level (integer) -- 1, 2, 3, 4
- description (text)
- duration_weeks (integer)
- price (decimal)
- max_capacity (integer)
- created_at (timestamp)
```

### Course_Sessions
```sql
- id (uuid, primary key)
- course_id (uuid, foreign key)
- start_date (date)
- end_date (date)
- instructor (text)
- location (text)
- status (enum: scheduled, active, completed, cancelled)
```

### Enrollments
```sql
- id (uuid, primary key)
- candidate_id (uuid, foreign key)
- course_session_id (uuid, foreign key)
- enrollment_date (timestamp)
- payment_status (enum: pending, paid, refunded)
- status (enum: enrolled, completed, dropped)
```

### Exams
```sql
- id (uuid, primary key)
- course_id (uuid, foreign key)
- exam_date (timestamp)
- exam_type (enum: theory, tasting, practical)
- location (text)
- max_candidates (integer)
```

### Exam_Results
```sql
- id (uuid, primary key)
- candidate_id (uuid, foreign key)
- exam_id (uuid, foreign key)
- score (decimal)
- pass_status (boolean)
- certification_issued (boolean)
- result_date (timestamp)
```

## Key Features & User Stories

### Admin Dashboard
- View all candidates, courses, and exam results
- Manage course sessions and scheduling
- Generate reports for WSET compliance
- Bulk operations (email notifications, certificate generation)

### Candidate Portal
- View enrolled courses and upcoming exams
- Download certificates and results
- Update personal information

### Automated Workflows (Inngest)
- Send reminder emails before exams
- Generate certificates after successful completion
- Update WSET compliance records
- Payment processing notifications

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Next.js project setup with TypeScript
- [ ] Supabase database and authentication
- [ ] Basic UI components (shadcn/ui)
- [ ] Admin authentication and basic layout

### Phase 2: Core CRM (Week 3-4)
- [ ] Candidate management (CRUD operations)
- [ ] Course creation and management
- [ ] Enrollment system
- [ ] Basic reporting dashboard

### Phase 3: Exam Management (Week 5-6)
- [ ] Exam scheduling and management
- [ ] Results entry and tracking
- [ ] Certificate generation
- [ ] WSET compliance reporting

### Phase 4: Automation (Week 7-8)
- [ ] Inngest workflow setup
- [ ] Email notifications
- [ ] Automated reminders
- [ ] Payment integration (if needed)

### Phase 5: Polish & Deploy (Week 9-10)
- [ ] UI/UX improvements
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Production deployment
- [ ] User training/documentation

## Risk Mitigation

### Technical Risks
- **Database design changes**: Use Supabase migrations for schema evolution
- **Third-party service outages**: Implement graceful degradation
- **Performance issues**: Leverage Vercel Edge Functions for critical paths

### Business Risks
- **WSET requirement changes**: Modular architecture allows easy updates
- **Scale beyond free tiers**: Predictable pricing models, easy to upgrade
- **User adoption**: Focus on intuitive design and minimal training needs

## Success Metrics
- Reduction in manual administrative work
- Improved candidate communication and satisfaction
- 100% WSET compliance for certification reporting
- System uptime > 99.5%
- Zero data loss incidents

## Next Steps
1. Review and approve this plan
2. Set up development environment
3. Create detailed wireframes/mockups
4. Begin Phase 1 development
5. Establish regular check-ins and feedback loops

## Budget Estimate (Monthly)
- Vercel Pro: $20/month (if needed, starts free)
- Supabase Pro: $25/month (starts free up to certain limits)
- Domain: $1/month
- **Total**: ~$46/month at scale, potentially $0-10/month initially