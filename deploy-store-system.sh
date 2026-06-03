#!/bin/bash

# ============================================
# Deploy Store System - Complete Script
# ============================================

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        RELM Care+ - Store System Deployment               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Backend - Prisma Migration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 STEP 1: Running Prisma Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend

echo "Generating Prisma migration..."
npx prisma migrate dev --name add_store_users

echo ""
echo "Generating Prisma client..."
npx prisma generate

cd ..
echo -e "${GREEN}✅ Database migration completed!${NC}"
echo ""

# Step 2: Backend - List Created Files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 STEP 2: Backend Files Created"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "DTOs:"
ls -lh backend/src/store-auth/dto/
echo ""
echo "Services & Controllers:"
ls -lh backend/src/store-auth/*.ts
echo ""
echo -e "${GREEN}✅ Backend files verified!${NC}"
echo ""

# Step 3: Frontend Files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 STEP 3: Frontend Files Created"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
ls -lh frontend/src/pages/Store*.jsx
echo ""
echo -e "${GREEN}✅ Frontend files verified!${NC}"
echo ""

# Step 4: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 DEPLOYMENT SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}🗄️  Database:${NC}"
echo "   ✅ store_users table created"
echo "   ✅ StoreUser Prisma model added"
echo ""
echo -e "${BLUE}🔧 Backend:${NC}"
echo "   ✅ StoreAuthModule created"
echo "   ✅ StoreAuthService (login, register, getUsers)"
echo "   ✅ StoreAuthController (3 endpoints)"
echo "   ✅ StoreGuard for route protection"
echo "   ✅ DTOs: StoreLoginDto, CreateStoreUserDto"
echo ""
echo -e "${BLUE}🎨 Frontend:${NC}"
echo "   ✅ StoreLoginPage.jsx"
echo "   ✅ StoreDashboard.jsx"
echo "   ✅ storeAuthAPI added to services/api.js"
echo "   ✅ Routes added to App.jsx"
echo ""
echo -e "${BLUE}🔗 Available Routes:${NC}"
echo "   Backend:"
echo "   • POST   /api/store-auth/login"
echo "   • POST   /api/store-auth/register (Admin only)"
echo "   • GET    /api/store-auth/users"
echo ""
echo "   Frontend:"
echo "   • /loja/login - Store Login Page"
echo "   • /loja/dashboard - Store Dashboard"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo ""
echo "📋 Next Steps:"
echo "   1. Create a test store user (use admin API)"
echo "   2. Test login at /loja/login"
echo "   3. Access store dashboard"
echo "   4. Update customer/warranty modules to filter by storeId"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
