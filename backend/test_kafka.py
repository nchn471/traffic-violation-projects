from kafka import KafkaProducer
import json
import base64
import cv2

# Kết nối đến Kafka broker
producer = KafkaProducer(
    bootstrap_servers='localhost:9094',  
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Đọc ảnh và encode base64 (có thể dùng ảnh bất kỳ)
image_path = 'backend/video/test.png'  # Đảm bảo có file ảnh này trong cùng thư mục
with open(image_path, 'rb') as f:
    image_bytes = f.read()

encoded_image = base64.b64encode(image_bytes).decode('utf-8')

# Gửi message test
message = {
    "session_id": "test_session_001",
    "session_id": "test_session_001",
    "frame": encoded_image,
    "params": {
        "detection_type": "helmet"
    }
}

producer.send('raw-frames', value=message)
producer.flush()

print("✅ Message sent to topic 'raw-frames'")
