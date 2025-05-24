import cv2
from detectors.vehicle_detector import VehicleDetector
from detectors.light_detector import LightDetector
from detectors.helmet_detector import HelmetDetector
from detectors.lane_detector import LaneDetector
from detectors.license_plate_detector import LicensePlateDetector

from core.frame_processor import FrameProcessor
import json
# Tham số cấu hình
params = {
    "roi": [(73, 718), (342, 330), (1061, 323), (1076, 331), (1019, 394), (1009, 453), (1026, 509), (1052, 572), (1096, 649), (1141, 717), (1141, 717)],  
    # "roi" : [(2, 957), (0, 459), (67, 356), (632, 334), (869, 359), (1272, 610), (1294, 662), (1417, 801), (1596, 935), (1598, 957), (1598, 957)],
    # "light_roi" : [(546, 12), (542, 72), (613, 73), (607, 13)],
    "stop_line" :  [(154, 566), (1066, 541)],
    "light_roi": [(650, 5), (700, 5), (700, 50), (650, 50)],
    "detection_type": "lp",  
    "lanes": [
        {
            "id": 1,
            "polygon": [(76, 717), (274, 417), (543, 422), (492, 719)],
            "allow_labels": ["car", "truck"]
        },
        {
            "id": 2,
            "polygon": [(492, 719),(543, 422),  (758, 440), (790, 717)],
            "allow_labels": ["motorcycle", "bicycle"]
        },
        {
            "id": 3,
            "polygon": [(790, 717),(758, 440),  (1009, 429), (1172, 719)],
            "allow_labels": ["car", "motorcycle", "truck", "bicycle"]
        }
    ]
} 
# Load model
vehicle_detector = VehicleDetector('backend/model/vehicle.pt')
light_detector = LightDetector('backend/model/vehicle.pt', params)
helmet_detector = HelmetDetector('backend/model/vehicle.pt','backend/model/best_helmet_end.pt')
lane_detector = LaneDetector('backend/model/vehicle.pt', params)
lp_detector = LicensePlateDetector('backend/model/lp_yolo11_best.pt', 'backend/model/lp_yolo11_best.pt')
# Lấy detector phù hợp với detection_type
detectors = {
    "vehicle": vehicle_detector,
    "light": light_detector,
    "helmet": helmet_detector,
    "lane": lane_detector,
    "lp" : lp_detector
}
selected_detector = detectors[params["detection_type"]]

# Tạo FrameProcessor
frame_processor = FrameProcessor(selected_detector, params)

# Mở video
cap = cv2.VideoCapture('backend/video/test.MOV')

while True:
    ret, frame = cap.read()
    if not ret:
        break

    processed_frame = frame_processor.process(frame)

    cv2.imshow('Detection', processed_frame)
    if cv2.waitKey(1) & 0xFF == 27:  # ESC để thoát
        break

cap.release()
cv2.destroyAllWindows()
