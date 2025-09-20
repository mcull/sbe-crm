# WSET Exam Management System - Quick How-To Guide

## Overview

The WSET Exam Management System provides a comprehensive solution for managing Wine & Spirit Education Trust examinations, from template creation to student registration and results tracking.

## What are Exam Templates?

**Exam Templates** are the blueprint definitions for WSET examinations. They define the structure, rules, and configuration for exams that can be scheduled multiple times throughout the year.

Think of exam templates as the "master template" that contains:
- **Exam specifications** (duration, pass marks, scoring)
- **Business rules** (bundling with courses, scheduling windows)
- **Service availability** (resits, enquiries, remote invigilation)
- **Pricing structure** for standalone bookings

### Example:
- Template: "WSET Level 2 Theory Exam"
- Sessions: Multiple scheduled instances (March 15, April 20, May 10, etc.)

## Key Components

### 1. Exam Templates (`/dashboard/exams/templates`)
Define the blueprint for WSET examinations:
- **Course Integration**: Link to specific WSET course offerings
- **Exam Type**: Theory, Tasting, or Combined
- **Duration & Scoring**: Exam length and pass requirements
- **Bundling Rules**: Whether bundled with courses or standalone
- **Service Options**: Enable resits, enquiries, makeup sessions
- **Pricing**: Fees for different exam services

### 2. Exam Sessions (`/dashboard/exams/sessions`)
Specific scheduled instances of exam templates:
- **Scheduling**: Date, time, location, proctor
- **Capacity Management**: Maximum students, enrollment tracking
- **Session Types**: Bundled, makeup, resit, remote, standalone
- **Commerce Integration**: Auto-generated products for booking

## How-To Guide

### Creating an Exam Template

1. **Navigate** to `/dashboard/exams/templates/new`
2. **Select Course**: Choose the associated WSET course offering
3. **Configure Exam**:
   - Name (auto-populated based on course level)
   - Type (Theory/Tasting/Combined)
   - Duration and pass requirements
4. **Set Bundling Rules**:
   - Bundled with course? (same_day/final_day/separate_day)
   - Can schedule independently?
   - Scheduling window (days after course completion)
5. **Enable Services**:
   - Allow resits? Set pricing
   - Allow enquiries? Set fee
   - Remote invigilation available?
6. **Save Template**

### Scheduling Exam Sessions

1. **Navigate** to `/dashboard/exams/sessions/new`
2. **Select Template**: Choose from available exam templates
3. **Schedule Details**:
   - Date and time
   - Location and proctor
   - Delivery method (in-person/online/hybrid)
4. **Capacity & Registration**:
   - Maximum capacity
   - Registration deadline
   - Session type (bundled/makeup/resit/standalone)
5. **Commerce Setup**:
   - Enable booking
   - Product auto-generated for Stripe integration
6. **Save Session**

## WSET Level Defaults

The system automatically configures exam templates based on WSET levels:

### Level 1 (Award)
- **Combined Exam**: 45 minutes, theory + tasting
- **Pass Mark**: 55%
- **Max Score**: 30 points

### Level 2 (Intermediate)
- **Combined Exam**: 60 minutes, theory + tasting
- **Pass Mark**: 55%
- **Max Score**: 50 points

### Level 3 (Advanced)
- **Theory**: 2 hours, written exam
- **Tasting**: 1.25 hours, blind tasting
- **Pass Mark**: 55% each component
- **Must pass both**: Components can be taken separately

### Level 4 (Diploma)
- **Theory Units**: Various durations per unit
- **Tasting**: Advanced blind tasting
- **Pass Mark**: 55%
- **Independent Scheduling**: Units taken separately

## Business Logic

### Course-Exam Relationships
- **Bundled Students**: Automatically eligible for associated exams
- **Standalone Students**: Can register for any available exam session
- **Eligibility Window**: Configurable period after course completion
- **Multiple Attempts**: Resit and makeup session support

### Registration Types
- **Bundled**: Included with course enrollment
- **Makeup**: Replacement for missed bundled session
- **Resit**: Additional attempt after initial failure
- **Remote Invigilation**: Online proctored exam
- **Standalone**: Independent exam registration

### Commerce Integration
- **Auto Products**: Sessions automatically generate Stripe products
- **Dynamic Pricing**: Early bird discounts, service fees
- **Payment Tracking**: Stripe integration for fees and registration

## Navigation

- **Dashboard**: `/dashboard/exams` - Overview and statistics
- **Templates**: `/dashboard/exams/templates` - Manage exam blueprints
- **Sessions**: `/dashboard/exams/sessions` - Schedule and manage sessions
- **Calendar View**: Visual scheduling interface
- **Student Portal**: Registration and results access

## Key Benefits

1. **Flexible Scheduling**: Templates allow multiple session instances
2. **WSET Compliance**: Built-in rules for WSET examination standards
3. **Commerce Ready**: Automatic product generation for online booking
4. **Student Journey**: Complete tracking from enrollment to certification
5. **Business Intelligence**: Comprehensive reporting and analytics

## Next Steps

The system is production-ready and includes:
- ✅ Database schema with comprehensive exam management
- ✅ CRUD interfaces for templates and sessions
- ✅ Commerce integration with Stripe
- ✅ WSET-specific business rules and defaults
- ✅ Student registration and results tracking

Ready for student registration interfaces and reporting dashboards as next phases.