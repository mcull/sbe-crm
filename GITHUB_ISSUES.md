# GitHub Issues for Squarespace Migration

## Phase 1: Foundation & E-commerce (Issues #15-22)

### Issue #15: Database Schema Setup for E-commerce
**Labels:** `database`, `schema`, `high-priority`
**Milestone:** Phase 1 - E-commerce Foundation

#### Description
Set up the database schema extensions required for e-commerce functionality including products, orders, shopping carts, and related tables.

#### Acceptance Criteria
- [ ] Create `products` table with Stripe integration fields
- [ ] Extend `course_sessions` table with pricing and inventory fields
- [ ] Create `orders` and `order_items` tables
- [ ] Create `shopping_carts` table for session-based carts
- [ ] Create `discount_codes` table for promotional codes
- [ ] Set up proper foreign key relationships and constraints
- [ ] Add database indexes for performance optimization
- [ ] Create RLS policies for secure data access
- [ ] Write database migration scripts
- [ ] Test all table relationships and constraints

#### Technical Details
```sql
-- Tables to create:
- products (stripe integration)
- orders (order management)
- order_items (line items)
- shopping_carts (session persistence)
- discount_codes (promotional system)

-- Extensions to existing tables:
- course_sessions: pricing, inventory, stripe_price_id
```

#### Definition of Done
- All tables created with proper schema
- Migration scripts tested on development database
- RLS policies implemented and tested
- Database relationships verified

---

### Issue #16: Stripe Integration Setup
**Labels:** `payment`, `integration`, `high-priority`
**Milestone:** Phase 1 - E-commerce Foundation

#### Description
Integrate Stripe payment processing for course session purchases, including product creation, price management, and payment intent handling.

#### Acceptance Criteria
- [ ] Set up Stripe account and API keys (test/production)
- [ ] Create Stripe integration utility functions
- [ ] Implement product sync between database and Stripe
- [ ] Create payment intent creation and confirmation
- [ ] Set up webhook endpoint for payment events
- [ ] Implement refund functionality
- [ ] Add error handling and retry logic
- [ ] Create audit logging for payment events
- [ ] Test with Stripe test cards
- [ ] Document API usage and error scenarios

#### Technical Implementation
```typescript
// Core files to create:
- src/lib/stripe/client.ts           // Stripe client setup
- src/lib/stripe/products.ts         // Product management
- src/lib/stripe/payments.ts         // Payment processing
- src/lib/stripe/webhooks.ts         // Webhook handling
- src/app/api/stripe/webhook/route.ts // Webhook endpoint
```

#### Test Cases
- [ ] Test successful payment flow
- [ ] Test failed payment handling
- [ ] Test webhook processing
- [ ] Test refund processing
- [ ] Test duplicate payment prevention

---

### Issue #17: Product Catalog API
**Labels:** `api`, `catalog`, `medium-priority`
**Milestone:** Phase 1 - E-commerce Foundation

#### Description
Create API endpoints for product catalog functionality, including course session availability, pricing, and inventory management.

#### Acceptance Criteria
- [ ] Create GET `/api/products` endpoint for catalog
- [ ] Create GET `/api/products/[id]` for individual products
- [ ] Create GET `/api/course-sessions/available` for bookable sessions
- [ ] Implement inventory tracking and availability checks
- [ ] Add pricing calculation (base price, early bird, discounts)
- [ ] Create caching strategy for performance
- [ ] Add rate limiting and security measures
- [ ] Document API endpoints with examples
- [ ] Add comprehensive error handling
- [ ] Create API response schemas with TypeScript

#### API Endpoints
```
GET /api/products                    # List all active products
GET /api/products/[id]               # Get product details
GET /api/course-sessions/available   # Available sessions for booking
GET /api/course-sessions/[id]        # Session details with pricing
POST /api/products/sync-stripe       # Admin: sync with Stripe
```

#### Response Schema
```typescript
interface Product {
  id: string
  name: string
  description: string
  type: 'course_session'
  pricing: {
    base_price: number
    early_bird_price?: number
    early_bird_deadline?: string
  }
  availability: {
    total_spots: number
    available_spots: number
    registration_deadline?: string
  }
}
```

