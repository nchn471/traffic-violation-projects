import cv2
import numpy as np
from .license_plate_detector import LicensePlateDetector

class LaneDetector(LicensePlateDetector):
    def __init__(self, lp__path, ocr_path, vehicle_path, params):
        super().__init__(lp__path, ocr_path, params)
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

        self.violation_ids = set()

    def detect(self, roi, frame):
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
            return

        for lane in self.lanes:
            cv2.polylines(frame, [lane["polygon"]], isClosed=True, color=self.BLUE_BGR, thickness=2)
        original_frame = np.copy(frame)


        for box in results.boxes:
            if box.id is None:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            cls_id = int(box.cls[0])
            vehicle_type = self.vehicle_detector.names[cls_id]
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

                if violation and track_id not in self.violation_ids:
                    self.violation_ids.add(track_id)

                    frame_copy = np.copy(original_frame)
                    vehicle_img = original_frame[y1:y2, x1:x2]
                    lp_img, lp_text = self.lp_recognition(vehicle_img)

                    self.draw_bounding_box(frame_copy, x1, y1, x2, y2, color, text)
                    
                    violation_type = "wrong_lane"
                    location = self.params["location"]
                    self.violation_recorder.save_violation_snapshot(
                        vehicle_type,
                        violation_type,
                        location,
                        frame_copy,
                        vehicle_img,
                        lp_img,
                        lp_text
                    )
