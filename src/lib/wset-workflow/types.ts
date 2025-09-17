// WSET Workflow Type Definitions
// Based on analysis of WSET artifacts and requirements

export interface SquarespaceOrder {
  id: string
  orderNumber: string
  createdOn: string
  modifiedOn: string
  testMode: boolean

  // Customer information
  customerEmail: string
  billingAddress: {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    countryCode: string
    phone?: string
  }
  shippingAddress?: {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    countryCode: string
    phone?: string
  }

  // Order details
  lineItems: SquarespaceLineItem[]
  grandTotal: {
    value: number
    currency: string
  }

  // Custom fields for course selection
  formSubmission?: {
    birthdate?: string
    gender?: string
    examDate?: string
    courseType?: string
  }
}

export interface SquarespaceLineItem {
  id: string
  variantId: string
  productId: string
  productName: string
  quantity: number
  unitPricePaid: {
    value: number
    currency: string
  }
}

export interface WSETCandidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  birthdate?: string
  gender?: string
  fullAddress: string

  // Order reference
  squarespaceOrderId: string
  orderNumber: string

  // Course details
  courseType: string
  examDate: string
  examType: 'PDF' | 'RI' // In-Person or Remote Invigilation

  createdAt: string
  updatedAt: string
}

export interface WSETExamOrder {
  id: string
  referenceNumber: string // e.g., "L1W-July19,2025"
  examType: 'PDF' | 'RI'
  examDate: string
  courseLevel: 1 | 2 | 3 | 4

  // APP Information (Southeastern Beverage Education)
  appNumber: '2110'
  examinationsOfficer: 'Phillip J. Patti'
  officerPhone: '+1 541-556-7296'

  // Exam details
  examTime: string
  venue: string
  numberOfCandidates: number

  // Candidates
  candidates: WSETCandidate[]

  // Status tracking
  status: 'draft' | 'submitted' | 'confirmed' | 'completed'
  submittedAt?: string
  wsetConfirmationDate?: string

  // Generated documents
  examOrderPdfPath?: string
  candidateRegistrationPath?: string

  createdAt: string
  updatedAt: string
}

export interface WSETWorkflowState {
  id: string
  squarespaceOrderId: string
  status: 'received' | 'processing' | 'forms_generated' | 'submitted' | 'confirmed' | 'completed' | 'error'

  // Workflow steps
  steps: {
    orderReceived: { completed: boolean; timestamp?: string }
    candidateCreated: { completed: boolean; timestamp?: string }
    formsGenerated: { completed: boolean; timestamp?: string }
    wsetSubmitted: { completed: boolean; timestamp?: string }
    wsetConfirmed: { completed: boolean; timestamp?: string }
    resultsReceived: { completed: boolean; timestamp?: string }
    certificatesDistributed: { completed: boolean; timestamp?: string }
  }

  // Error tracking
  errors: Array<{
    step: string
    message: string
    timestamp: string
    resolved: boolean
  }>

  // Manual review flags
  requiresReview: boolean
  reviewReason?: string
  reviewedBy?: string
  reviewedAt?: string

  createdAt: string
  updatedAt: string
}

export interface WSETFormTemplate {
  type: 'exam_order_pdf' | 'exam_order_ri' | 'candidate_registration'
  level: 1 | 2 | 3 | 4
  templatePath: string
  requiredFields: string[]
}

export interface WSETEmail {
  id: string
  to: string // Always 'exams@wsetglobal.com' for submissions
  from: string
  subject: string
  body: string
  attachments: Array<{
    filename: string
    path: string
    contentType: string
  }>

  // Reference to exam order
  examOrderId: string

  // Status
  status: 'draft' | 'sent' | 'delivered' | 'error'
  sentAt?: string
  deliveredAt?: string
  error?: string

  createdAt: string
}

export interface WSETDeadlineCheck {
  examDate: string
  examType: 'PDF' | 'RI'
  level: 1 | 2 | 3 | 4

  // Calculated deadlines
  submissionDeadline: string
  workingDaysRemaining: number
  isCompliant: boolean
  canSubmitLate: boolean // Only for Level 1 PDF

  warnings: string[]
}

// Configuration constants based on WSET requirements
export const WSET_CONFIG = {
  APP_INFO: {
    name: 'Southeastern Beverage Education',
    number: '2110',
    officer: 'Phillip J. Patti',
    phone: '+1 541-556-7296',
    email: 'info@sebeved.com' // Replace with actual email
  },

  DEADLINES: {
    PDF_EXAM_DAYS: 10, // Working days
    RI_EXAM_DAYS: 7,   // Working days
    LEVEL_1_LATE_DAYS: 2 // Working days for late additions
  },

  EMAIL: {
    WSET_SUBMISSION: 'exams@wsetglobal.com',
    SUBJECT_FORMATS: {
      1: 'WSET Level 1 Award in Wines - Exam Submission',
      2: 'WSET Level 2 Award in Wines - Exam Submission',
      3: 'WSET Level 3 Award in Wines - Exam Submission',
      4: 'WSET Level 4 Diploma in Wines - Exam Submission'
    }
  },

  SIGNATURE_PATH: '/signature.png'
} as const