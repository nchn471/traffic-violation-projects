from .license_plate_detector import LicensePlateDetector
import numpy as np

class HelmetDetector(LicensePlateDetector):

    def __init__(self, lp__path, ocr_path, vehicle_path, helmet_path, params):
        super().__init__(lp__path, ocr_path, params)
        self.vehicle_detector = self.load_model(vehicle_path)
        self.helmet_detector = self.load_model(helmet_path)

    def detect(self, roi, frame):

        detection_results = self.vehicle_detector.track(
            source=roi,
            conf=0.3,
            iou=0.4,
            imgsz=640,
            persist=True,
            stream=False
        )[0]

        original_frame = np.copy(frame)

        if not hasattr(detection_results, "boxes") or detection_results.boxes is None:
            return
        motorbike_cls_id = next((k for k, v in self.vehicle_detector.names.items() if v == "motorcycle"), None)
        for box in detection_results.boxes:
            if box.id is None:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            track_id = int(box.id[0])
            # conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            
            vehicle_type = self.vehicle_detector.names[cls_id]
            
            if cls_id != motorbike_cls_id:
                continue

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

                    frame_copy = np.copy(original_frame)
                    lp_img, lp_text = self.lp_recognition(vehicle_img)

                    self.draw_bounding_box(frame_copy, x1, y1, x2, y2, color, text)
                    self.draw_bounding_box(
                        frame_copy,
                        x1 + hx1, y1 + hy1,
                        x1 + hx2, y1 + hy2,
                        color,
                        font_scale=0.25,
                        thickness=1
                    )

                    violation_type = "no_helmet"
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
