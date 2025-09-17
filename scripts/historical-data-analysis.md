# Historical Squarespace Data Analysis

## Data Structure Overview

### Orders CSV (`public/historical/orders.csv`)
- **229 orders** from Squarespace (Order IDs 00001-00229)
- **Time Period**: Covers 2024-2025 period
- **Payment Method**: Primarily Stripe integration
- **Order Format**: Each line item can be separate row (some orders have multiple products)

#### Key Fields Mapping:
```typescript
// Squarespace → Database Schema
{
  "Order ID": "order_number",           // "00229" → "SBE-2024-229"
  "Email": "customer_email",
  "Financial Status": "payment_status", // "PAID" → "succeeded"
  "Paid at": "paid_at",
  "Total": "total_amount",
  "Subtotal": "subtotal_amount",
  "Taxes": "tax_amount",
  "Discount Code": "discount_code",
  "Discount Amount": "discount_amount",
  "Billing Name": "customer_name",
  "Billing Phone": "customer_phone",
  "Payment Reference": "stripe_payment_intent_id",
  "Lineitem name": "product_name",
  "Lineitem price": "unit_price",
  "Lineitem sku": "sku",
  "Lineitem quantity": "quantity"
}
```

#### Data Quality Issues Found:
1. **Multi-line orders**: Same Order ID appears on multiple rows for multi-product orders
2. **Missing data**: Some rows have empty billing info (continuation rows)
3. **Date format**: "2025-09-04 13:48:09 -0500" needs parsing
4. **Currency**: All USD, hardcoded
5. **Discount codes**: "LEVELUPSEBEVED", "L3SANSBOOK" - need to create in system

### Products CSV (`public/historical/products_Sep-17_09-44-32AM.csv`)
- **200+ products** across different WSET categories
- **Product Types**: PHYSICAL (course sessions), some DIGITAL
- **Categories**: Beer, Wine, Spirits courses at various levels
- **Stock Management**: Stock levels tracked

#### Key Fields Mapping:
```typescript
// Squarespace → Database Schema
{
  "Title": "name",
  "Description": "description",
  "SKU": "sku",
  "Price": "base_price",
  "Sale Price": "early_bird_price",
  "Stock": "available_spots",
  "Categories": "tags", // "/in-person-beer-classes" → ["in-person", "beer", "level-1"]
  "Visible": "active",
  "Product Type": "type"
}
```

#### Product Categories Identified:
1. **WSET Level 1 Wines** - In-person classes ($325-350)
2. **WSET Level 2 Wines** - In-person classes ($575-625)
3. **WSET Level 3 Wines** - In-person classes ($1,350)
4. **WSET Level 1 Beer** - In-person classes ($350)
5. **WSET Level 2 Beer** - In-person classes ($875)
6. **WSET Level 2 Spirits** - In-person classes ($850)
7. **Online Courses** - With palate calibration kits ($310)
8. **Exam Invigilation** - Remote exam services ($45-85)
9. **Master Kits** - Wine sample kits ($100)

## Schema Validation Results

### ✅ Schema Adequately Supports Historical Data:
- **Orders table** can handle all order fields
- **Order items** supports line items with product snapshots
- **Products table** accommodates all product types
- **Candidates table** can store customer info from billing data
- **Discount codes** table ready for historical discount campaigns

### ⚠️ Data Transformation Required:
1. **Order numbering**: "00229" → "SBE-2024-229" format
2. **Product categorization**: Extract WSET levels from titles
3. **Course session mapping**: Link products to course sessions
4. **Customer deduplication**: Merge orders by email
5. **Date normalization**: Convert Squarespace timestamps

### 🔧 Additional Fields Needed:
- **Course type extraction** from product names (In-Person vs Online)
- **Location parsing** from descriptions (Nashville, etc.)
- **WSET level detection** from titles and categories
- **Session date extraction** from product names

## Import Strategy

### Phase 1: Data Cleaning & Preparation
1. Parse and normalize all dates
2. Deduplicate customers by email
3. Extract WSET levels and course types from product names
4. Create standardized SKU mapping

### Phase 2: Core Data Import
1. Import unique customers as candidates
2. Import products with proper categorization
3. Create course sessions from products
4. Import historical discount codes

### Phase 3: Order History Import
1. Import orders with proper order numbering
2. Link orders to customers (candidates)
3. Create order items with product snapshots
4. Update customer statistics (total_orders, total_spent)

### Phase 4: Data Validation
1. Verify order totals match
2. Confirm customer-order relationships
3. Validate product-session mappings
4. Check discount code applications

## Product Analysis Deep Dive

### WSET Course Patterns Detected:
```typescript
// Pattern matching for course extraction
const coursePatterns = {
  level: /Level (\d+)/i,
  type: /(In-Person|Online)/i,
  subject: /(Wine|Beer|Spirit)/i,
  dates: /(\w+\s+\d+,?\s*\d*)/g,
  location: /(Nashville|Atlanta|Charleston)/i,
  exam: /(Exam|Invigilation)/i
}
```

### Price Analysis:
- **Level 1 courses**: $295-$350 range
- **Level 2 courses**: $575-$875 range
- **Level 3 courses**: $1,350 standard
- **Exam services**: $45-$85 range
- **Kits/Materials**: $100-$310 range

### Session Scheduling Patterns:
- **Level 1**: Typically 1-day sessions
- **Level 2**: Multi-day (2-3 days) sessions
- **Level 3**: Extended multi-week programs
- **Online courses**: Self-paced with kit shipping

This analysis confirms our database schema can fully accommodate all historical Squarespace data with proper transformation and mapping.