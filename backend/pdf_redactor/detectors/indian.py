"""Indian financial-document detectors."""

from __future__ import annotations

import re

import pymupdf as fitz

from pdf_redactor.utils import dedupe_rects

from .base import Detection, Detector, registry


# Common Indian bank codes (first four letters of IFSC). This is a subset; expand as needed.
IFSC_BANK_CODES = {
    "SBIN", "HDFC", "ICIC", "AXIS", "KKBK", "PNB", "BOB", "UBIN", "IDIB",
    "CNRB", "BOM", "MAHB", "SYNB", "CBIN", "UCBA", "ALLA", "ANDB", "CORP",
    "INDU", "INDB", "YESB", "RBL", "FEDB", "SIBL", "TMBL", "KVBL", "CUB",
    "ESAF", "IDFC", "UTIB", "AIRP", "PYTM", "HSBC", "CITI", "SCBL",
}

# Common UPI PSP handles.
UPI_HANDLES = {
    "upi", "paytm", "googlepay", "phonepe", "amazonpay", "ybl", "ibl", "okaxis",
    "okhdfcbank", "oksbi", "okicici", "okbizaxis", "okbizesel", "payu", "ibl",
    "axis", "hdfcbank", "sbi", "icici", "yesbank", "bankofbaroda", "kotak",
}

# Keywords that often precede an account number.
ACCOUNT_KEYWORDS = [
    r"A/c\s*No", r"A/c\s*Number", r"Account\s*No", r"Account\s*Number",
    r"A/c\s*#", r"Account\s*#", r"Savings\s*A/c", r"Current\s*A/c",
    r"Account\s*ID", r"Acct\s*No",
]

# Keywords around balances.
BALANCE_KEYWORDS = [
    r"Opening\s*Balance", r"Closing\s*Balance", r"Available\s*Balance",
    r"Current\s*Balance", r"Balance\s*as\s*on",
]

# Keywords around transfer receivers.
RECEIVER_KEYWORDS = [
    r"To\s*:", r"To\s*-", r"Beneficiary", r"Payee", r"UPI\s*Ref",
    r"NEFT", r"IMPS", r"RTGS", r"Transfer\s*to",
]

# Keywords around names.
NAME_KEYWORDS = [
    r"Customer\s*Name", r"Account\s*Holder", r"Holder\s*Name", r"Name\s*:",
    r"Customer\s*:", r"Client\s*:", r"Patient\s*:",
    r"Mr\.?", r"Ms\.?", r"Mrs\.?", r"M/S\.?", r"Master\.?", r"Shri\.?", r"Smt\.?", r"Mas\.?",
]

# Keywords around customer/relationship IDs.
ID_KEYWORDS = [
    r"Customer\s*ID", r"CRN", r"Relationship\s*(No|Number|#)", r"Cust\s*ID",
    r"CIF\s*(No|Number)?", r"Customer\s*Number", r"Client\s*ID",
]

# Keywords around addresses.
ADDRESS_KEYWORDS = [
    r"Address\s*:", r"Registered\s*Address", r"Branch\s*Address", r"Resident",
    r"Address",
]

# Indian PIN code pattern.
PINCODE_PATTERN = re.compile(r"\b[1-9][0-9]{5}\b")


