#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "Starting Divya Drishti Frontend..."
flutter run -d chrome --web-renderer html
