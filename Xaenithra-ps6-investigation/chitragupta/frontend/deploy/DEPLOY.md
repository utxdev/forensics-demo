# 🚀 Trinetra Deployment Guide

## Option 1: Instant "Cloud" Access (Recommended)
Since Trinetra requires a connection to your local USB hardware (Android Device) and specific backend ports (5000/8000), the best way to "deploy" it for remote viewing/demo is using a **Tunnel**.

This exposes your running `localhost` to a public URL securely.

### Quick Start
1. Ensure the Backend is running (`./run_trinetra.py`).
2. Run this command in your terminal:
   ```bash
   npx localtunnel --port 8082 --subdomain trinetra-demo
   ```
3. Share the URL (e.g., `https://trinetra-demo.loca.lt`) with anyone.

---

## Option 2: Static Hosting (Netlify/Vercel)
If you must host the UI on a platform like Netlify, follow these steps. **Note:** The backend connection will FAIL unless the user visits the site from *your* local machine (localhost) OR you also tunnel the backend APIs.

### Steps
1. **Drag and Drop**:
   - Locate the `deploy/production_build` folder.
   - Drag this entire folder into the [Netlify Drop](https://app.netlify.com/drop) zone.

2. **Backend Configuration**:
   - The deployed frontend attempts to connect to `http://localhost:5000` and `http://localhost:8000` by default.
   - **Browser Warning**: Browsers will block `http` (localhost) calls from `https` (Netlify). You must either:
     - Enable "Insecure Content" for the site settings.
     - OR Setup an SSL proxy for your backend locally.

## Summary
For a hassle-free demo that "just works" with hardware, use **Option 1 (Tunnel)**.
