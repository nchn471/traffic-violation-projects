from core.base_detector import BaseDetector
import numpy as np

class HelmetDetector(BaseDetector):
    def __init__(self, vehicle_path, helmet_path, minio_client, config):
        super().__init__(minio_client, config)
        self.vehicle_detector = self.load_model(vehicle_path)
        self.helmet_detector = self.load_model(helmet_path)

    def detect(self, roi, frame):
        detection_results = self.vehicle_detector.track(
            source=roi,
            conf=0.3,
            iou=0.4,
            imgsz=640,
            persist=True,
            stream=False,
            tracker="bytetrack.yaml"
        )[0]

        if not hasattr(detection_results, "boxes") or detection_results.boxes is None:
            return {"frame": frame, "violations": []}

        motorbike_cls_id = next(
            (k for k, v in self.vehicle_detector.names.items() if v == "motorbike"), None
        )

        original_frame = np.copy(frame)
        violations = []

        for box in detection_results.boxes:
            if box.id is None or int(box.cls[0]) != motorbike_cls_id:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            track_id = int(box.id[0])
            vehicle_type = self.vehicle_detector.names[int(box.cls[0])]

            vehicle_img = roi[y1:y2, x1:x2]
            if vehicle_img.size == 0:
                continue

            helmet_results = self.helmet_detector.predict(
                source=vehicle_img,
                imgsz=320,
                conf=0.45,
                iou=0.45
            )[0]

            for hbox in helmet_results.boxes:
                hx1, hy1, hx2, hy2 = map(int, hbox.xyxy[0].tolist())
                label = self.helmet_detector.names[int(hbox.cls[0])]
                helmet_conf = float(hbox.conf[0])

                color = self.GREEN_BGR if label == "Helmet" else self.RED_BGR
                text = f"#{track_id} {label} {int(helmet_conf * 100)}%"

                # Draw on current frame
                self.draw_bounding_box(frame, x1, y1, x2, y2, color, text)
                self.draw_bounding_box(
                    frame,
                    x1 + hx1, y1 + hy1,
                    x1 + hx2, y1 + hy2,
                    color,
                    font_scale=0.25,
                    thickness=1
                )

                if helmet_conf > 0.65 and label == "Without Helmet" and track_id not in self.violated_ids:
                    self.violated_ids.add(track_id)

                    # Draw on violation copy
                    frame_copy = np.copy(original_frame)
                    self.draw_bounding_box(frame_copy, x1, y1, x2, y2, color, text)
                    self.draw_bounding_box(
                        frame_copy,
                        x1 + hx1, y1 + hy1,
                        x1 + hx2, y1 + hy2,
                        color,
                        font_scale=0.25,
                        thickness=1
                    )

                    violation = self.track_violation(
                        session_id=self.config.get("session_id"),
                        camera_id=self.config.get("camera_id"),
                        violation_type="no_helmet",
                        confidence=helmet_conf,
                        vehicle_type=vehicle_type,
                        frame_img=frame_copy,
                        vehicle_img=vehicle_img,
                    )

                    violations.append(violation)

        return {"frame": frame, "violations": violations}
