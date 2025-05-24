import cv2
import numpy as np
from core.base_detector import BaseDetector
from ultralytics import YOLO

class LaneDetector(BaseDetector):
    def __init__(self, model_path, params):
        super().__init__(params)
        lanes = params['lanes']
        self.lanes = [
            {
                "id": lane.get("id", idx + 1), 
                "polygon": np.array(lane["polygon"], dtype=np.int32),
                "allow_labels": lane["allow_labels"]
            }
            for idx, lane in enumerate(lanes)
        ]
        self.model = self.load_model(model_path)
        
    def detect(self, roi, frame):
        detection_results = self.model.predict(source=roi, imgsz=320, conf=0.3, iou=0.4)[0]

        # Vẽ lane
        for lane in self.lanes:
            cv2.polylines(frame, [lane["polygon"]], isClosed=True, color=(255, 255, 0), thickness=2)

        for box in detection_results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            cls_id = int(box.cls.item())
            label = self.model.names[cls_id]

            violation = False
            matched_lane_id = None

            for lane in self.lanes:
                inside = cv2.pointPolygonTest(lane["polygon"], (cx, cy), False)
                if inside >= 0:
                    matched_lane_id = lane["id"]
                    if label not in lane["allow_labels"]:
                        violation = True
                    break

            if matched_lane_id:
                color = self.RED_BGR if violation else self.GREEN_BGR
                tag = "Violation" if violation else f"Lane {matched_lane_id}"
                self.draw_bounding_box(frame, x1, y1, x2, y2, color, f"{label} - {tag}")
