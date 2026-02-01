#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "🚀 Starting frontend dev server..."
npm run dev -- --port 8080