---

### Issue #18: Shopping Cart Implementation
**Labels:** `cart`, `frontend`, `high-priority`
**Milestone:** Phase 1 - E-commerce Foundation

#### Description
Implement shopping cart functionality with session persistence, add/remove items, and cart state management.

#### Acceptance Criteria
- [ ] Create cart context for React state management
- [ ] Implement add to cart functionality
- [ ] Create remove from cart and update quantity
- [ ] Add session-based cart persistence
- [ ] Create cart sidebar/drawer component
- [ ] Implement cart totals calculation
- [ ] Add discount code application
- [ ] Create cart abandonment recovery (email capture)
- [ ] Add loading states and error handling
- [ ] Implement cart expiration and cleanup

#### Components to Create
```typescript
- src/components/ecommerce/CartProvider.tsx     # Cart context
- src/components/ecommerce/CartDrawer.tsx       # Cart sidebar
- src/components/ecommerce/CartItem.tsx         # Individual cart item
- src/components/ecommerce/AddToCartButton.tsx  # Add to cart button
- src/lib/cart/cart-utils.ts                   # Cart calculations
- src/app/api/cart/route.ts                    # Cart persistence API
```

#### User Stories
- As a customer, I can add course sessions to my cart
- As a customer, I can view my cart contents anytime
- As a customer, I can remove items or update quantities
- As a customer, I can apply discount codes
- As a customer, my cart persists across browser sessions

---

### Issue #19: Checkout Flow Implementation
**Labels:** `checkout`, `payment`, `high-priority`
**Milestone:** Phase 1 - E-commerce Foundation

#### Description
Build the complete checkout flow from cart review to payment confirmation, including customer information collection and payment processing.

#### Acceptance Criteria
- [ ] Create multi-step checkout process
- [ ] Build customer information form (billing details)
- [ ] Implement order review and confirmation step
- [ ] Integrate Stripe Elements for payment
- [ ] Add order summary with totals breakdown
- [ ] Implement discount code validation and application
- [ ] Create order confirmation page
- [ ] Send confirmation email to customer
- [ ] Handle payment errors gracefully
- [ ] Add checkout abandonment tracking

#### Checkout Steps
1. **Cart Review**: Verify items and quantities
2. **Customer Info**: Collect billing and contact details
3. **Payment**: Stripe payment form
4. **Confirmation**: Order success and next steps

#### Pages to Create
```
src/app/checkout/
├── page.tsx              # Checkout landing (cart review)
├── customer/page.tsx     # Customer information
├── payment/page.tsx      # Payment processing
└── confirmation/page.tsx # Order confirmation
```

#### Form Validation
- Required fields: name, email, phone
- Email format validation
- Phone number formatting
- Payment form validation (handled by Stripe)

---

### Issue #20: Order Management System
**Labels:** `orders`, `admin`, `high-priority`
**Milestone:** Phase 1 - E-commerce Foundation

#### Description
Create order management functionality for viewing, processing, and managing customer orders from the admin panel.

#### Acceptance Criteria
- [ ] Create orders list view in admin panel
- [ ] Build individual order detail page
- [ ] Implement order status management
- [ ] Add order search and filtering
- [ ] Create order export functionality
- [ ] Build customer order history view
- [ ] Implement order notes and internal comments
- [ ] Add refund processing interface
- [ ] Create order analytics dashboard
- [ ] Set up automated order processing workflows

#### Admin Features
```
/admin/orders/
├── page.tsx              # Orders list with filters
├── [id]/page.tsx         # Order detail page
└── analytics/page.tsx    # Order analytics
```

#### Order Statuses
- `pending`: Payment processing
- `paid`: Payment confirmed, needs processing
- `processing`: Being prepared/enrolled
- `completed`: Student enrolled and confirmed
- `refunded`: Order refunded
- `failed`: Payment failed

#### Automated Workflows
- Send confirmation email on payment
- Create candidate record automatically
- Enroll student in course session
- Send pre-course materials
- Update inventory counts

---

### Issue #21: Email Automation System
**Labels:** `email`, `automation`, `medium-priority`
**Milestone:** Phase 1 - E-commerce Foundation

