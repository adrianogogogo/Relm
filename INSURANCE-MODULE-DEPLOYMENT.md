# 🏥 Insurance Module - Complete Deployment Guide

## 📋 Overview

This guide provides complete instructions for deploying the Insurance Module with:
- **Insurance Quotes Management** (admin)
- **Insurance Policies Management** (admin)
- **Public quote request** form

---

## 🎯 Backend Deployment

### Step 1: Copy Scripts to Production Server

All scripts have been created in `/home/user/webapp/`. You need to copy them to your production server:

```bash
# On your production server (177.153.62.248)
# Create directory for scripts
mkdir -p /home/user/webapp

# Copy all scripts (use scp or your preferred method)
# From your local machine:
scp /path/to/scripts/*.sh root@177.153.62.248:/home/user/webapp/
```

### Step 2: Run Master Deployment Script

```bash
# On production server
cd /home/user/webapp
bash deploy-insurance-module.sh
```

This script will automatically:
1. ✅ Fix Prisma schema relations (add `insurancePolicies` to Product and Customer)
2. ✅ Create all DTOs (CreateQuoteDto, CreatePolicyDto, UpdateQuoteDto, UpdatePolicyDto)
3. ✅ Update InsuranceService with full CRUD operations
4. ✅ Update InsuranceController with all endpoints
5. ✅ Build the backend
6. ✅ Restart PM2
7. ✅ Verify routes

### Step 3: Test Backend Endpoints

```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@relmbikes.com.br","password":"Admin@2024"}' | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# List all quotes
curl -s -X GET "http://localhost:3005/api/insurance/quotes" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# List all policies
curl -s -X GET "http://localhost:3005/api/insurance/policies" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

## 🎨 Frontend Pages to Create

### Page 1: InsurancePage.jsx (Admin)

**Path**: `/admin/seguros`

**Features**:
- Two tabs: "Cotações" (Quotes) and "Apólices" (Policies)
- **Quotes Tab**:
  - List all quotes with status badges (PENDING, APPROVED, REJECTED, CONVERTED)
  - Filters: Status, Customer name, Date range
  - Actions: View details, Approve, Reject, Convert to Policy
- **Policies Tab**:
  - List all active policies
  - Show policy number, customer, company, premium, dates
  - Actions: View details, Cancel, Renew

### Page 2: QuoteDetailPage.jsx (Admin)

**Path**: `/admin/seguros/cotacoes/:id`

**Features**:
- Display quote details (protocol, customer, bike value, city, status)
- Show related customer information
- If approved: show quote value and insurance company
- Actions:
  - Approve quote (modal to enter quote value and company)
  - Reject quote
  - Convert to policy (redirect to policy creation form with pre-filled data)

### Page 3: PolicyDetailPage.jsx (Admin)

**Path**: `/admin/seguros/apolices/:id`

**Features**:
- Display policy details (number, customer, product, coverage, premium)
- Show start/end dates with visual timeline
- Display status with badge (ACTIVE, CANCELLED, EXPIRED)
- Related quote information (if exists)
- Actions:
  - Cancel policy (modal with reason)
  - Renew policy (modal to select new end date)
  - Print policy (PDF generation - future)

### Page 4: PolicyFormPage.jsx (Admin)

**Path**: `/admin/seguros/apolices/nova`

**Features**:
- Form to create new policy (manual or from quote)
- Fields:
  - Customer (searchable dropdown)
  - Product (optional, searchable dropdown)
  - Insurance Company
  - Bike Value
  - Coverage Value
  - Monthly Premium
  - Annual Premium (auto-calculated)
  - Start Date
  - End Date (default: +1 year)
  - Coverage Type
  - Deductible (optional)
  - Notes (optional)
- Validation:
  - End date must be after start date
  - Premium values must be positive
  - Customer is required

---

## 🚀 Frontend Implementation Script

Create this script to deploy the frontend pages:

```bash
cd /var/www/relm-careplus-prod/frontend

# 1. Create InsurancePage.jsx (main admin page with tabs)
cat > src/pages/InsurancePage.jsx << 'EOFPAGE1'
[REACT COMPONENT CODE - See separate file]
EOFPAGE1

