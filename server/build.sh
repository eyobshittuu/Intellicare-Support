#!/usr/bin/env bash
# Build script for Render deployment

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Running database migrations..."
node scripts/migrate.js

echo "✅ Build completed successfully!"