#### Description
Implement email automation for order confirmations, course reminders, and customer communications.

#### Acceptance Criteria
- [ ] Set up email service (Resend or SendGrid)
- [ ] Create email templates for different scenarios
- [ ] Build order confirmation email automation
- [ ] Implement course reminder emails
- [ ] Create welcome email series for new customers
- [ ] Add email preference management
- [ ] Implement email delivery tracking
- [ ] Create admin email notification system
- [ ] Add email analytics and reporting
- [ ] Set up email deliverability monitoring

#### Email Templates
```typescript
// Email scenarios to implement:
- Order confirmation
- Payment receipt
- Course enrollment confirmation
- Course reminder (1 week before)
- Course materials delivery
- Post-course follow-up
- Cart abandonment recovery
```

#### Email Service Integration
```typescript
- src/lib/email/client.ts          # Email service client
- src/lib/email/templates/         # Email templates
- src/lib/email/automation.ts      # Automated email triggers
- src/app/api/email/webhooks/      # Email delivery webhooks
```

---

### Issue #22: E-commerce Testing Suite
**Labels:** `testing`, `quality`, `medium-priority`
**Milestone:** Phase 1 - E-commerce Foundation

#### Description
Create comprehensive testing suite for e-commerce functionality covering payments, orders, and cart operations.

#### Acceptance Criteria
- [ ] Set up testing environment with test database
- [ ] Create Stripe test mode configuration
- [ ] Write unit tests for cart functionality
- [ ] Create integration tests for payment flow
- [ ] Build end-to-end tests for complete purchase flow
- [ ] Add performance tests for high-traffic scenarios
- [ ] Create load tests for checkout process
- [ ] Implement payment testing with various scenarios
- [ ] Add database integrity tests
- [ ] Create automated testing pipeline

#### Test Categories
```typescript
// Unit Tests
- Cart calculations
- Pricing logic
- Inventory management
- Email formatting

// Integration Tests
- Stripe payment processing
- Database operations
- Email delivery
- Order workflows

// E2E Tests
- Complete purchase flow
- Admin order management
- Customer account features
- Error handling scenarios
```

---

## Phase 2: Admin Integration (Issues #23-25)

### Issue #23: Move Existing Admin to /admin Routes
**Labels:** `refactor`, `admin`, `high-priority`
**Milestone:** Phase 2 - Admin Integration

#### Description
Restructure the existing admin/dashboard functionality to live under `/admin` routes to make room for the public website.

#### Acceptance Criteria
- [ ] Create new `/admin` route structure
- [ ] Move all existing dashboard pages to `/admin/dashboard`
- [ ] Update all internal navigation links
- [ ] Redirect old dashboard URLs to new admin URLs
- [ ] Update authentication checks for admin routes
- [ ] Test all existing admin functionality works
- [ ] Update any hardcoded URLs in components
- [ ] Update deployment configuration if needed
- [ ] Create admin-specific layout and navigation
- [ ] Update documentation with new URL structure

#### File Structure Changes
```
Before: /dashboard/...
After:  /admin/dashboard/...

Files to move:
- src/app/dashboard/ → src/app/admin/dashboard/
- Update all Link components
- Update middleware.ts routes
- Update navigation components
```

#### Breaking Changes
- All dashboard URLs change from `/dashboard/*` to `/admin/dashboard/*`
- Need 301 redirects for existing bookmarks
- Update any external links to admin

---

### Issue #24: E-commerce Admin Interface
**Labels:** `admin`, `ecommerce`, `high-priority`
**Milestone:** Phase 2 - Admin Integration

#### Description
Add e-commerce management capabilities to the admin interface including product management, order processing, and sales analytics.

#### Acceptance Criteria
- [ ] Create products management interface
- [ ] Build order processing workflow
- [ ] Add inventory management for course sessions
- [ ] Create pricing management tools
- [ ] Implement discount code management
- [ ] Add sales analytics dashboard
- [ ] Create customer management interface
- [ ] Build refund processing interface
- [ ] Add bulk operations for orders
- [ ] Implement reporting and export features

