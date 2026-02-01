#!/bin/bash
cd "$(dirname "$0")/backend"
echo "🔧 Building backend..."
npx tsc
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🚀 Starting backend server..."
    node dist/server.js
else
    echo "❌ Build failed!"
    exit 1
fi
