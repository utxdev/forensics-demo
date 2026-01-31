#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
echo "Starting Divya Drishti Backend..."
python main.py
