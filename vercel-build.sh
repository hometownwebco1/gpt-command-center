#!/bin/bash
echo "🔧 Running custom Vercel build steps..."
npx prisma generate
npm run build