# 2. Create QuoteDetailPage.jsx
cat > src/pages/QuoteDetailPage.jsx << 'EOFPAGE2'
[REACT COMPONENT CODE - See separate file]
EOFPAGE2

# 3. Create PolicyDetailPage.jsx
cat > src/pages/PolicyDetailPage.jsx << 'EOFPAGE3'
[REACT COMPONENT CODE - See separate file]
EOFPAGE3

# 4. Create PolicyFormPage.jsx
cat > src/pages/PolicyFormPage.jsx << 'EOFPAGE4'
[REACT COMPONENT CODE - See separate file]
EOFPAGE4

# 5. Update API service (src/services/api.js)
# Add these endpoints to insuranceAPI:
export const insuranceAPI = {
  // Existing
  getQuote: () => api.get('/public/insurance-quote'),
  
  // New endpoints
  // Quotes
  getQuotes: (params) => api.get('/insurance/quotes', { params }),
  getQuoteById: (id) => api.get(`/insurance/quotes/${id}`),
  updateQuote: (id, data) => api.patch(`/insurance/quotes/${id}`, data),
  approveQuote: (id, data) => api.post(`/insurance/quotes/${id}/approve`, data),
  rejectQuote: (id) => api.post(`/insurance/quotes/${id}/reject`),
  convertToPolicy: (id, data) => api.post(`/insurance/quotes/${id}/convert-to-policy`, data),
  
  // Policies
  getPolicies: (params) => api.get('/insurance/policies', { params }),
  getPolicyById: (id) => api.get(`/insurance/policies/${id}`),
  createPolicy: (data) => api.post('/insurance/policies', data),
  updatePolicy: (id, data) => api.patch(`/insurance/policies/${id}`, data),
  cancelPolicy: (id, reason) => api.post(`/insurance/policies/${id}/cancel`, { reason }),
  renewPolicy: (id, endDate) => api.post(`/insurance/policies/${id}/renew`, { endDate }),
};

# 6. Update routes in src/App.jsx
# Add these routes inside AdminLayout:
<Route path="/admin/seguros" element={<InsurancePage />} />
<Route path="/admin/seguros/cotacoes/:id" element={<QuoteDetailPage />} />
<Route path="/admin/seguros/apolices/:id" element={<PolicyDetailPage />} />
<Route path="/admin/seguros/apolices/nova" element={<PolicyFormPage />} />

