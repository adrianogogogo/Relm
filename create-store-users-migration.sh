#!/bin/bash

# ============================================
# Create StoreUser Migration Script
# ============================================

echo "🔧 Creating Store Users migration..."
echo ""

cd backend

# Generate Prisma migration
echo "📝 Generating Prisma migration..."
npx prisma migrate dev --name add_store_users --create-only

echo ""
echo "✅ Migration created!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the migration file"
echo "   2. Apply with: npx prisma migrate dev"
echo "   3. Generate client: npx prisma generate"

