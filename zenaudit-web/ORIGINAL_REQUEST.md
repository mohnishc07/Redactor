# Original User Request

## Initial Request — 2026-06-27T15:58:39Z

Rebuild the `zenaudit-web` Next.js application to precisely match the Zen Audit design language from the reference HTML file, integrating a file-upload component and a comprehensive redaction options UI.

Working directory: c:\Users\Mohnish\softwares\zenaudit-web

Integrity mode: development

Reference material: The design language reference file is at `c:\Users\Mohnish\softwares\zenaudit-web\zen_audit_landing_page.html`. Read it carefully — every color, font, spacing, and border decision must come from this file.

The pdf-redactor backend code is at `c:\Users\Mohnish\softwares\pdf-redactor` — read its `README.md` and `pdf_redactor/cli.py` for the full list of detectors, templates, and options.

## Requirements

### R1. Adopt the Zen Audit Design Language Exactly

The existing Next.js app at the working directory must be rewritten to use the **exact** design system from the reference file at `c:\Users\Mohnish\softwares\zenaudit-web\zen_audit_landing_page.html`. This includes:

- **Color palette**: background `#080C10`, surface `rgba(255,255,255,0.04)`, glass borders `rgba(255,255,255,0.08)`, text hierarchy `#F0F4F8` / `rgba(240,244,248,0.55)` / `rgba(240,244,248,0.30)`, accent `#5B8AFF`, accent dim `rgba(91,138,255,0.12)`
- **Fonts**: `DM Sans` (display) and `Inter` (body) from Google Fonts
- **Spacing & layout**: generous padding, max-width `800px` for content sections, 0.5px glass borders, grid-based option cards with 1px gap
- **Navbar**: sticky, backdrop-blur, centered logo ("Zen Audit" with the SVG mark), left nav links, right login button — matching the HTML structure
- **Hero section**: eyebrow label, large DM Sans title with thin weight, subtitle, CTA row (primary accent + ghost border buttons)
- **Stats strip**: four stat cells with thin borders
- **"How it Works" steps**: numbered 01/02/03, grid layout with step number + content
- **Redaction Options grid**: cards with icons, names, and hint text in a responsive grid with 1px borders

The page **must feel identical** to the HTML reference. Do not deviate to a different aesthetic.

### R2. Integrate the File Upload Component

The project already has these installed dependencies: `motion` (framer-motion v12+), `@tabler/icons-react`, `react-dropzone`, `clsx`, `tailwind-merge`. The following components already exist and must be used as-is or lightly restyled to match the Zen Audit design palette:

- `src/components/ui/file-upload.tsx` — the core drag-and-drop upload component with GridPattern background, motion animations, and dropzone
- `src/components/file-upload-demo.tsx` — the wrapper with state management
- `src/lib/utils.ts` — the `cn()` helper

The file upload **must only accept PDF and Excel files** (`.pdf`, `.xls`, `.xlsx`). It should be placed centrally in the hero area or a prominent dedicated section. The upload component's colors (backgrounds, borders, text) must be adjusted to use the Zen Audit palette (`--bg`, `--surface`, `--border-glass`, `--text-hi`, `--text-mid`, etc.) instead of the default neutral Tailwind colors.

### R3. Comprehensive Redaction Options UI

After a file is uploaded, the user must be shown a **redaction configuration panel** styled with the Zen Audit design language (glass cards, 0.5px borders, accent highlights). This panel must include:

**Compliance Templates** (radio selection, only one active at a time):
- `pii` — phone, email, ssn, passport, name, address
- `financial` — account, ifsc, micr, upi, pan, aadhaar, bic, iban, creditcard, balance
- `hipaa` — phone, email, ssn, name, address, date
- `gdpr` — phone, email, name, address, passport, ssn

**Individual Detectors** (checkboxes, categorized into groups):
- **Contact**: Phone numbers, Email, Links
- **Identity**: Names, Addresses, Customer ID, SSN, Passport
- **Financial (India)**: Account numbers, IFSC, MICR, UPI, PAN, Aadhaar, Balance, Receiver
- **Financial (Global)**: IBAN, BIC, Credit Card
- **Temporal**: Dates, Timestamps
- **Security**: API keys/secrets, Barcodes, QR Codes

**Advanced Options** (toggles/checkboxes):
- Remove Metadata
- Enable OCR (scanned PDFs)
- Enable ML Detection (names/addresses)
- Aggressive mode (include low-confidence)
- Generate Audit Report

A prominent **"Redact PDF"** button at the bottom of the options panel.

### R4. Responsive and Premium

The entire application must be ultra-responsive across mobile, tablet, and desktop. All sections must gracefully adapt. Interactions must include subtle hover transitions consistent with the reference (0.2s ease, opacity/color changes).

## Acceptance Criteria

### Design Fidelity
- [ ] The background color is `#080C10` and the overall palette matches the reference HTML exactly
- [ ] `DM Sans` and `Inter` fonts are loaded and applied (display vs body)
- [ ] The navbar is sticky with `backdrop-filter: blur(20px)` and the centered Zen Audit logo with SVG mark
- [ ] Glass borders (`0.5px solid rgba(255,255,255,0.08)`) are used throughout
- [ ] The hero section has the eyebrow, large title, subtitle, and dual CTA buttons
- [ ] The stats strip displays 4 stat cells with thin glass borders
- [ ] The "How it Works" section has 3 numbered steps in the grid layout
- [ ] The redaction options grid renders cards with icons, names, and hints

### File Upload
- [ ] The drag-and-drop file upload component renders and functions (click + drag both work)
- [ ] Only `.pdf`, `.xls`, `.xlsx` files are accepted; other types are rejected
- [ ] Uploaded file info (name, size, type, modified date) displays with motion animations
- [ ] The upload component's colors match the Zen Audit palette

### Redaction Options
- [ ] After uploading a file, a redaction options panel appears
- [ ] Template selection (pii, financial, hipaa, gdpr) works as radio buttons
- [ ] Individual detector checkboxes are present and organized by category
- [ ] Advanced toggles (metadata, OCR, ML, aggressive, report) are present
- [ ] A "Redact PDF" button is visible at the bottom

### Technical
- [ ] `npm run dev` starts without errors
- [ ] The page loads in a browser without console errors
- [ ] The layout is responsive (no horizontal overflow on 375px viewport width)
