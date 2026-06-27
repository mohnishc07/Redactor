"""Command-line interface for PDF Redactor."""

from __future__ import annotations

import argparse
import json
import os
import sys

from .detectors import registry
from pdf_redactor.utils import COLOR_MAP

from .engine import RedactionEngine, RedactionOptions
from .ml.ner import MLDetectorRegistry


def print_logo():
    print(
        r"""
_____  _____  ______ _____          _            _
|  __ \|  __ \|  ____|  __ \        | |          | |
| |__) | |  | | |__  | |__) |___  __| | __ _  ___| |_ ___  _ __
|  ___/| |  | |  __| |  _  // _ \/ _` |/ _` |/ __| __/ _ \| '__|
| |    | |__| | |    | | \ \  __/ (_| | (_| | (__| || (_) | |
|_|    |_____/|_|    |_|  \_\___|\__,_|\__,_|\___|\__\___/|_|
                                    PDFRedactor
                                                @ltillmann
        """
    )


def validate_input_path(file_path: str) -> bool:
    if not os.path.exists(file_path):
        print(f"[Error] No such Path/File: {file_path}\nPlease specify path or make sure file exists.")
        sys.exit(1)

    if os.path.isdir(file_path):
        return True

    if os.path.isfile(file_path):
        ext = file_path.lower().split(".")[-1]
        if ext in {"pdf", "xlsx", "xlsm", "docx"}:
            return False

    print(f"[Error] File '{file_path}' is not a supported file (PDF, XLSX, XLSM, DOCX).")
    sys.exit(1)


def validate_output_flag(output: str | None, input_is_dir: bool) -> None:
    if not output:
        return
    supported_exts = (".pdf", ".xlsx", ".xlsm", ".docx")
    if input_is_dir:
        if output.lower().endswith(supported_exts):
            raise ValueError(f"Output must be a directory when processing multiple files. Given: {output}")
        os.makedirs(output, exist_ok=True)
        return
    if output.lower().endswith(supported_exts):
        os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)
        return
    if os.path.exists(output) and not os.path.isdir(output):
        raise ValueError(f"Output must be a supported file or a directory. Given: {output}")
    os.makedirs(output, exist_ok=True)


def default_output_path(input_path: str) -> str:
    stem, ext = os.path.splitext(input_path)
    return f"{stem}_redacted{ext}"


def resolve_single_file_output_path(input_path: str, output_path: str | None) -> str:
    if not output_path:
        return default_output_path(input_path)
    if output_path.lower().endswith((".pdf", ".xlsx", ".xlsm", ".docx")):
        return output_path
    return os.path.join(output_path, os.path.basename(default_output_path(input_path)))


def build_options(args: argparse.Namespace) -> RedactionOptions:
    detectors = []
    flag_map = {
        "phonenumber": "phone",
        "link": "link",
        "email": "email",
        "iban": "iban",
        "bic": "bic",
        "timestamp": "timestamp",
        "date": "date",
        "barcode": "barcode",
        "qrcode": "qrcode",
        "ssn": "ssn",
        "passport": "passport",
        "creditcard": "creditcard",
        "secret": "secret",
        "customer_id": "customer_id",
        "account": "account",
        "ifsc": "ifsc",
        "micr": "micr",
        "upi": "upi",
        "pan": "pan",
        "aadhaar": "aadhaar",
        "balance": "balance",
        "receiver": "receiver",
        "name": "name",
        "address": "address",
    }
    for flag, detector in flag_map.items():
        if getattr(args, flag, False):
            detectors.append(detector)

    return RedactionOptions(
        detectors=detectors,
        ml=args.ml,
        ml_detectors=args.ml_detector,
        aggressive=args.aggressive,
        text=args.text,
        color=args.color,
        color_hex=args.color_hex,
        text_color=args.text_color,
        text_color_hex=args.text_color_hex,
        preview=args.preview,
        geographic_code=args.geographic_code,
        custom_masks=args.mask or [],
        template=args.template,
        remove_metadata=args.remove_metadata,
        ocr=args.ocr,
    )


def process_single_file(engine: RedactionEngine, file_path: str, output_path: str | None, args: argparse.Namespace) -> None:
    options = build_options(args)
    output_path = resolve_single_file_output_path(file_path, output_path)
    print(f"[i] Analysing file '{file_path}'\n")
    report = engine.process(file_path, output_path, options)
    _print_summary(report)
    print(f"\n[i] Saving changes to '{output_path}'")
    if args.report:
        report_path = f"{os.path.splitext(output_path)[0]}_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report.to_dict(), f, indent=2)
        print(f"[i] Report saved to '{report_path}'")


def _print_summary(report):
    print("\n[i] Redaction Summary")
    total = len(report.detections)
    print(f" |  Total detections: {total}")
    if not report.summary:
        print(" |  No sensitive data detected.")
        return
    for detector, counts in sorted(report.summary.items()):
        subtotal = sum(counts.values())
        conf_str = ", ".join(f"{k}={v}" for k, v in counts.items() if v)
        print(f" |  {detector}: {subtotal} ({conf_str})")


