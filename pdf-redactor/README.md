# PDFRedactor

PDFRedactor is a Python tool for redacting sensitive information from **PDF, Excel, and Word** files. It ships as both a **CLI** and a **FastAPI backend** for server deployments.

The redesigned engine uses a **modular detector registry** with built-in validation, confidence scoring, compliance templates, and an optional **ML layer** for hard classes like names and addresses.

## Features

- **Supported Formats**: PDF, XLSX, XLSM, DOCX
- **Text Detectors**: phone numbers, email addresses, links, IBANs, BICs, timestamps, dates
- **Indian Financial Detectors**: account numbers, IFSC, MICR, UPI VPAs, PAN, Aadhaar, balances, receivers
- **Global PII Detectors**: US SSN, passport numbers, credit cards (Luhn-validated), API keys/secrets
- **Personal Detectors**: customer/beneficiary names, addresses, customer IDs
- **Compliance Templates**: `pii`, `financial`, `hipaa`, `gdpr`
- **Validation Layer**: IBAN checksums, date sanity, BIC stop-words, IFSC bank codes, credit-card Luhn check
- **Output Quality**: optional OCR for scanned PDFs, metadata stripping, confidence scoring, JSON audit report
- **FastAPI Backend**: process-pool workers, health/ready endpoints, concurrent request handling
- **Opt-In ML**: spaCy NER for names and addresses, loaded only when enabled
- **Vercel-Ready Frontend**: example HTML and Next.js components in `frontend/`

## Market Fit

PDF redaction is a growing need across legal, healthcare, finance, government, and education. This tool targets:

- **SaaS founders** who need a backend API to plug into a document workflow
- **Compliance teams** needing HIPAA/GDPR financial-document redaction
- **Developers** who want a self-hosted, API-first alternative to Adobe/Foxit

## Installation

Requires **Python 3.12**.

```bash
# Using uv (recommended)
uv venv --python 3.12 .venv
uv pip install -r requirements.txt

# Or using pip
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Optional ML dependencies

```bash
uv pip install -r requirements-ml.txt
```

### OCR support (optional)

Install Tesseract OCR:
- Windows: `choco install tesseract` or download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
- macOS: `brew install tesseract`
- Ubuntu/Debian: `apt-get install tesseract-ocr`

## CLI Usage

```bash
# PDF
.venv\Scripts\python.exe pdf_redactor.py -i statement.pdf --template financial --remove-metadata

# Excel
.venv\Scripts\python.exe pdf_redactor.py -i data.xlsx --template pii

# Word
.venv\Scripts\python.exe pdf_redactor.py -i report.docx --template hipaa --remove-metadata

# Fast mode — financial template
.venv\Scripts\python.exe pdf_redactor.py -i statement.pdf --template financial --remove-metadata

# With all Indian financial detectors
.venv\Scripts\python.exe pdf_redactor.py -i statement.pdf \
  -a --ifsc --micr --upi --pan --aadhaar -B -R -d -p -e -l

# ML-assisted name/address redaction
.venv\Scripts\python.exe pdf_redactor.py -i statement.pdf --ml -n -A \
  -a --ifsc --upi --pan -d -p -e -l

# OCR for scanned PDFs
.venv\Scripts\python.exe pdf_redactor.py -i scanned.pdf --ocr --template pii

# Generate an audit report
.venv\Scripts\python.exe pdf_redactor.py -i statement.pdf --report --template financial
```

## Compliance Templates

| Template | Detectors enabled |
|----------|-------------------|
| `pii` | phone, email, ssn, passport, name, address |
| `hipaa` | phone, email, ssn, name, address, date |
| `gdpr` | phone, email, name, address, passport, ssn |
| `financial` | account, ifsc, micr, upi, pan, aadhaar, bic, iban, creditcard, balance |

## FastAPI Backend

```bash
# Start server
.venv\Scripts\python.exe -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 2

# Submit a PDF
curl -X POST "http://localhost:8000/redact" \
  -F "file=@statement.pdf" \
  -F 'options={"template":"financial","remove_metadata":true,"report_format":"json"}'

# Excel / Word files are also accepted
curl -X POST "http://localhost:8000/redact" \
  -F "file=@data.xlsx" \
  -F 'options={"template":"pii","report_format":"json"}'

# Health / readiness
curl http://localhost:8000/health
curl http://localhost:8000/ready

# List detectors
curl http://localhost:8000/detectors
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDACTOR_MAX_WORKERS` | `CPU_COUNT` | Process pool size |
| `REDACTOR_MAX_FILE_SIZE_MB` | `50` | Maximum uploaded PDF size |
| `REDACTOR_ENABLE_ML` | `false` | Globally enable ML detectors |
| `REDACTOR_ML_TIMEOUT_SECONDS` | none | Timeout for ML inference |

### Docker

```bash
docker-compose up --build
```

## Vercel Frontend Integration

See `frontend/README.md` for the full guide.

**Architecture:**
```
Vercel frontend  →  FastAPI backend (Render/Railway/AWS/VPS)  →  Redacted PDF
```

Do **not** run the FastAPI backend inside Vercel Serverless Functions — PDF redaction is CPU-bound and exceeds typical serverless limits.

### Quick frontend example

```html
<!-- Use frontend/example.html as a starting point -->
<script>
const form = new FormData();
form.append("file", pdfFile);
form.append("options", JSON.stringify({ template: "financial", remove_metadata: true }));
const res = await fetch("https://your-api.com/redact", { method: "POST", body: form });
const { pdf_base64, report } = await res.json();
</script>
```

For production, route requests through a Next.js API route (`frontend/nextjs-example/route.ts`) so your backend URL and API key stay server-side.

## Detectors

| Detector | Flag | Confidence | Notes |
|----------|------|------------|-------|
| Phone | `-p` | high/medium | Pass `-g US` / `-g IN` for better accuracy |
| Email | `-e` | high | Excludes URL/path fragments |
| Link | `-l` | high | PyMuPDF link annotations |
| IBAN | `-s` | high | ISO 13616 checksum |
| BIC | `-b` | high/medium | Institution + country code validation |
| Timestamp | `-f` | high | HH:MM[:SS] |
| Date | `-d` | high | Calendar validation |
| Account | `-a` | high/medium | Context-aware account numbers |
| IFSC | `--ifsc` | high/medium | Bank-prefix validation |
| MICR | `--micr` | high/low | Context-aware |
| UPI | `-u` | high | Common PSP handles only |
| PAN | `--pan` | high | Indian PAN format |
| Aadhaar | `--aadhaar` | high | Near Aadhaar/UID/VID labels |
| Balance | `-B` | high | Near balance keywords |
| Receiver | `-R` | medium | Transfer receiver names/accounts |
| Name | `-n` | medium/high | Titles + optional ML |
| Address | `-A` | medium | PIN-code driven + optional ML |
| Customer ID | `--customer-id` | high | Near ID labels |
| SSN | `--ssn` | high/medium | US Social Security numbers |
| Passport | `--passport` | high/low | Near passport labels |
| Credit Card | `--creditcard` | high | With Luhn validation |
| Secrets | `--secret` | high/medium | API keys, tokens |
| Barcode | `-r` | high | Requires zbar |
| QR Code | `-q` | high | Requires zbar |

## Development

```bash
# Run tests
.venv\Scripts\python.exe -m pytest tests/ -v

# Run on sample file
.venv\Scripts\python.exe pdf_redactor.py \
  -i "C:\Users\Mohnish\Desktop\docs\Statement_2025MTH09_444593294_unlocked.pdf" \
  --template financial --remove-metadata --report
```

## License

MIT License.
