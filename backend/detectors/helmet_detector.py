from core.base_detector import BaseDetector
from core.tracker import Tracker
from ultralytics import YOLO

class HelmetDetector(BaseDetector):

    RED_BGR = (99, 49, 222)
    GREEN_BGR = (105, 121, 9)
    BLUE_BGR = (186, 82, 15)
    WHITE_BGR = (255, 255, 255)
    
    def __init__(self, vehicle_path, helmet_path):
        super().__init__()
        self.tracker = Tracker(max_age=30)
        self.vehicle_detector = self.load_model(vehicle_path)
        self.helmet_detector = self.load_model(helmet_path)


    def detect(self, roi, frame):
        detection_results = self.vehicle_detector.predict(source=roi, imgsz=640, conf=0.2, iou=0.4)[0]

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
            x1, y1, x2, y2 = list(map(int, track.to_ltrb()))
            vehicle_img = roi[y1:y2, x1:x2]
            if vehicle_img.size == 0:
                return

            helmet_results = self.helmet_detector.predict(source = vehicle_img,imgsz=320, conf=0.1, iou=0.45)[0]
        
            for box in helmet_results.boxes:
                hx1, hy1, hx2, hy2 = map(int, box.xyxy[0].tolist())
                label = self.helmet_detector.names[int(box.cls[0])]
                conf = float(box.conf[0])

                color = self.GREEN_BGR if label == "Helmet" else self.RED_BGR
                text = f"{label}: {int(conf*100)}%"
                self.draw_bounding_box(frame, x1, y1, x2, y2, color, text)
                self.draw_bounding_box(frame, x1 + hx1, y1 + hy1, x1 + hx2, y1 + hy2, color, font_scale=0.25, thickness=1)
        
                # if conf > 0.65 and label == "Without Helmet":
                #     pass
                #     #TODO: violation recorder