@registry.register
class AccountNumberDetector(Detector):
    name = "account"
    enabled_by_default = False

    # Account numbers: 9–18 digits, optionally with dashes/spaces, often preceded by keywords.
    _pattern = re.compile(r"\b(?:\d{9,18}|\d{2,6}[\-\s]\d{3,6}[\-\s]\d{3,6})\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile(
            "(" + "|".join(ACCOUNT_KEYWORDS) + r")\s*[:\-]?\s*",
            re.IGNORECASE,
        )
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                # Require a nearby account keyword or a minimum length.
                before = text[max(0, match.start() - 80) : match.start()]
                has_keyword = keyword_pattern.search(before) is not None
                digits_only = re.sub(r"\D", "", candidate)
                if len(digits_only) < 9:
                    continue
                confidence = "high" if has_keyword else "low"
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence=confidence,
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class IFSCDetector(Detector):
    name = "ifsc"
    enabled_by_default = False

    _pattern = re.compile(r"\b([A-Z]{4})0([A-Z0-9]{6})\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0).upper()
                bank_code = candidate[:4]
                confidence = "high" if bank_code in IFSC_BANK_CODES else "medium"
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence=confidence,
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class MICRDetector(Detector):
    name = "micr"
    enabled_by_default = False

    _pattern = re.compile(r"\b\d{9}\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile(r"MICR", re.IGNORECASE)
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                before = text[max(0, match.start() - 60) : match.start()]
                confidence = "high" if keyword_pattern.search(before) else "low"
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence=confidence,
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class UPIVPADetector(Detector):
    name = "upi"
    enabled_by_default = False

    _pattern = re.compile(r"\b([a-zA-Z0-9._\-]+)@([a-zA-Z0-9]+)\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                handle = match.group(2).lower()
                if handle not in UPI_HANDLES:
                    continue
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class PANDetector(Detector):
    name = "pan"
    enabled_by_default = False

    _pattern = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0).upper()
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class AadhaarDetector(Detector):
    name = "aadhaar"
    enabled_by_default = False

    # Aadhaar: 12 digits, optionally grouped as 4-4-4. Only match near explicit labels.
    _pattern = re.compile(r"\b(?:\d{4}\s\d{4}\s\d{4}|\d{12})\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile(r"Aadhaar|UID|VID|Aadhar", re.IGNORECASE)
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                before = text[max(0, match.start() - 80) : match.start()]
                if not keyword_pattern.search(before):
                    continue
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class BalanceDetector(Detector):
    name = "balance"
    enabled_by_default = False

    # Currency amount with commas and optional decimals.
    _pattern = re.compile(r"\b(?:Rs\.?|INR|₹)?\s*[\d,]+(?:\.\d{2})?\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile("(" + "|".join(BALANCE_KEYWORDS) + r")\s*[:\-]?\s*", re.IGNORECASE)
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                before = text[max(0, match.start() - 100) : match.start()]
                if not keyword_pattern.search(before):
                    continue
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class ReceiverDetector(Detector):
    name = "receiver"
    enabled_by_default = False

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile("(" + "|".join(RECEIVER_KEYWORDS) + r")\s*[:\-]?\s*", re.IGNORECASE)
        # Capture the following text up to a newline or delimiter.
        value_pattern = re.compile(r"(.{3,60}?)(?=\n|\r| {3,}|\t|$)")
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in keyword_pattern.finditer(text):
                end = match.end()
                value_match = value_pattern.match(text, end)
                if not value_match:
                    continue
                candidate = value_match.group(1).strip(" ,;:")
                if len(candidate) < 3:
                    continue
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="medium",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class CustomerIDDetector(Detector):
    name = "customer_id"
    enabled_by_default = False

    _value_pattern = re.compile(r"[:\-]?\s*([A-Za-z0-9]{4,20})")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile("(" + "|".join(ID_KEYWORDS) + r")", re.IGNORECASE)
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in keyword_pattern.finditer(text):
                value_match = self._value_pattern.match(text, match.end())
                if not value_match:
                    continue
                candidate = value_match.group(1).strip()
                if len(candidate) < 4:
                    continue
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class NameDetector(Detector):
    name = "name"
    enabled_by_default = False

    # Titles and suffixes that strongly indicate a person/entity name.
    # Stop at newline so a name does not leak into the next cell/paragraph.
    _name_pattern = re.compile(
        r"\b(?:Mr\.?|Mrs\.?|Ms\.?|M/S\.?|Master\.?|Shri\.?|Smt\.?|Mas\.?)\s*"
        r"([A-Z][a-zA-Z\.]+(?:\s+[A-Z][a-zA-Z\.]+){0,5}(?:\s*\([^)]{2,30}\))?)(?=\n|$)",
        re.IGNORECASE,
    )

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile("(" + "|".join(NAME_KEYWORDS) + r")\s*[:\-]?\s*", re.IGNORECASE)
        value_pattern = re.compile(r"([A-Z][a-zA-Z\.]+(?:\s+[A-Z][a-zA-Z\.]+){0,5}(?:\s*\([^)]{2,30}\))?)(?=\n|$)")
        detections = []
        seen = set()

        for page_num, text in enumerate(text_pages):
            # Strategy 1: explicit labels.
            for match in keyword_pattern.finditer(text):
                end = match.end()
                value_match = value_pattern.match(text, end)
                if not value_match:
                    continue
                candidate = value_match.group(1).strip()
                if len(candidate) < 3 or candidate in seen:
                    continue
                seen.add(candidate)
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="medium",
                        rects=dedupe_rects(rects),
                    )
                )

            # Strategy 2: titles/prefixes.
            for match in self._name_pattern.finditer(text):
                candidate = match.group(1).strip()
                if len(candidate) < 3 or candidate in seen:
                    continue
                seen.add(candidate)
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class AddressDetector(Detector):
    name = "address"
    enabled_by_default = False

    # Lines that mark the end of an address block.
    _terminators = re.compile(
        r"\n\s*\n|Customer|Account\s*(No|Number|ID)|IFSC|MICR|Branch\s*Code|"
        r"Statement\s*(From|To)|Date\s*:|PAN|Aadhaar|Phone|Email|Total",
        re.IGNORECASE,
    )

    def _extract_block(self, text: str, start_pos: int) -> list[str]:
        """Extract address lines around a position until terminators."""
        lines_before = []
        lines_after = []

        # Split text into lines and find which line contains start_pos.
        all_lines = text.splitlines()
        char_count = 0
        start_line_idx = 0
        for idx, line in enumerate(all_lines):
            if char_count <= start_pos < char_count + len(line) + 1:
                start_line_idx = idx
                break
            char_count += len(line) + 1

        # Collect a few lines before and after.
        for i in range(max(0, start_line_idx - 2), start_line_idx):
            stripped = all_lines[i].strip()
            if stripped and not self._terminators.search(stripped):
                lines_before.append(stripped)

        for i in range(start_line_idx, min(len(all_lines), start_line_idx + 5)):
            line = all_lines[i]
            if self._terminators.search(line):
                break
            stripped = line.strip()
            if stripped:
                lines_after.append(stripped)

        return lines_before + lines_after

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile("(" + "|".join(ADDRESS_KEYWORDS) + r")\s*[:\-]?\s*", re.IGNORECASE)
        detections = []
        seen_spans = set()
        for page_num, text in enumerate(text_pages):
            # Strategy 1: explicit Address labels.
            for match in keyword_pattern.finditer(text):
                block = self._extract_block(text, match.end())
                candidate = "\n".join(block).strip()
                if len(candidate) < 10 or not PINCODE_PATTERN.search(candidate):
                    continue
                key = (page_num, candidate[:80])
                if key in seen_spans:
                    continue
                seen_spans.add(key)
                page = document.load_page(page_num)
                rects = []
                for line in block[:4]:
                    rects.extend(page.search_for(line))
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="medium",
                        rects=dedupe_rects(rects),
                    )
                )

            # Strategy 2: PIN-code-driven blocks (catches addresses without labels).
            for pin_match in PINCODE_PATTERN.finditer(text):
                pin = pin_match.group(0)
                block = self._extract_block(text, pin_match.start())
                candidate = "\n".join(block).strip()
                if len(candidate) < 15:
                    continue
                key = (page_num, candidate[:80])
                if key in seen_spans:
                    continue
                seen_spans.add(key)
                page = document.load_page(page_num)
                rects = []
                for line in block[:4]:
                    rects.extend(page.search_for(line))
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="medium",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections
