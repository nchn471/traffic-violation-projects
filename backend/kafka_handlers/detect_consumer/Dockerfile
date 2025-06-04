FROM python:3.12.9-slim

WORKDIR /app

RUN apt-get update && apt-get install libgl1 -y

COPY kafka_handlers/detect_consumer/requirements.txt ./requirements.txt

RUN python -m venv /venv \
    && /venv/bin/pip install --upgrade pip \
    && /venv/bin/pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PATH="/venv/bin:$PATH"

# CMD ["python", "-m", "kafka_handlers.detect_consumer.consumer"]