def process_directory(engine: RedactionEngine, dir_path: str, output_path: str | None, args: argparse.Namespace) -> None:
    print(f"\n[i] Analysing directory '{dir_path}'\n")
    for filename in os.listdir(dir_path):
        if not filename.lower().endswith((".pdf", ".xlsx", ".xlsm", ".docx")):
            continue
        file_path = os.path.join(dir_path, filename)
        out = (
            os.path.join(output_path, os.path.basename(default_output_path(filename)))
            if output_path
            else default_output_path(file_path)
        )
        process_single_file(engine, file_path, out, args)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="pdf_redactor.py")
    parser.add_argument("-i", "--input", help="Filename to be processed.", required=True)
    parser.add_argument("-o", "--output", help="Output path.")
    parser.add_argument("-e", "--email", action="store_true", help="Redact email addresses.")
    parser.add_argument("-l", "--link", action="store_true", help="Redact links.")
    parser.add_argument("-p", "--phonenumber", action="store_true", help="Redact phone numbers.")
    parser.add_argument("-v", "--preview", action="store_true", help="Preview redactions before continuing.")
    parser.add_argument("-g", "--geographic-code", type=str, help="Geographic code for phone number detection.")
    parser.add_argument("-m", "--mask", action="append", type=str, help="Custom word mask to redact.")
    parser.add_argument("-t", "--text", type=str, default=None, help="Text to show in redacted areas.")
    parser.add_argument("-c", "--color", default="black", choices=list(COLOR_MAP.keys()), help="Fill color.")
    parser.add_argument("-C", "--text-color", default="white", choices=list(COLOR_MAP.keys()), help="Text color.")
    parser.add_argument("-d", "--date", action="store_true", help="Redact dates.")
    parser.add_argument("-f", "--timestamp", action="store_true", help="Redact timestamps.")
    parser.add_argument("-s", "--iban", action="store_true", help="Redact IBANs.")
    parser.add_argument("-b", "--bic", action="store_true", help="Redact BICs.")
    parser.add_argument("-r", "--barcode", action="store_true", help="Redact barcodes.")
    parser.add_argument("-q", "--qrcode", action="store_true", help="Redact QR codes.")
    parser.add_argument("-x", "--color-hex", type=str, help="Fill color in HEX.")
    parser.add_argument("-X", "--text-color-hex", type=str, help="Text color in HEX.")

    # New Indian / financial detectors
    parser.add_argument("-a", "--account", action="store_true", help="Redact bank account numbers.")
    parser.add_argument("--ifsc", action="store_true", help="Redact Indian IFSC codes.")
    parser.add_argument("--micr", action="store_true", help="Redact MICR codes.")
    parser.add_argument("-u", "--upi", action="store_true", help="Redact UPI VPAs.")
    parser.add_argument("--pan", action="store_true", help="Redact PAN numbers.")
    parser.add_argument("--aadhaar", action="store_true", help="Redact Aadhaar / VID numbers.")
    parser.add_argument("-B", "--balance", action="store_true", help="Redact opening/closing balances.")
    parser.add_argument("-R", "--receiver", action="store_true", help="Redact receiver names/accounts in transfers.")
    parser.add_argument("-n", "--name", action="store_true", help="Redact customer/beneficiary names.")
    parser.add_argument("-A", "--address", action="store_true", help="Redact addresses.")
    parser.add_argument("--customer-id", action="store_true", help="Redact customer/relationship IDs.")
    parser.add_argument("--ssn", action="store_true", help="Redact US Social Security numbers.")
    parser.add_argument("--passport", action="store_true", help="Redact passport numbers.")
    parser.add_argument("--creditcard", action="store_true", help="Redact credit card numbers (with Luhn check).")
    parser.add_argument("--secret", action="store_true", help="Redact API keys, tokens, and secrets.")

    # Compliance / output quality
    parser.add_argument("--template", choices=list(RedactionOptions.TEMPLATES.keys()), help="Apply a compliance preset.")
    parser.add_argument("--remove-metadata", action="store_true", help="Strip PDF metadata after redaction.")
    parser.add_argument("--ocr", action="store_true", help="Run OCR before detection (requires Tesseract).")

    # ML / quality
    parser.add_argument("--ml", action="store_true", help="Enable optional ML detectors.")
    parser.add_argument("--ml-detector", action="append", default=["name", "address"], help="ML detectors to enable.")
    parser.add_argument("--aggressive", action="store_true", help="Also redact low-confidence detections.")
    parser.add_argument("--report", action="store_true", help="Write a JSON redaction report next to the output.")

    return parser


def main(argv: list[str] | None = None) -> None:
    print_logo()
    parser = build_parser()
    args = parser.parse_args(argv)

    input_is_dir = validate_input_path(args.input)
    validate_output_flag(args.output, input_is_dir)

    ml_registry = MLDetectorRegistry() if args.ml else None
    engine = RedactionEngine(ml_registry=ml_registry)

    if args.text:
        print(f"\n[i] Using custom redaction text {args.text}")

    if input_is_dir:
        process_directory(engine, args.input, args.output, args)
    else:
        process_single_file(engine, args.input, args.output, args)


# Import here to avoid circular dependency in parser defaults.
from pdf_redactor.utils import COLOR_MAP  # noqa: E402


if __name__ == "__main__":
    main()
