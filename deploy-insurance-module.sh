#!/bin/bash
# Master deployment script for Insurance Module

echo "========================================="
echo "RELM CAREPLUS - INSURANCE MODULE SETUP"
echo "========================================="
echo ""

cd /var/www/relm-careplus-prod/backend

echo "STEP 1: Fix Prisma Schema Relations"
echo "-------------------------------------"
bash /home/user/webapp/fix-insurance-prisma.sh

if [ $? -ne 0 ]; then
    echo "❌ Failed to fix Prisma schema. Aborting."
    exit 1
fi

echo ""
echo "STEP 2: Create Insurance DTOs"
echo "-------------------------------------"
bash /home/user/webapp/create-insurance-dtos.sh

echo ""
echo "STEP 3: Update Insurance Service"
echo "-------------------------------------"
bash /home/user/webapp/update-insurance-service.sh

echo ""
echo "STEP 4: Update Insurance Controller"
echo "-------------------------------------"
bash /home/user/webapp/update-insurance-controller.sh

echo ""
echo "STEP 5: Build Backend"
echo "-------------------------------------"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Check errors above."
    exit 1
fi

echo ""
echo "STEP 6: Restart PM2"
echo "-------------------------------------"
pm2 restart relm-careplus-backend
sleep 3
pm2 status

echo ""
echo "STEP 7: Verify Routes"
echo "-------------------------------------"
pm2 logs relm-careplus-backend --lines 100 --nostream | grep -i "insurance" | head -20

echo ""
echo "========================================="
echo "✅ BACKEND DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "📋 ENDPOINTS CREATED:"
echo ""
echo "PUBLIC:"
echo "  POST   /api/public/insurance-quote          - Create quote (public)"
echo ""
echo "ADMIN - QUOTES:"
echo "  GET    /api/insurance/quotes                - List all quotes"
echo "  GET    /api/insurance/quotes/:id            - Get quote details"
echo "  PATCH  /api/insurance/quotes/:id            - Update quote"
echo "  POST   /api/insurance/quotes/:id/approve    - Approve quote"
echo "  POST   /api/insurance/quotes/:id/reject     - Reject quote"
echo "  POST   /api/insurance/quotes/:id/convert-to-policy - Convert to policy"
echo ""
echo "ADMIN - POLICIES:"
echo "  GET    /api/insurance/policies              - List all policies"
echo "  GET    /api/insurance/policies/:id          - Get policy details"
echo "  POST   /api/insurance/policies              - Create policy"
echo "  PATCH  /api/insurance/policies/:id          - Update policy"
echo "  POST   /api/insurance/policies/:id/cancel   - Cancel policy"
echo "  POST   /api/insurance/policies/:id/renew    - Renew policy"
echo ""
echo "========================================="
echo ""