#### Admin Pages to Create
```
/admin/
├── ecommerce/
│   ├── products/              # Product catalog management
│   ├── orders/               # Order processing
│   ├── customers/            # Customer management
│   ├── discounts/            # Discount code management
│   ├── analytics/            # Sales analytics
│   └── settings/             # E-commerce configuration
```

#### Key Features
- Real-time order notifications
- One-click student enrollment from orders
- Inventory alerts for low availability
- Revenue reporting and trends
- Customer lifetime value tracking

---

### Issue #25: Unified Customer Database
**Labels:** `database`, `integration`, `medium-priority`
**Milestone:** Phase 2 - Admin Integration

#### Description
Merge the candidate management system with e-commerce customer data to create a unified customer database.

#### Acceptance Criteria
- [ ] Extend candidates table with e-commerce fields
- [ ] Create customer-order relationship mapping
- [ ] Implement customer purchase history
- [ ] Build unified customer profile view
- [ ] Add customer segmentation capabilities
- [ ] Create customer communication preferences
- [ ] Implement customer lifecycle tracking
- [ ] Add customer analytics and insights
- [ ] Create customer export functionality
- [ ] Build customer support interface

#### Database Changes
```sql
-- Extend candidates table
ALTER TABLE candidates ADD COLUMN customer_since DATE;
ALTER TABLE candidates ADD COLUMN total_orders INTEGER DEFAULT 0;
ALTER TABLE candidates ADD COLUMN lifetime_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE candidates ADD COLUMN marketing_consent BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN communication_preferences JSONB;

-- Link orders to candidates
ALTER TABLE orders ADD COLUMN candidate_id UUID REFERENCES candidates(id);
```

---

## Phase 3: Public Website Framework (Issues #26-30)

### Issue #26: Asset Migration from Squarespace
**Labels:** `migration`, `assets`, `medium-priority`
**Milestone:** Phase 3 - Public Website

#### Description
Create scripts to scrape and migrate all assets (images, documents, stylesheets) from the current Squarespace website.

#### Acceptance Criteria
- [ ] Build web scraper for Squarespace site
- [ ] Download all images and optimize for web
- [ ] Extract and convert CSS/styling
- [ ] Migrate downloadable resources (PDFs, etc.)
- [ ] Create asset organization structure
- [ ] Implement image optimization pipeline
- [ ] Set up CDN for asset delivery
- [ ] Create asset management interface
- [ ] Generate asset inventory report
- [ ] Test all migrated assets load correctly

#### Technical Implementation
```typescript
// Scripts to create:
- scripts/scrape-squarespace.js     # Main scraping script
- scripts/optimize-images.js        # Image optimization
- scripts/generate-asset-map.js     # Asset inventory
- src/lib/assets/asset-utils.ts     # Asset helper functions
```

---

### Issue #27: Public Website Layout and Navigation
**Labels:** `frontend`, `design`, `medium-priority`
**Milestone:** Phase 3 - Public Website

#### Description
Create the main layout, navigation, and design system for the public-facing website matching the current Squarespace design.

#### Acceptance Criteria
- [ ] Create responsive public website layout
- [ ] Build main navigation menu
- [ ] Implement footer with all current links
- [ ] Create mobile-responsive navigation
- [ ] Add search functionality
- [ ] Implement breadcrumb navigation
- [ ] Create loading states and error pages
- [ ] Add accessibility features (ARIA, keyboard nav)
- [ ] Implement SEO-optimized meta tags
- [ ] Create design system components

#### Layout Components
```typescript
- src/components/public/Layout.tsx       # Main public layout
- src/components/public/Navigation.tsx   # Main nav menu
- src/components/public/Footer.tsx       # Footer component
- src/components/public/Header.tsx       # Header with logo/nav
- src/components/public/SearchBar.tsx    # Site search
```

---

### Issue #28: Content Management System
**Labels:** `cms`, `content`, `medium-priority`
**Milestone:** Phase 3 - Public Website

#### Description
Build a flexible content management system for creating and managing website pages and content blocks.

