# Database Setup Instructions

## Running the Database Migrations

Execute these SQL files in your Supabase SQL Editor in order:

1. **01_create_tables.sql** - Creates all tables, types, and indexes
2. **02_create_functions.sql** - Creates database functions and triggers
3. **03_row_level_security.sql** - Sets up RLS policies and auth triggers
4. **04_sample_data.sql** - Inserts sample WSET courses and sessions

## Important Notes

- The database is designed with Row Level Security (RLS) enabled
- Only authenticated users can access data
- Two user roles: 'owner' (full access) and 'admin' (standard access)
- Owner users can manage other users
- Enrollment and exam registration counts are automatically maintained via triggers

## Initial Admin Users

After running the migrations, you'll need to:

1. Create your admin accounts through the Supabase Auth interface
2. Update the first user to have 'owner' role:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE users SET role = 'owner' WHERE email = 'your-email@example.com';
```

## Schema Overview

- **users**: Application users linked to Supabase auth
- **candidates**: Students who enroll in courses
- **courses**: WSET course templates (Level 1-4)
- **course_sessions**: Scheduled instances of courses
- **enrollments**: Links candidates to course sessions
- **exams**: Scheduled exams for courses
- **exam_results**: Individual exam results and certificates