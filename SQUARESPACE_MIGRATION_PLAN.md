# Squarespace to Next.js Migration Plan

## Overview
Migrate SBE Education from Squarespace to a fully integrated Next.js solution with integrated e-commerce, content management, and admin functionality.

## Current State
- **Public Website:** www.sebeved.com (Squarespace)
- **Admin System:** sbe-crm.vercel.app (Next.js + Supabase)
- **E-commerce:** Squarespace Commerce (limited API access)
- **Content:** Squarespace CMS (locked-in platform)

## Target State
- **Public Website:** www.sebeved.com (Next.js)
- **Admin System:** www.sebeved.com/admin (Current CRM moved)
- **E-commerce:** Stripe + Supabase (full control)
- **Content:** Database-driven CMS (Supabase)

---

## Technical Architecture

### File Structure
```
src/app/
├── (public)/              # Public website routes
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Public site layout
│   ├── about/
│   │   ├── page.tsx       # About page
│   │   └── team/page.tsx  # Team page
│   ├── courses/
│   │   ├── page.tsx       # Course catalog
│   │   ├── [slug]/        # Individual course pages
│   │   └── sessions/      # Available sessions
│   ├── contact/
│   │   └── page.tsx       # Contact form
│   ├── blog/              # Blog/news section
│   └── legal/             # Terms, Privacy, etc.
├── admin/                 # Current CRM system (moved)
│   └── dashboard/         # All existing admin functionality
├── checkout/              # E-commerce checkout flows
│   ├── cart/              # Shopping cart
│   ├── payment/           # Stripe payment
│   └── confirmation/      # Order confirmation
├── api/
│   ├── stripe/            # Payment processing webhooks
│   ├── orders/            # Order management
│   ├── content/           # Content API endpoints
│   └── public/            # Public API endpoints
├── components/
│   ├── public/            # Public website components
│   ├── admin/             # Admin components (existing)
│   ├── ecommerce/         # Shopping cart, checkout
│   └── shared/            # Shared components
└── lib/
    ├── stripe/            # Stripe integration
    ├── content/           # Content management
    └── ecommerce/         # E-commerce logic
```

### Database Schema Extensions

#### Content Management Tables
```sql
-- Pages and content management
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  content JSONB NOT NULL DEFAULT '[]',
  published BOOLEAN DEFAULT false,
  featured_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'hero', 'text', 'image', 'course_grid', 'testimonials'
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### E-commerce Tables
```sql
-- E-commerce system
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'course_session', -- 'course_session', 'digital_product'
  stripe_product_id TEXT UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend course_sessions for e-commerce
