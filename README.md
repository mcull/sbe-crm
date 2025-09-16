# SBE CRM - Southeastern Beverage Education

A CRM and workflow manager for WSET-certified wine and spirits education programs.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Workflow Engine**: Inngest

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mcull/sbe-crm.git
cd sbe-crm
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix

## Project Structure

```
src/
├── app/          # Next.js App Router pages and layouts
├── components/   # Reusable React components
└── lib/          # Utility functions and configurations
```

## Core Entities

- **Candidates**: Students enrolled in courses
- **Courses**: WSET-aligned educational programs (Level 1-4)
- **Exams**: Assessments tied to courses
- **Exam Results**: Performance data and certification status

## Development Phases

1. **Foundation**: Next.js setup, Supabase integration, authentication
2. **Core CRM**: Candidate management, course creation, enrollment system
3. **Exam Management**: Scheduling, results tracking, certificate generation
4. **Automation**: Workflow engine, notifications, reminders
5. **Polish & Deploy**: UI improvements, performance optimization

## Contributing

This project follows the GitHub Issues workflow. Check the [Issues](https://github.com/mcull/sbe-crm/issues) and [Milestones](https://github.com/mcull/sbe-crm/milestones) for current development status.

## License

Private project for Southeastern Beverage Education.
