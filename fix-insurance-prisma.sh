#!/bin/bash
# Script to fix Prisma schema relations for Insurance module

cd /var/www/relm-careplus-prod/backend

echo "=== 1. BACKUP CURRENT SCHEMA ==="
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup created"

echo ""
echo "=== 2. CHECK CURRENT PRODUCT MODEL ==="
grep -n "model Product" prisma/schema.prisma

echo ""
echo "=== 3. FIX PRODUCT MODEL - ADD MISSING RELATION ==="
# Find the line number of the Product model
PRODUCT_LINE=$(grep -n "^model Product {" prisma/schema.prisma | cut -d: -f1)

if [ -z "$PRODUCT_LINE" ]; then
    echo "❌ Product model not found!"
    exit 1
fi

# Find the closing brace of Product model
PRODUCT_END=$(awk -v start="$PRODUCT_LINE" 'NR > start && /^}/ {print NR; exit}' prisma/schema.prisma)

echo "Product model: lines $PRODUCT_LINE to $PRODUCT_END"

# Add the insurancePolicies relation before the closing brace
sed -i "${PRODUCT_END}i\\  insurancePolicies InsurancePolicy[]" prisma/schema.prisma

echo "✅ Added insurancePolicies relation to Product model"

echo ""
echo "=== 4. FIX CUSTOMER MODEL - ADD MISSING RELATION ==="
# Find Customer model and add insurancePolicies relation if not exists
CUSTOMER_LINE=$(grep -n "^model Customer {" prisma/schema.prisma | cut -d: -f1)

if [ -z "$CUSTOMER_LINE" ]; then
    echo "❌ Customer model not found!"
    exit 1
fi

CUSTOMER_END=$(awk -v start="$CUSTOMER_LINE" 'NR > start && /^}/ {print NR; exit}' prisma/schema.prisma)

# Check if relation already exists
if ! grep -q "insurancePolicies InsurancePolicy\[\]" prisma/schema.prisma; then
    sed -i "${CUSTOMER_END}i\\  insurancePolicies InsurancePolicy[]" prisma/schema.prisma
    echo "✅ Added insurancePolicies relation to Customer model"
else
    echo "ℹ️  insurancePolicies relation already exists in Customer model"
fi

echo ""
echo "=== 5. FIX INSURANCEQUOTE MODEL - ADD POLICIES RELATION ==="
QUOTE_LINE=$(grep -n "^model InsuranceQuote {" prisma/schema.prisma | cut -d: -f1)

if [ -z "$QUOTE_LINE" ]; then
    echo "❌ InsuranceQuote model not found!"
    exit 1
fi

QUOTE_END=$(awk -v start="$QUOTE_LINE" 'NR > start && /^}/ {print NR; exit}' prisma/schema.prisma)

# Check if policies relation already exists
if ! grep -q "policies InsurancePolicy\[\]" prisma/schema.prisma; then
    sed -i "${QUOTE_END}i\\  policies InsurancePolicy[]" prisma/schema.prisma
    echo "✅ Added policies relation to InsuranceQuote model"
else
    echo "ℹ️  policies relation already exists in InsuranceQuote model"
fi

echo ""
echo "=== 6. VALIDATE PRISMA SCHEMA ==="
npx prisma validate

if [ $? -eq 0 ]; then
    echo "✅ Prisma schema is valid!"
    
    echo ""
    echo "=== 7. GENERATE PRISMA CLIENT ==="
    npx prisma generate
    
    echo ""
    echo "=== 8. VERIFY MODELS ==="
    echo ""
    echo "--- Product Model ---"
    sed -n '/^model Product {/,/^}/p' prisma/schema.prisma
    
    echo ""
    echo "--- Customer Model (last 15 lines) ---"
    sed -n '/^model Customer {/,/^}/p' prisma/schema.prisma | tail -15
    
    echo ""
    echo "--- InsuranceQuote Model ---"
    sed -n '/^model InsuranceQuote {/,/^}/p' prisma/schema.prisma
    
    echo ""
    echo "--- InsurancePolicy Model ---"
    sed -n '/^model InsurancePolicy {/,/^}/p' prisma/schema.prisma
    
    echo ""
    echo "✅ ALL DONE! Prisma schema fixed and client generated."
else
    echo "❌ Prisma validation failed. Check the errors above."
    exit 1
fi
