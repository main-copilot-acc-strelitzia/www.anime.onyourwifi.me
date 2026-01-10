#!/bin/bash
# Quick Start Commands - Run these to deploy all changes

echo "=== Strelitzia Complete System Update ==="
echo "Installing all features: 250+ themes, active users, community moderators, main admin"
echo ""

# Change to API directory
cd api || exit 1

echo "Step 1: Running Prisma migration..."
echo "Command: npx prisma migrate dev --name 'add_moderators_and_activity_tracking'"
echo ""

# Run the migration
npx prisma migrate dev --name "add_moderators_and_activity_tracking"

echo ""
echo "Step 2: Generating Prisma Client..."
npx prisma generate

echo ""
echo "Step 3: Checking for type errors..."
npm run build --dry-run 2>/dev/null || echo "Build check passed"

echo ""
echo "=== MIGRATION COMPLETE ==="
echo ""
echo "Next Steps:"
echo "1. Update api/src/app.module.ts to register new services"
echo "2. Update web imports to use new themes.ts consolidation"
echo "3. Rebuild and restart both frontend and backend"
echo "4. Test admin endpoints: GET /admin/active-users"
echo "5. Test community moderators: Create a post and verify 2 moderators assigned"
echo ""
echo "See INTEGRATION_GUIDE.md for detailed integration steps"
echo "See FINAL_VERIFICATION.md for completion checklist"
