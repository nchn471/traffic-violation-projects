import cv2
import numpy as np
from core.base_detector import BaseDetector

class LaneDetector(BaseDetector):
    def __init__(self, vehicle_path, minio_client, config):
        super().__init__(minio_client, config)

        self.config["lanes"] = [
            {
                "id": lane.get("id", idx + 1),
                "polygon": np.array(lane["polygon"], dtype=np.int32),
                "allow_labels": lane["allow_labels"]
            }
            for idx, lane in enumerate(self.config["lanes"])
        ]

        self.vehicle_detector = self.load_model(vehicle_path)

    def detect(self, roi, frame):
        original_frame = np.copy(frame)
        violations = []

        color = self.BLUE_BGR  

        for lane in self.config["lanes"]:
            pts = lane["polygon"].reshape((-1, 1, 2))
            cv2.polylines(frame, [pts], isClosed=True, color=color, thickness=2)

            M = cv2.moments(pts)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                cv2.putText(
                    frame,
                    f"Lane: {lane['id']}",
                    (cx, cy),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    color,
                    thickness=2,
                    lineType=cv2.LINE_AA,
                )

        for i, lane in enumerate(self.config["lanes"]):
            label_text = f"Lane {lane['id']}: {', '.join(lane['allow_labels'])}"
            self.draw_label_top_left(
                image=frame,
                text=label_text,
                line=i,
                text_color=self.YELLOW_BGR,
                background_color=self.BLACK_BGR,  
            )

            
        results = self.vehicle_detector.track(
            source=roi,
            imgsz=640,
            conf=0.3,
            iou=0.4,
            persist=True,
            stream=False,
            tracker="bytetrack.yaml"
        )[0]

        if not results or not results.boxes:
            return {
                "frame": frame,
                "violations": []
            }

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

            for lane in self.config["lanes"]:
                inside = cv2.pointPolygonTest(lane["polygon"], (cx, cy), False)
                if inside >= 0:
                    matched_lane_id = lane["id"]
                    if vehicle_type not in lane["allow_labels"]:
                        violation = True
                    break

            if matched_lane_id:
                color = self.RED_BGR if violation else self.GREEN_BGR
                tag = "Violation" if violation else f"Lane {matched_lane_id}"
                text = f"#{track_id} {vehicle_type} {int(lane_conf * 100)}% - {tag}"
                self.draw_bounding_box(frame, x1, y1, x2, y2, color, text)

                if violation and track_id not in self.violated_ids:
                    self.violated_ids.add(track_id)

                    frame_copy = np.copy(original_frame)
                    vehicle_img = original_frame[y1:y2, x1:x2]
                    self.draw_bounding_box(frame_copy, x1, y1, x2, y2, color, text)

                    violation = self.track_violation(
                        session_id=self.config.get("session_id"),
                        camera_id=self.config.get("camera_id"),
                        violation_type="wrong_lane",
                        confidence=lane_conf,
                        vehicle_type=vehicle_type,
                        frame_img=frame_copy,
                        vehicle_img=vehicle_img,
                    )

                    violations.append(violation)


        return {
            "frame": frame,
            "violations": violations
        }