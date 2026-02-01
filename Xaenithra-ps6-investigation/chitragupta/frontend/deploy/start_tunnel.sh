#!/bin/bash
echo "Starting Trinetra Public Tunnel..."
echo "This will create a public link to your local Dashboard (Port 8082)."
echo "Ensure run_trinetra.py is running first!"
echo ""
npx localtunnel --port 8082 --subdomain trinetra-forensics
