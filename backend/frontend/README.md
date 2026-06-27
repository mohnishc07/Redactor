# Vercel Frontend Integration Guide

## Architecture

```
User → Vercel frontend (Next.js / React / static)
            │
            ▼ POST multipart/form-data
    FastAPI backend (Render / Railway / AWS / VPS)
            │
            ▼
    Redacted PDF + JSON report
```

**Important:** PDF redaction is CPU-bound and can take seconds. Do **not** run the FastAPI backend inside Vercel Serverless Functions (10 s timeout on Hobby, 60 s memory-limited). Host it on a dedicated server/container platform.

## Recommended backend hosts

| Platform | Best for | Cost |
|----------|----------|------|
| **Render** | Easy deploy from GitHub | Free tier available |
| **Railway** | Simple scaling | Pay-as-you-go |
| **Fly.io** | Global edge deployment | Generous free tier |
| **AWS ECS / EC2** | Production scale | Pay-as-you-go |
| **DigitalOcean Droplet** | Predictable pricing | ~$6–24/month |

## Deploy the backend

1. Push this repo to GitHub.
2. On Render, create a **Web Service** and point it at `Dockerfile`.
3. Set environment variables:
   ```
   REDACTOR_MAX_WORKERS=2
   REDACTOR_ENABLE_ML=false
   REDACTOR_MAX_FILE_SIZE_MB=20
   ```
4. Copy the public URL, e.g. `https://pdf-redactor-api.onrender.com`.

## Connect from a Vercel frontend

### Option A: Vanilla HTML/JS

See `example.html`.

### Option B: Next.js App Router

See `nextjs-example/page.tsx` and `nextjs-example/RedactUploader.tsx`.

### CORS

The FastAPI backend already allows all origins in `api/main.py` (default FastAPI CORS is not configured; add `CORSMiddleware` for production).

### Security for production

- Move API calls to a Next.js Route Handler (`app/api/redact/route.ts`) so the backend URL and any API key stay server-side.
- Add an API key header and validate it in `api/main.py`.
- Set `REDACTOR_MAX_FILE_SIZE_MB` and `REDACTOR_MAX_WORKERS` conservatively.
- Use HTTPS only.
