# Zen Audit Web

A polished Next.js 16 frontend for the [PDF Redactor](https://github.com/ltillmann/pdf-redactor) backend. Upload PDF, Excel, or Word documents, choose redaction detectors, and download the sanitized file.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Backend Connection

The frontend proxies redaction requests through a server-side Next.js API route at `/api/redact` so the backend URL and API key are never exposed to the browser.

1. Copy the environment template:

   ```bash
   cp .env.local.example .env.local
   ```

2. Set your deployed PDF Redactor backend URL and optional API key:

   ```env
   REDACTOR_API_URL=https://your-api.com/redact
   REDACTOR_API_KEY=your-secret-key
   ```

3. Start the PDF Redactor backend (see its `README.md`).

## Security Notes

- Keep `REDACTOR_API_KEY` secret. It is only read server-side by the API route.
- Restrict `REDACTOR_CORS_ORIGINS` on the backend to your frontend domain.
- The backend already enforces file type validation, a max file size, rate limiting, and optional API-key auth.
- The frontend rejects files larger than 50 MB before upload, matching the backend default.
- Because requests are proxied through the Next.js server, the backend's IP-based rate limiter sees the server IP instead of each client. For per-client rate limiting, configure the backend to trust `X-Forwarded-For` or add rate limiting in front of the Next.js app (e.g., a CDN/WAF).
- If you deploy on Vercel, be aware of serverless function body-size and timeout limits for large PDFs. For production workloads with 50 MB files, use a dedicated Node.js runtime or container deployment.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [PDF Redactor README](../pdf-redactor/README.md)