ALTER TABLE course_sessions ADD COLUMN product_id UUID REFERENCES products(id);
ALTER TABLE course_sessions ADD COLUMN base_price DECIMAL(10,2);
ALTER TABLE course_sessions ADD COLUMN early_bird_price DECIMAL(10,2);
ALTER TABLE course_sessions ADD COLUMN early_bird_deadline DATE;
ALTER TABLE course_sessions ADD COLUMN stripe_price_id TEXT;
ALTER TABLE course_sessions ADD COLUMN available_spots INTEGER;
ALTER TABLE course_sessions ADD COLUMN registration_deadline DATE;

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- Human-readable order number
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  billing_address JSONB,
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  course_session_id UUID REFERENCES course_sessions(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_snapshot JSONB, -- Store product details at time of purchase
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'percentage', 'fixed_amount'
  value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Analytics Tables
```sql
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  session_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'course_view', 'add_to_cart', 'checkout_started', 'purchase'
  session_id TEXT,
  course_session_id UUID REFERENCES course_sessions(id),
  order_id UUID REFERENCES orders(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Migration Phases

### Phase 1: Foundation & E-commerce (Weeks 1-2)
**Priority: HIGH - Immediate business value**
- Database schema setup
- Stripe integration
- Basic product catalog
- Shopping cart functionality
- Checkout flow
- Order management

### Phase 2: Admin Integration (Week 3)
**Priority: HIGH - Required for management**
- Move existing admin to `/admin` routes
- Add e-commerce management to admin
- Order processing workflows
- Inventory management

### Phase 3: Public Website Framework (Week 4)
**Priority: MEDIUM - Can run parallel to Squarespace**
- Asset migration from Squarespace
- Public site layout and navigation
- Content management system
- Basic pages (home, about, contact)

### Phase 4: Content Migration (Week 5)
**Priority: LOW - Can be gradual**
- Scrape existing Squarespace content
- Import content to database
- Dynamic page rendering
- SEO optimization

### Phase 5: Launch & Optimization (Week 6)
**Priority: HIGH - Go-live activities**
- Performance optimization
- SEO migration (301 redirects)
- Analytics setup
- DNS switchover
- Monitoring and alerting

---

## Risk Mitigation

### Technical Risks
1. **SEO Impact**: Implement proper 301 redirects and meta tags
2. **Payment Processing**: Thorough Stripe integration testing
3. **Data Loss**: Comprehensive backup strategy
4. **Performance**: CDN setup and image optimization

### Business Risks
1. **Downtime**: Blue-green deployment strategy
2. **Lost Sales**: Parallel system testing
3. **Customer Confusion**: Clear communication plan
4. **Feature Parity**: Detailed feature comparison audit

### Rollback Plan
1. **DNS Rollback**: Quick DNS change back to Squarespace
2. **Data Sync**: Keep Squarespace active during transition
3. **Order Processing**: Manual order entry if needed
4. **Customer Support**: Dedicated support during transition

---

## Success Metrics

### Technical Metrics
- **Page Load Time**: <2 seconds
- **Payment Success Rate**: >99%
- **Uptime**: >99.9%
- **SEO Rankings**: Maintain or improve current positions

### Business Metrics
- **Conversion Rate**: Match or exceed current rates
- **Order Processing Time**: Reduce from hours to minutes
- **Customer Satisfaction**: Survey scores >4.5/5
- **Admin Efficiency**: Reduce order processing time by 80%

### Cost Metrics
- **Monthly Hosting**: <$100/month (vs Squarespace fees)
- **Transaction Fees**: Stripe 2.9% + 30¢ (vs Squarespace fees)
- **Development Cost**: One-time vs ongoing platform fees

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React hooks + Context
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **API**: Next.js API routes

### E-commerce
- **Payments**: Stripe
- **Cart**: Session-based + Database persistence
- **Inventory**: Real-time availability tracking
- **Orders**: Full order lifecycle management

### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Monitoring**: Vercel Analytics + Custom dashboards
- **Backups**: Supabase automated backups

### Third-party Integrations
- **Email**: Resend or SendGrid
- **Analytics**: Google Analytics 4
- **SEO**: Next.js built-in optimization
- **Error Tracking**: Sentry (optional)

---

## Content Management Strategy

### Page Types
1. **Static Pages**: About, Contact, Legal (template-based)
2. **Dynamic Pages**: Course catalog, individual courses
3. **Landing Pages**: Marketing campaigns, special offers
4. **Blog Posts**: News, updates, educational content

### Content Block Types
```typescript
interface ContentBlock {
  id: string
  type: 'hero' | 'text' | 'image' | 'course_grid' | 'testimonials' | 'cta' | 'faq'
  content: {
    // Type-specific content structure
    title?: string
    subtitle?: string
    body?: string
    image?: string
    courses?: string[] // Course IDs
    testimonials?: Testimonial[]
    cta?: {
      text: string
      link: string
      style: 'primary' | 'secondary'
    }
  }
  styling?: {
    backgroundColor?: string
    textColor?: string
    padding?: string
  }
}
```

### SEO Strategy
- **URL Structure**: Clean, descriptive URLs
- **Meta Tags**: Dynamic based on content
- **Structured Data**: Course/Event schema markup
- **Sitemap**: Auto-generated from database
- **Redirects**: 301 redirects from old Squarespace URLs

---

## Launch Strategy

### Pre-Launch (2 weeks before)
1. **Soft Launch**: Internal testing on staging domain
2. **User Testing**: Key stakeholders test all workflows
3. **Performance Testing**: Load testing with realistic data
4. **Content Review**: Final content and design approval

### Launch Day
1. **Morning**: Final backup of Squarespace
2. **Deploy**: Production deployment to Vercel
3. **DNS**: Update DNS records to point to new site
4. **Monitor**: Active monitoring for 24 hours
5. **Support**: Dedicated support for customer issues

### Post-Launch (1 week after)
1. **Analytics**: Monitor traffic and conversion metrics
2. **Feedback**: Collect user feedback and issues
3. **Optimization**: Performance and UX improvements
4. **Documentation**: Update admin documentation

---

## Maintenance Plan

### Regular Tasks
- **Content Updates**: Weekly content reviews and updates
- **Security Updates**: Monthly dependency and platform updates
- **Performance Monitoring**: Daily performance metrics review
- **Backup Verification**: Weekly backup integrity checks

### Monthly Reviews
- **Analytics Review**: Traffic, conversions, user behavior
- **Performance Audit**: Page speed, uptime, error rates
- **Content Audit**: Outdated content, broken links
- **Security Audit**: Access logs, vulnerability scans

### Quarterly Planning
- **Feature Roadmap**: New features and improvements
- **Capacity Planning**: Traffic growth and infrastructure needs
- **Cost Review**: Hosting, service, and maintenance costs
- **User Experience**: UX improvements and A/B tests

---

This migration will transform SBE Education from a platform-dependent solution to a fully integrated, scalable system that supports your business growth while maintaining the quality and professionalism of your current site.