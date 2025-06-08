FROM python:3.12.9-slim

WORKDIR /app

COPY requirements.txt .

RUN apt-get update && apt-get install libgl1 libglib2.0-0 -y

RUN python -m venv /venv \
    && /venv/bin/pip install --upgrade pip \
    && /venv/bin/pip install --no-cache-dir -r requirements.txt

RUN pip install passlib
COPY . .

ENV PATH="/venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
