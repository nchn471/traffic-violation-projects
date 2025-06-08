FROM python:3.12.9-slim

WORKDIR /app

COPY kafka_handlers/consumers/docker_yolo_image/requirements.txt ./requirements.txt

RUN apt-get update && apt-get install libgl1 libglib2.0-0 -y

RUN python -m venv /venv \
    && /venv/bin/pip install --upgrade pip \
    && /venv/bin/pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PATH="/venv/bin:$PATH"

