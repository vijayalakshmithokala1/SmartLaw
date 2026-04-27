# ==========================================
# SmartLaw Backend Dockerfile (FINAL PRO-VERSION)
# ==========================================

FROM python:3.11-slim

# 1. Install system dependencies for OCR (CRITICAL for Legal Analysis)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    libleptonica-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Verify Tesseract installation
RUN tesseract --version

# 3. Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 4. Set Working Directory
WORKDIR /app

# 5. Install Python dependencies
# Copying requirements first and using --no-cache-dir for a clean, pinned install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && python -m spacy download en_core_web_sm

# 6. Copy Backend Application Code
# Since dockerContext is '.', we copy from 'backend/'
COPY backend/ .

# 7. Expose the port (Render default)
EXPOSE 10000

# 8. Start the application using Gunicorn
# Pointing to 'app:app' (the global Flask instance in app.py)
CMD ["gunicorn", "-b", "0.0.0.0:10000", "app:app", "--workers", "1"]