#### Acceptance Criteria
- [ ] Create page builder interface in admin
- [ ] Implement drag-and-drop content blocks
- [ ] Build content block templates (hero, text, images, etc.)
- [ ] Add rich text editor for content
- [ ] Implement media library management
- [ ] Create page preview functionality
- [ ] Add content versioning and drafts
- [ ] Implement content publishing workflow
- [ ] Create SEO management tools
- [ ] Add content scheduling features

#### Content Block Types
```typescript
interface ContentBlock {
  hero: HeroBlock           # Main page headers
  text: TextBlock           # Rich text content
  image: ImageBlock         # Images with captions
  course_grid: CourseGrid   # Course listings
  testimonials: TestimonialBlock
  cta: CallToActionBlock    # Conversion elements
  faq: FAQBlock            # Frequently asked questions
  contact_form: ContactForm # Lead generation forms
}
```

---

### Issue #29: Course Catalog Public Pages
**Labels:** `catalog`, `frontend`, `high-priority`
**Milestone:** Phase 3 - Public Website

#### Description
Build public-facing course catalog pages with course details, session availability, and booking integration.

#### Acceptance Criteria
- [ ] Create course catalog overview page
- [ ] Build individual course detail pages
- [ ] Add course session listings with availability
- [ ] Implement course filtering and search
- [ ] Create course comparison functionality
- [ ] Add related courses suggestions
- [ ] Implement course reviews/testimonials
- [ ] Create course prerequisites display
- [ ] Add social sharing for courses
- [ ] Integrate with booking/cart system

#### Public Course Pages
```
src/app/(public)/courses/
├── page.tsx                    # Course catalog
├── [slug]/page.tsx            # Individual course
├── [slug]/sessions/page.tsx   # Available sessions
└── compare/page.tsx           # Course comparison
```

#### SEO Features
- Course schema markup
- Dynamic meta tags
- Social media previews
- Course sitemap generation

---

### Issue #30: Contact and Lead Generation
**Labels:** `forms`, `leads`, `medium-priority`
**Milestone:** Phase 3 - Public Website

#### Description
Create contact forms, lead generation tools, and inquiry management system.

#### Acceptance Criteria
- [ ] Build contact form with validation
- [ ] Create course inquiry forms
- [ ] Add newsletter signup functionality
- [ ] Implement lead scoring and tracking
- [ ] Create lead management in admin
- [ ] Add automated lead follow-up emails
- [ ] Build quote request functionality
- [ ] Create consultation booking system
- [ ] Implement form spam protection
- [ ] Add form submission analytics

#### Form Types
- General contact form
- Course inquiry form
- Corporate training request
- Partnership inquiry
- Support ticket form

---

## Phase 4: Content Migration (Issues #31-33)

### Issue #31: Content Scraping and Import
**Labels:** `migration`, `content`, `low-priority`
**Milestone:** Phase 4 - Content Migration

#### Description
Scrape all existing content from Squarespace and import into the new CMS system.

#### Acceptance Criteria
- [ ] Scrape all page content from Squarespace
- [ ] Parse and clean HTML content
- [ ] Convert to content block format
- [ ] Import content into database
- [ ] Preserve URL structure and redirects
- [ ] Maintain SEO metadata
- [ ] Verify content accuracy and formatting
- [ ] Create content migration report
- [ ] Set up 301 redirects for old URLs
- [ ] Test all migrated content renders correctly

---

### Issue #32: SEO Migration and Optimization
**Labels:** `seo`, `migration`, `medium-priority`
**Milestone:** Phase 4 - Content Migration

#### Description
Ensure SEO rankings are maintained or improved during the migration from Squarespace.

#### Acceptance Criteria
- [ ] Audit current SEO performance
- [ ] Create comprehensive redirect mapping
- [ ] Implement structured data markup
- [ ] Optimize page loading speeds
- [ ] Set up Google Search Console
- [ ] Create XML sitemap generation
- [ ] Implement meta tag management
- [ ] Add Open Graph and Twitter cards
- [ ] Create SEO monitoring dashboard
- [ ] Submit sitemap to search engines

---

### Issue #33: Performance Optimization
**Labels:** `performance`, `optimization`, `medium-priority`
**Milestone:** Phase 4 - Content Migration

#### Description
Optimize website performance to meet or exceed current Squarespace site speed.

