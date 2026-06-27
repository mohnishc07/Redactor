"""Detector registry and public exports."""

from .base import Detection, Detector, DetectorRegistry, registry
from .codes import BarcodeDetector, QRCodeDetector
from .indian import (
    AadhaarDetector,
    AccountNumberDetector,
    BalanceDetector,
    CustomerIDDetector,
    IFSCDetector,
    MICRDetector,
    NameDetector,
    PANDetector,
    ReceiverDetector,
    UPIVPADetector,
)
from .links import LinkDetector
from .pii import CreditCardDetector, PassportDetector, SecretDetector, SSNDetector
from .text import (
    BICDetector,
    DateDetector,
    EmailDetector,
    IBANDetector,
    MaskDetector,
    PhoneNumberDetector,
    TimestampDetector,
)

__all__ = [
    "Detection",
    "Detector",
    "DetectorRegistry",
    "registry",
    "BarcodeDetector",
    "QRCodeDetector",
    "AadhaarDetector",
    "AccountNumberDetector",
    "BalanceDetector",
    "CustomerIDDetector",
    "IFSCDetector",
    "MICRDetector",
    "NameDetector",
    "PANDetector",
    "ReceiverDetector",
    "UPIVPADetector",
    "LinkDetector",
    "CreditCardDetector",
    "PassportDetector",
    "SecretDetector",
    "SSNDetector",
    "BICDetector",
    "DateDetector",
    "EmailDetector",
    "IBANDetector",
    "MaskDetector",
    "PhoneNumberDetector",
    "TimestampDetector",
]
