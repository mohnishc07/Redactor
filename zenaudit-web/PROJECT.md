# Project: Zen Audit Web Rebuild

## Architecture
- **Framework**: Next.js 16.2.9 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4 using CSS variables for theme adaptation
- **Animation**: Framer Motion (`motion`) + 21st.dev Aurora Background shader
- **State Management**: React `useState` inside the main client wrapper (`FileUploadDemo`)
- **Data Flow**:
  1. User lands on the premium marketing hero and clicks **Redact a file** to scroll to the app.
  2. User drops or selects a PDF, Excel, or Word file via the `FileUpload` component.
  3. The `FileUpload` component validates that the file is of type `.pdf`, `.xls`, `.xlsx`, `.xlsm`, or `.docx`.
  4. Once validated, the single-screen app shows three horizontal columns: upload/presets, detector selection, and advanced options.
  5. User configures redaction choices: selects a compliance template or toggles individual detectors, along with advanced options.
  6. User clicks "Redact Document" to submit the file and options to the server-side `/api/redact` route, which proxies to the PDF Redactor backend.
  7. On success, the user sees a summary and can download the redacted document.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Design System & Styling | Set up CSS variables, fonts, colors, and global styles from design reference. | None | DONE |
| 2 | Aurora Background + Animations | Integrate 21st.dev Aurora shader and Framer Motion entrance animations. | M1 | DONE |
| 3 | Premium Marketing Hero | Build Apple-like hero with compliance-focused copy, comparison cards, and trust strip. | M2 | DONE |
| 4 | Single-Screen Redaction App | Three-column desktop UI: upload/presets, detectors, advanced options + CTA. | M3 | DONE |
| 5 | Backend Integration | Add `/api/redact` proxy route, wire `FileUploadDemo` to the PDF Redactor backend, and expand accepted file types. | M4 | DONE |
| 6 | E2E Verification | Run lints, tests, and production build. | M5 | DONE |

## Interface Contracts
### File Upload State Handoff
- Component: `FileUpload`
  - Props: `onChange?: (files: File[]) => void`
  - Accept: `['.pdf', '.xls', '.xlsx', '.xlsm', '.docx']`
### Redaction Panel State
- Selection type: `template: "pii" | "financial" | "hipaa" | "gdpr" | null`
- Custom options: `detectors: string[]` (array of selected detector names, e.g. `['phone', 'email', 'name']`)
- Advanced toggles: `{ removeMetadata: boolean, enableOCR: boolean, enableML: boolean, aggressive: boolean, generateReport: boolean }`

## Code Layout
- `src/app/layout.tsx` - Layout root loading Google Fonts, global dark class.
- `src/app/globals.css` - Tailwind v4 variables, aurora animation keyframes.
- `src/app/page.tsx` - Premium marketing hero + single-screen redaction app.
- `src/components/ui/aurora-background.tsx` - 21st.dev Aurora Background shader component.
- `src/components/aurora-background-demo.tsx` - Standalone Aurora demo component.
- `src/components/ui/file-upload.tsx` - Apple-style drag-and-drop upload component.
- `src/components/file-upload-demo.tsx` - Upload + redaction options configuration panel + backend integration.
- `src/app/api/redact/route.ts` - Server-side proxy to the PDF Redactor backend.
- `src/components/navbar.tsx` - Sticky glass navbar with "Redact a file" CTA.
- `src/components/footer.tsx` - Footer component (currently unused).
