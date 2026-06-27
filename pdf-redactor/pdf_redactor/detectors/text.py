"""Text-based detectors: phone, email, IBAN, BIC, timestamp, date."""

from __future__ import annotations

import re
from collections import defaultdict

import phonenumbers
import pymupdf as fitz

from pdf_redactor.utils import dedupe_rects, iban_checksum, validate_date

from .base import Detection, Detector, registry


@registry.register
class MaskDetector(Detector):
    name = "mask"
    enabled_by_default = False

    def __init__(self, **options):
        super().__init__(**options)
        self.custom_masks = options.get("custom_masks", [])

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for mask in self.custom_masks:
            pattern = self._build_pattern(mask)
            for page_num, text in enumerate(text_pages):
                for match in pattern.finditer(text):
                    candidate = match.group(0)
                    rects = document.load_page(page_num).search_for(candidate)
                    detections.append(
                        Detection(
                            page=page_num,
                            text=candidate,
                            detector=self.name,
                            confidence="high",
                            rects=dedupe_rects(rects),
                            meta={"mask": mask},
                        )
                    )
        return detections

    @staticmethod
    def _build_pattern(mask: str):
        prefix = r"\b" if mask and re.match(r"\w", mask[0]) else ""
        suffix = r"\b" if mask and re.match(r"\w", mask[-1]) else ""
        return re.compile(f"{prefix}{re.escape(mask)}{suffix}", flags=re.IGNORECASE)


# Common uppercase words that should never be treated as BICs.
BIC_STOP_WORDS = {
    "DEPOSITS", "WITHDRAWALS", "PARTICULARS", "CUSTOMER", "INTEREST",
    "DEPOSIT", "WITHDRAWAL", "TRANSACTION", "BALANCE", "STATEMENT",
    "ACCOUNT", "PROVIDED", "PERSONAL", "INTERNET", "SERVICES", "ELIGIBLE",
    "ACCIDENT", "BLOCKING", "REVISION", "DOMESTIC", "ENTERPRISES",
    "NECESSARILY", "CORPORATION", "CAPACITY", "CIRCULATION", "DEDUCTED",
    "DATABASE", "EXISTING", "SECURITY", "IMMEDIATELY", "CATEGORY",
    "INFORMATION", "SPECIFIC", "TRANSFER", "RECHARGE", "NATIONAL",
    "DOWNLOAD", "INCLUDED", "INCLUDES", "ADJUSTED", "PREVIOUS",
    "DEDUCTED", "WHEREVER", "EMPLOYEE", "VERIFIED", "PROCEEDS", "DISTRICT",
}

# Common SWIFT institution codes (first 4 characters of BIC).
BIC_INSTITUTION_CODES = {
    # International
    "DEUT", "CITI", "HSBC", "CHAS", "BOFA", "BARC", "NWBK", "RBOS", "SOGE",
    "BNPA", "SOCG", "AGRI", "COBA", "DABA", "HAND", "ESSE", "FOLK", "SKIE",
    "UBSW", "CRES", "BCVA", "PICT", "LLOY", "SCBL", "ANZB", "WFBI", "USBK",
    "BOTK", "MHCBJPJT", "SMBC", "ICBK", "BKCH", "ABOC", "COMM", "PSBC",
    # Indian banks
    "HDFC", "ICIC", "SBIN", "AXIS", "KKBK", "PUNB", "BARB", "CANA", "UBIN",
    "IDIB", "INDB", "YESB", "RBLX", "SVCB", "FDRL", "KARB", "VIJB", "SBMY",
    "COSB", "NESF", "JSBL", "TSBL", "KCCB", "SPCB", "VVCX", "AIRP", "PYTM",
}

# Country codes for BIC positions 5-6 (ISO 3166-1 alpha-2 subset used by SWIFT).
BIC_COUNTRY_CODES = {
    "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
    "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
    "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
    "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
    "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
    "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
    "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
    "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
    "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
    "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
    "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
    "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
    "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
    "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
    "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
    "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
}


@registry.register
class PhoneNumberDetector(Detector):
    name = "phone"
    enabled_by_default = False

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        region = self.options.get("geographic_code")
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in phonenumbers.PhoneNumberMatcher(text, region):
                rects = document.load_page(page_num).search_for(match.raw_string)
                detections.append(
                    Detection(
                        page=page_num,
                        text=match.raw_string,
                        detector=self.name,
                        confidence="high" if region else "medium",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class EmailDetector(Detector):
    name = "email"
    enabled_by_default = False

    # Stricter than \S+@\S+\.\S+: excludes paths, requires proper local-part chars.
    _pattern = re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    )

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                # Reject if it looks like a URL/path fragment.
                if "/" in candidate or "\\" in candidate:
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
class IBANDetector(Detector):
    name = "iban"
    enabled_by_default = False

    _pattern = re.compile(
        r"\b[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?!(?:[ ]?[0-9]){3})(?:[ ]?[0-9]{1,2})?\b"
    )

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                if not iban_checksum(candidate):
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
class BICDetector(Detector):
    name = "bic"
    enabled_by_default = False

    _pattern = re.compile(r"\b[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?\b")

    # Context keywords that strongly indicate a real BIC/SWIFT code.
    _context_pattern = re.compile(r"\b(SWIFT|BIC|BIC\s*Code|SWIFT\s*Code|Bank\s*Identifier)\b", re.IGNORECASE)

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0).upper()
                if candidate in BIC_STOP_WORDS:
                    continue
                country = candidate[4:6]
                if country not in BIC_COUNTRY_CODES:
                    continue
                institution = candidate[:4]
                before = text[max(0, match.start() - 80) : match.start()]
                has_context = self._context_pattern.search(before) is not None
                known_institution = institution in BIC_INSTITUTION_CODES

                if known_institution:
                    confidence = "high"
                elif has_context:
                    confidence = "medium"
                else:
                    continue

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
class TimestampDetector(Detector):
    name = "timestamp"
    enabled_by_default = False

    _pattern = re.compile(r"\b(?:[0-1]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
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
class DateDetector(Detector):
    name = "date"
    enabled_by_default = False

    # Match dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy and month-name variants.
    _separators = r"[.\-/]"
    _pattern = re.compile(
        rf"\b([0-2]?[0-9]|3[01]){_separators}([A-Za-z]{{3,9}}|0?[1-9]|1[0-2]|0[1-9])"
        rf"{_separators}(\d{{4}}|\d{{2}})\b"
    )

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        month_map = {
            "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
            "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6,
            "jul": 7, "july": 7, "aug": 8, "august": 8, "sep": 9, "sept": 9,
            "september": 9, "oct": 10, "october": 10, "nov": 11, "november": 11,
            "dec": 12, "december": 12,
            "januar": 1, "februar": 2, "märz": 3, "maiar": 4, "mai": 5, "juni": 6,
            "juli": 7, "oktober": 10, "dezember": 12,
        }
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                day_str, month_str, year_str = match.groups()
                day = int(day_str)
                month = month_map.get(month_str.lower())
                if month is None:
                    try:
                        month = int(month_str)
                    except ValueError:
                        continue
                year = int(year_str)
                if year < 100:
                    year += 2000 if year < 50 else 1900
                if not validate_date(day, month, year):
                    continue
                candidate = match.group(0)
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
