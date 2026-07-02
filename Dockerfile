FROM python:3.12-slim

WORKDIR /app

# Install system deps for pyzbar / opencv.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzbar0 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Optional ML layer; uncomment to include spaCy.
# COPY backend/requirements-ml.txt .
# RUN pip install --no-cache-dir -r requirements-ml.txt

COPY backend/ .

EXPOSE 8000

ENV REDACTOR_MAX_WORKERS=2
ENV REDACTOR_ENABLE_ML=false

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
