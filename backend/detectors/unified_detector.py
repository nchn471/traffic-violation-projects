import cv2
import numpy as np
from core.base_detector import BaseDetector
from .light_detector import is_red


class UnifiedDetector(BaseDetector):
    def __init__(self, vehicle_path, helmet_path, minio_client, config):
        super().__init__(minio_client, config)
        self.vehicle_detector = self.load_model(vehicle_path)
        self.helmet_detector = self.load_model(helmet_path)

        self.track_states = {}
        self.violation_status = {}
        self.violated_ids = set()

        self.lanes = [
            {
                "id": lane.get("id", idx + 1),
                "polygon": np.array(lane["polygon"], dtype=np.int32),
                "allow_labels": lane["allow_labels"]
            }
            for idx, lane in enumerate(config.get("lanes", []))
        ]

        self.stop_line = config.get("stop_line")
        self.light_roi = config.get("light_roi")

        self.motorbike_cls_id = next(
            (k for k, v in self.vehicle_detector.names.items() if v == "motorbike"), None
        )

    def detect(self, roi, frame):
        original_frame = np.copy(frame)
        violations = []

        results = self.vehicle_detector.track(
            source=roi,
            imgsz=640,
            conf=0.3,
            iou=0.4,
            persist=True,
            stream=False,
            tracker="bytetrack.yaml"
        )[0]


        is_red_light = is_red(frame, self.light_roi)
        light_label = "RED" if is_red_light else "GREEN"
        light_color = self.RED_BGR if is_red_light else self.GREEN_BGR

        cv2.polylines(frame, [np.array(self.light_roi, dtype=np.int32)], True, light_color, 2)
        self.draw_label_top_left(
            frame,
            f"Light: {light_label}",
            line=0,
            text_color=light_color,
            background_color=self.BLACK_BGR
        )

        stop_line_pts = self.stop_line
        cv2.line(frame, stop_line_pts[0], stop_line_pts[1], self.YELLOW_BGR, 2)
        stop_line = (stop_line_pts[0][1] + stop_line_pts[1][1]) // 2
        stop_buffer = 30
        
        for lane in self.lanes:
            color = self.GREEN_BGR
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
                    self.YELLOW_BGR,
                    thickness=2,
                    lineType=cv2.LINE_AA,
                )

        for i, lane in enumerate(self.lanes):
            label_text = f"Lane {lane['id']}: {', '.join(lane['allow_labels'])}"
            self.draw_label_top_left(
                image=frame,
                text=label_text,
                line=i + 1,
                text_color=self.YELLOW_BGR,
                background_color=self.BLACK_BGR
            )

        if not results or not results.boxes:
            return {"frame": frame, "violations": []}

        for box in results.boxes:
            if box.id is None:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
            cls_id = int(box.cls[0])
            vehicle_type = self.vehicle_detector.names[cls_id]
            vehicle_conf = float(box.conf[0])
            track_id = int(box.id[0])
            vehicle_img = roi[y1:y2, x1:x2]
            tags = []
            color = self.GREEN_BGR
            vehicle_centroid = (y1 + y2) // 2
            label = f"#{track_id} {vehicle_type} {int(vehicle_conf * 100)}%"

            if cls_id == self.motorbike_cls_id and vehicle_img.size > 0:
                helmet_result = self.helmet_detector.predict(
                    source=vehicle_img,
                    imgsz=320,
                    conf=0.45,
                    iou=0.45
                )[0]

                for hbox in helmet_result.boxes:
                    hx1, hy1, hx2, hy2 = map(int, hbox.xyxy[0].tolist())
                    helmet_label = self.helmet_detector.names[int(hbox.cls[0])]
                    helmet_conf = float(hbox.conf[0])
                    
                    if helmet_label == "Without Helmet":
                        color = self.RED_BGR
                        tags.append("no helmet")
        
                    self.draw_bounding_box(
                        frame,
                        x1 + hx1, y1 + hy1,
                        x1 + hx2, y1 + hy2,
                        color,
                        font_scale=0.5,
                        thickness=1
                    )
                    text = label + " - no helmet"
                    if helmet_label == "Without Helmet" and helmet_conf > 0.65:
                        if track_id not in self.violated_ids:
                            self.violated_ids.add(track_id)
                            violations.append(self._log_violation(
                                "no_helmet", helmet_conf, vehicle_type,
                                original_frame, vehicle_img, (x1, y1, x2, y2),
                                text
                            ))

            for lane in self.lanes:
                if cv2.pointPolygonTest(lane["polygon"], (cx, cy), False) >= 0:
                    if vehicle_type not in lane["allow_labels"]:
                        if track_id not in self.violated_ids:
                            self.violated_ids.add(track_id)
                            text = label + " - wrong lane"
                            violations.append(self._log_violation(
                                "wrong_lane", vehicle_conf, vehicle_type,
                                original_frame, vehicle_img, (x1, y1, x2, y2),
                                text
                            ))
                        tags.append("wrong lane")
                        color = self.RED_BGR
                    break

            if self._check_red_violation(track_id, vehicle_centroid, stop_line, stop_buffer, is_red_light):
                tags.append("cross red light")
                color = self.RED_BGR

                if track_id not in self.violated_ids:
                    self.violated_ids.add(track_id)
                    text = label + " - cross red light"
                    violations.append(self._log_violation(
                        "red_light", vehicle_conf, vehicle_type,
                        original_frame, vehicle_img, (x1, y1, x2, y2),
                        text
                    ))
                    
            if tags:
                label += " - " + " | ".join(tags)
            self.draw_bounding_box(frame, x1, y1, x2, y2, color, label)

        return {"frame": frame, "violations": violations}

    def _check_red_violation(self, track_id, vehicle_centroid, stop_line, stop_buffer, is_red_light):
        if self.violation_status.get(track_id):
            return True

        initial_red_light = self.track_states.get(track_id)

        if initial_red_light is None:
            if vehicle_centroid > (stop_line + stop_buffer):
                return False
            elif vehicle_centroid < (stop_line - stop_buffer):
                if is_red_light:
                    self.violation_status[track_id] = True
                    return True
            else:
                self.track_states[track_id] = is_red_light
        else:
            if vehicle_centroid > (stop_line + stop_buffer):
                if initial_red_light:
                    self.violation_status[track_id] = True
                    return True
            elif vehicle_centroid < (stop_line - stop_buffer):
                if is_red_light:
                    self.violation_status[track_id] = True
                    return True
            else:
                self.track_states[track_id] = is_red_light

        return False


    def _log_violation(self, violation_type, confidence, vehicle_type, frame, vehicle_img, bbox, label):
        x1, y1, x2, y2 = bbox
        frame_copy = np.copy(frame)
        self.draw_bounding_box(frame_copy, x1, y1, x2, y2, self.RED_BGR, label)
        return self.track_violation(
            session_id=self.config.get("session_id"),
            camera_id=self.config.get("camera_id"),
            violation_type=violation_type,
            confidence=confidence,
            vehicle_type=vehicle_type,
            frame_img=frame_copy,
            vehicle_img=vehicle_img
        )