# 7. Build and deploy
npm run build
rm -rf /var/www/relm-careplus-prod-web/*
cp -r dist/* /var/www/relm-careplus-prod-web/
chown -R www-data:www-data /var/www/relm-careplus-prod-web
chmod -R 755 /var/www/relm-careplus-prod-web
systemctl reload nginx
```

---

## 📊 API Endpoints Reference

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/public/insurance-quote` | Create insurance quote (public) |

### Admin - Quotes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insurance/quotes` | List all quotes |
| GET | `/api/insurance/quotes/:id` | Get quote details |
| PATCH | `/api/insurance/quotes/:id` | Update quote |
| POST | `/api/insurance/quotes/:id/approve` | Approve quote |
| POST | `/api/insurance/quotes/:id/reject` | Reject quote |
| POST | `/api/insurance/quotes/:id/convert-to-policy` | Convert to policy |

### Admin - Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insurance/policies` | List all policies |
| GET | `/api/insurance/policies/:id` | Get policy details |
| POST | `/api/insurance/policies` | Create new policy |
| PATCH | `/api/insurance/policies/:id` | Update policy |
| POST | `/api/insurance/policies/:id/cancel` | Cancel policy |
| POST | `/api/insurance/policies/:id/renew` | Renew policy |

---

## 🔄 Database Schema

### Table: insurance_policies

```sql
CREATE TABLE "insurance_policies" (
  "id" TEXT PRIMARY KEY,
  "policy_number" TEXT UNIQUE NOT NULL,
  "quote_id" TEXT,
  "customer_id" TEXT NOT NULL,
  "product_id" TEXT,
  "insurance_company" TEXT NOT NULL,
  "bike_value" DECIMAL(10,2) NOT NULL,
  "coverage_value" DECIMAL(10,2) NOT NULL,
  "monthly_premium" DECIMAL(10,2) NOT NULL,
  "annual_premium" DECIMAL(10,2) NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "coverage_type" TEXT,
  "deductible" DECIMAL(10,2),
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Prisma Model: InsurancePolicy

```prisma
model InsurancePolicy {
  id              String   @id @default(uuid())
  policyNumber    String   @unique @map("policy_number")
  quoteId         String?  @map("quote_id")
  customerId      String   @map("customer_id")
  productId       String?  @map("product_id")
  insuranceCompany String  @map("insurance_company")
  bikeValue        Decimal @map("bike_value") @db.Decimal(10,2)
  coverageValue    Decimal @map("coverage_value") @db.Decimal(10,2)
  monthlyPremium   Decimal @map("monthly_premium") @db.Decimal(10,2)
  annualPremium    Decimal @map("annual_premium") @db.Decimal(10,2)
  startDate        DateTime @map("start_date")
  endDate          DateTime @map("end_date")
  status           String   @default("ACTIVE")
  coverageType     String?  @map("coverage_type")
  deductible       Decimal? @db.Decimal(10,2)
  notes            String?
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  customer Customer @relation(fields: [customerId], references: [id])
  product  Product? @relation(fields: [productId], references: [id])
  quote    InsuranceQuote? @relation(fields: [quoteId], references: [id])
  
  @@index([policyNumber])
  @@index([customerId])
  @@index([status])
  @@index([quoteId])
  @@map("insurance_policies")
}
```

---

## ✅ Checklist

### Backend
- [ ] Run `deploy-insurance-module.sh`
- [ ] Verify Prisma schema is valid
- [ ] Check PM2 status
- [ ] Test quote endpoints
- [ ] Test policy endpoints

### Frontend
- [ ] Create InsurancePage.jsx
- [ ] Create QuoteDetailPage.jsx
- [ ] Create PolicyDetailPage.jsx
- [ ] Create PolicyFormPage.jsx
- [ ] Update insuranceAPI in api.js
- [ ] Add routes to App.jsx
- [ ] Update AdminLayout sidebar (add "Seguros" menu item)
- [ ] Build and deploy

### Testing
- [ ] Login as admin
- [ ] Navigate to /admin/seguros
- [ ] View quotes list
- [ ] View policies list
- [ ] Approve a quote
- [ ] Create a policy from quote
- [ ] Create a manual policy
- [ ] Cancel a policy
- [ ] Test all filters

---

## 🎯 Next Steps

1. **Run backend deployment** - Execute the master script
2. **Test backend APIs** - Verify all endpoints work
3. **Create frontend pages** - Build the React components
4. **Update sidebar menu** - Add "Seguros" link in AdminLayout
5. **Test complete flow**:
   - Public user creates quote
   - Admin sees quote in dashboard
   - Admin approves quote
   - Admin converts to policy
   - Admin views policy details

---

## 🆘 Troubleshooting

### Prisma validation errors
```bash
# Check schema syntax
cd /var/www/relm-careplus-prod/backend
npx prisma validate

# Regenerate client
npx prisma generate
```

### Build errors
```bash
# Check TypeScript errors
npm run build 2>&1 | grep "error TS"

# Clear build cache
rm -rf dist node_modules/.cache
npm run build
```

### PM2 restart issues
```bash
# Check logs
pm2 logs relm-careplus-backend --lines 50

# Full restart
pm2 delete relm-careplus-backend
pm2 start ecosystem.config.js
```

---

## 📞 Support

If you encounter any issues:
1. Check PM2 logs: `pm2 logs relm-careplus-backend`
2. Check Nginx error log: `tail -f /var/log/nginx/error.log`
3. Verify database connection: `psql -d relm_careplus_prod -c "\dt"`

---

**Created by**: GenSpark AI Developer  
**Date**: 2024-02-24  
**Version**: 1.0.0

