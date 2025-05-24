# core/vehicle_detector.py
from core.base_detector import BaseDetector
from core.tracker import Tracker
from ultralytics import YOLO

class VehicleDetector(BaseDetector):
    
    def __init__(self, model_path):
        super().__init__()
        self.model = self.load_model(model_path)
        self.tracker = Tracker(max_age=30)
        
    def detect(self, roi, frame):
        
        detection_results = self.model.predict(source=roi, imgsz=640, conf=0.2, iou=0.4)[0]

        detections = []
        
        for box in detection_results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            conf = box.conf.item()
            cls = int(box.cls.item())
            detections.append([[x1, y1, x2 - x1, y2 - y1], conf, cls])

        tracks = self.tracker.update(detections, frame=roi)

        for track in tracks:
            if not (track.is_confirmed() and track.det_conf):
                continue
            x1, y1, x2, y2 = map(int, track.to_ltrb())
            label = self.model.names[int(track.det_class)]
            conf = round(track.det_conf, 2)
            text = f"{label[:5]}: {int(conf*100)}%"
            self.draw_bounding_box(frame, x1, y1, x2, y2, self.BLUE_BGR, text)
        
