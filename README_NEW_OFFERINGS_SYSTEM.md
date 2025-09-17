# 🎯 New Offerings System - Complete Implementation

## System Overview

The new offerings-based system replaces the chaotic manual product creation with a clean, opinionated workflow:

```
Offerings (3 types: WSET Courses, Standalone Exams, Tastings)
├── Core business definitions with pricing and capacity
├── Component compatibility (add-ons, upgrades)

↓ Phillip schedules sessions ↓

Sessions (scheduled instances with dates/location)
├── Automatic product generation with intelligent naming
├── Capacity tracking and enrollment management
├── Optional components (tasting kits, remote exams)

↓ Customers purchase ↓

Products (auto-generated, Stripe-ready)
├── "WSET Level 2 - Jan 15, 2024 (Nashville)"
├── Metadata includes session details, pricing, components
├── Inventory management through session capacity
```

## 🗃 Database Schema (`supabase/migrations/20241217000004_offerings_model.sql`)

### Core Tables

1. **`offerings`** - What Phillip manages
   - `type`: 'wset_course' | 'standalone_exam' | 'tasting' | 'product'
   - `wset_level`: 1-4 for WSET offerings
   - `base_price`: Standard pricing
   - `default_capacity`: Standard session capacity
   - Business settings (auto_create_products, stripe_sync_enabled)

2. **`sessions`** - Scheduled instances
   - Links to offering with specific dates/location/instructor
   - Capacity management (`max_capacity`, `current_enrollment`, `available_spots`)
   - Auto-generates linked product via trigger
   - Early bird and registration deadlines

3. **`components`** - Optional add-ons/upgrades
   - Applicability rules (offering types, WSET levels, delivery methods)
   - "Remote Exam - Level 1" (+$45 for online courses)
   - "Tasting Kit - Level 2" (+$149 add-on)
   - Physical inventory tracking for shipped items

4. **`session_components`** - Links components to specific sessions
   - Override pricing per session
   - Mark as included/required/optional

### Pre-loaded Data

**WSET Course Offerings:**
- Level 1: $325 (8h, 16 capacity, single day)
- Level 2: $599 (24h, 20 capacity, multi-day)
- Level 3: $1400 (40h, 18 capacity, multi-day)

**Standalone Exam Offerings:**
- Level 1 Theory: $75 (1h, 30 capacity)
- Level 1 Tasting: $50 (0.5h, 20 capacity)
- Level 2 Theory: $100 (1h, 30 capacity)
- Level 2 Tasting: $85 (1h, 20 capacity)
- Level 3 Theory: $150 (2h, 25 capacity)
- Level 3 Tasting: $125 (1.5h, 15 capacity)

**Default Components:**
- Remote Exam upgrades (+$45 Level 1, +$85 Level 2)
- Tasting kits ($100-$299 by level)
- Required components (Digital Classroom, Study Packs)

## 🖥 Admin Interface (`/dashboard/offerings`)

### Main Dashboard
- **Statistics**: Total offerings, upcoming sessions, capacity, enrollment rates
- **Tabbed Interface**:
  - WSET Courses: Core certification programs
  - Exams: Standalone examination offerings
  - Tastings: Casual wine events
  - Sessions: All scheduled instances with enrollment tracking

### Key Features
- **Visual enrollment tracking** - Progress bars showing capacity utilization
- **Status management** - Open/closed booking, full sessions
- **Component management** - Link optional add-ons to sessions
- **Auto product generation** - Products created when sessions scheduled

## ⚡ Auto Product Generation

When Phillip schedules a session, the system automatically:

1. **Creates intelligent product name**:
   - "WSET Level 2 Award in Wines - Jan 15, 2024 (Nashville)"
   - Includes dates, location, delivery method

2. **Generates comprehensive description**:
   - Session details (date, location, instructor, capacity)
   - Delivery method and duration
   - What's included from the offering

3. **Calculates pricing**:
   - Base price from offering
   - Early bird price (15% discount default, 30 days before)
   - Component add-ons available

4. **Sets up Stripe sync**:
   - Product metadata includes all session details
   - Ready for e-commerce integration
   - Inventory management through session capacity

## 🔄 Business Workflow

### Phillip's New Process

1. **One-time Setup**: Configure offerings (already pre-loaded)
2. **Schedule Sessions**:
   - Select offering type (WSET Level 2, Level 1 Exam, etc.)
   - Set date, location, instructor, capacity
   - Choose delivery method (in-person/online)
   - System auto-creates product

3. **Optional Customization**:
   - Add components (tasting kits, remote exam upgrades)
   - Override pricing for special sessions
   - Set custom early bird deadlines

### Customer Experience

1. **Browse Sessions**: See available sessions with clear capacity indicators
2. **Select Options**: Choose base session + optional add-ons
3. **Checkout**: Standard Stripe checkout with auto-generated products
4. **Enrollment**: Automatic capacity tracking and "session full" indicators

## 🚧 Migration Required

The system is fully built but requires database migration:

### Steps to Activate:
1. **Run Migration**: Copy `supabase/migrations/20241217000004_offerings_model.sql` into Supabase SQL editor
2. **Verify Tables**: Check that offerings, sessions, components tables exist
3. **Test Interface**: Visit `/dashboard/offerings` to see pre-loaded data
4. **Schedule Test Session**: Create first session to verify auto product generation

### Migration Impact:
- ✅ **Non-breaking**: Existing products/orders unaffected
- ✅ **Parallel system**: Can run alongside existing course management
- ✅ **Gradual rollout**: Test with a few sessions before full adoption

## 📊 Expected Benefits

### For Phillip:
- **90% less manual work** - No more manual product creation
- **Consistent pricing** - Template-driven across all sessions
- **Capacity management** - Automatic enrollment tracking
- **Professional appearance** - Intelligent product naming and descriptions

### For Customers:
- **Clear offerings** - Well-structured course catalog
- **Real-time availability** - See remaining spots
- **Flexible options** - Add-ons like tasting kits and remote exams
- **Smooth checkout** - Auto-generated Stripe products

### For Business:
- **Scalable system** - Easy to add new offering types
- **Data-driven insights** - Track enrollment patterns and capacity utilization
- **Revenue optimization** - Component bundling and early bird pricing
- **Integration-ready** - Stripe metadata enables advanced e-commerce features

## 🎯 Next Steps

1. **Apply Migration** - Run the SQL migration to activate the system
2. **Test First Session** - Schedule a test session to verify auto product generation
3. **Configure Components** - Set up add-ons and upgrades for your specific needs
4. **Train on Interface** - Familiarize with the new offerings management workflow
5. **Gradual Migration** - Move existing manual processes to the new system

The chaos is eliminated. The system is opinionated. Phillip can focus on teaching while the system handles the complexity of product management, pricing, and enrollment tracking automatically.