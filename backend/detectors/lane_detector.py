import cv2
import numpy as np
from core.base_detector import BaseDetector

class LaneDetector(BaseDetector):
    def __init__(self, vehicle_path, minio_client, params):
        super().__init__(minio_client, params)
        lanes = self.params['lanes']
        self.lanes = [
            {
                "id": lane.get("id", idx + 1), 
                "polygon": np.array(lane["polygon"], dtype=np.int32),
                "allow_labels": lane["allow_labels"]
            }
            for idx, lane in enumerate(lanes)
        ]
        self.vehicle_detector = self.load_model(vehicle_path)
        
    def detect(self, roi, frame):

        original_frame = np.copy(frame)
        violations = []
        
        for lane in self.lanes:
            cv2.polylines(frame, [lane["polygon"]], isClosed=True, color=self.BLUE_BGR, thickness=2)
            
        results = self.vehicle_detector.track(
            source=roi,
            imgsz=320,
            conf=0.3,
            iou=0.4,
            persist=True,
            stream=False,
            tracker="bytetrack.yaml"
        )[0]
        
        if not results or not results.boxes:
            return frame, []
        
        for box in results.boxes:
            if box.id is None:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            cls_id = int(box.cls[0])
            vehicle_type = self.vehicle_detector.names[cls_id]
            lane_conf = float(box.conf[0])
            track_id = int(box.id[0])

            violation = False
            matched_lane_id = None

            for lane in self.lanes:
                inside = cv2.pointPolygonTest(lane["polygon"], (cx, cy), False)
                if inside >= 0:
                    matched_lane_id = lane["id"]
                    if vehicle_type not in lane["allow_labels"]:
                        violation = True
                    break

            if matched_lane_id:
                color = self.RED_BGR if violation else self.GREEN_BGR
                tag = f"Violation" if violation else f"Lane {matched_lane_id}"
                text = f"#{track_id} {vehicle_type} - {tag}"
                self.draw_bounding_box(frame, x1, y1, x2, y2, color, text)

                if violation and track_id not in self.violated_ids:
                    self.violated_ids.add(track_id)

                    frame_copy = np.copy(original_frame)
                    vehicle_img = original_frame[y1:y2, x1:x2]
                    
                    self.draw_bounding_box(frame_copy, x1, y1, x2, y2, color, text)

                    violation = {
                        "violation_type" : "wrong_lane",
                        "vehicle_type" : vehicle_type,
                        "confidence" : lane_conf,
                        "location" : self.params["location"],
                        "violation_frame" : frame_copy,
                        "vehicle_frame" : vehicle_img,
                    }
                    violations.append(violation)
                    
        return frame, violations
