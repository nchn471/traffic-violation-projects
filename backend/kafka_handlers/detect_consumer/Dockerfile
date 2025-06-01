FROM python:3.12.9

WORKDIR /app

COPY kafka_handlers/detect_consumer/requirements.txt /app/requirements.txt

RUN apt-get update && apt-get install libgl1 -y

RUN python -m venv /venv \
    && /venv/bin/pip install --upgrade pip \
    && /venv/bin/pip install -r /app/requirements.txt


COPY . .
ENV PATH="/venv/bin:$PATH"

# CMD ["python", "-m", "kafka_handlers.detect_consumer.consumer"]

