#!/bin/sh
set -e
echo "Pushing schema..."
npx prisma db push --accept-data-loss
echo "Schema ready. Seeding data..."
npx prisma db seed
echo "Seed complete. Starting server..."
exec node src/index.js