#### Acceptance Criteria
- [ ] Implement image optimization and lazy loading
- [ ] Set up CDN for static assets
- [ ] Optimize database queries and caching
- [ ] Implement service worker for offline functionality
- [ ] Add progressive loading for heavy content
- [ ] Optimize CSS and JavaScript bundles
- [ ] Implement prefetching for critical pages
- [ ] Add performance monitoring
- [ ] Achieve Lighthouse score >90
- [ ] Ensure mobile performance optimization

---

## Phase 5: Launch and Optimization (Issues #34-37)

### Issue #34: Production Deployment and Monitoring
**Labels:** `deployment`, `monitoring`, `high-priority`
**Milestone:** Phase 5 - Launch

#### Description
Set up production deployment pipeline, monitoring, and alerting systems for the new website.

#### Acceptance Criteria
- [ ] Configure production environment on Vercel
- [ ] Set up environment variables and secrets
- [ ] Implement database backup strategy
- [ ] Create deployment pipeline with staging
- [ ] Set up uptime monitoring
- [ ] Implement error tracking (Sentry)
- [ ] Create performance monitoring dashboard
- [ ] Set up automated alerts for issues
- [ ] Configure log aggregation and analysis
- [ ] Create incident response procedures

---

### Issue #35: Analytics and Tracking Setup
**Labels:** `analytics`, `tracking`, `medium-priority`
**Milestone:** Phase 5 - Launch

#### Description
Implement comprehensive analytics tracking for user behavior, conversions, and business metrics.

#### Acceptance Criteria
- [ ] Set up Google Analytics 4
- [ ] Implement e-commerce tracking
- [ ] Create custom conversion events
- [ ] Set up goal tracking and funnels
- [ ] Add heat mapping (Hotjar/Microsoft Clarity)
- [ ] Implement A/B testing framework
- [ ] Create admin analytics dashboard
- [ ] Set up automated reporting
- [ ] Track customer acquisition costs
- [ ] Monitor key business metrics

---

### Issue #36: DNS Migration and Go-Live
**Labels:** `dns`, `launch`, `high-priority`
**Milestone:** Phase 5 - Launch

#### Description
Execute the DNS migration to switch from Squarespace to the new Next.js website.

#### Acceptance Criteria
- [ ] Prepare DNS migration plan
- [ ] Set up domain configuration on Vercel
- [ ] Configure SSL certificates
- [ ] Plan maintenance window
- [ ] Execute DNS switchover
- [ ] Monitor site availability during migration
- [ ] Verify all functionality works on production domain
- [ ] Update any hardcoded URLs
- [ ] Test email delivery and forms
- [ ] Create rollback plan if needed

---

### Issue #37: Post-Launch Optimization and Support
**Labels:** `optimization`, `support`, `medium-priority`
**Milestone:** Phase 5 - Launch

#### Description
Monitor post-launch performance and implement optimizations based on real user data.

#### Acceptance Criteria
- [ ] Monitor site performance for first 48 hours
- [ ] Collect and analyze user feedback
- [ ] Fix any critical issues discovered
- [ ] Optimize based on real user metrics
- [ ] Create user documentation and help guides
- [ ] Train staff on new admin interface
- [ ] Set up customer support processes
- [ ] Create backup and recovery procedures
- [ ] Plan ongoing maintenance schedule
- [ ] Document lessons learned and improvements

---

## Issue Dependencies

### Critical Path
```
#15 (Database) → #16 (Stripe) → #18 (Cart) → #19 (Checkout) → #20 (Orders)
#23 (Admin Move) → #24 (E-commerce Admin) → #25 (Customer DB)
#26 (Assets) → #27 (Layout) → #28 (CMS) → #29 (Catalog)
#34 (Deployment) → #36 (DNS Migration) → #37 (Post-Launch)
```

### Parallel Development
- Issues #15-17 can be developed simultaneously
- Issues #26-30 can be developed in parallel with Phase 2
- Issues #31-33 can be started once CMS is ready
- Testing (#22) runs throughout all phases

This comprehensive issue breakdown provides clear deliverables, acceptance criteria, and technical specifications for each phase of the migration project.