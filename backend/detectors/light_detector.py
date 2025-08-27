import cv2
import numpy as np
from core.base_detector import BaseDetector

def is_red(frame, light_roi, threshold=0.008):
    mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    cv2.fillPoly(mask, [np.array(light_roi, dtype=np.int32)], 255)
    masked = cv2.bitwise_and(frame, frame, mask=mask)
    hsv = cv2.cvtColor(masked, cv2.COLOR_BGR2HSV)

    lower_red1 = np.array([0, 50, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 50, 50])
    upper_red2 = np.array([180, 255, 255])

    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = mask1 | mask2

    red_ratio = np.sum(red_mask) / mask.size
    return red_ratio > threshold
    
class LightDetector(BaseDetector):
    def __init__(self, vehicle_path, minio_client, config):
        super().__init__(minio_client, config)
        self.model = self.load_model(vehicle_path)
        self.track_states = {}
        self.violation_status = {}
        
    def detect(self, roi, frame):
        
        results = self.model.track(
            source=roi,
            conf=0.3,
            tracker="bytetrack.yaml",
            imgsz=640,
            persist=True,
            stream=False,
            verbose=False
        )[0]

        violations = []
        original_frame = np.copy(frame)
        light_roi = self.config['light_roi']
        is_red_light = is_red(frame, light_roi)
        light_label = 'RED' if is_red_light else 'GREEN'
        light_color = self.RED_BGR if is_red_light else self.GREEN_BGR

        cv2.polylines(frame, [np.array(light_roi, dtype=np.int32)], True, light_color, 2)
        
        self.draw_label_top_left(
            frame,
            f"Light: {light_label}",
            line=0,
            text_color=light_color,
            background_color=self.BLACK_BGR
        )
        
        stop_line = self.config['stop_line']
        cv2.line(frame, stop_line[0], stop_line[1], self.YELLOW_BGR, 2)

        stop_line = (stop_line[0][1] + stop_line[1][1]) // 2
        stop_buffer = 30
        if not results or not results.boxes:
            return {"frame": frame, "violations": []}

        for box in results.boxes:
            if box.id is None:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            track_id = int(box.id[0])
            cls_id = int(box.cls[0])
            vehicle_type = self.model.names[cls_id]
            confidence = float(box.conf[0])
            track_id = int(box.id[0])

            vehicle_centroid = (y1 + y2) // 2
            
            VIOLATION_LABEL = "cross red light"

            is_violated = self.violation_status.get(track_id)
            label = None

            if is_violated:
                label = VIOLATION_LABEL

            else:
                # Trạng thái đèn lúc lần đầu gặp xe
                initial_red_light = self.track_states.get(track_id)

                if initial_red_light is None:
                    # Lần đầu gặp track_id
                    if vehicle_centroid > (stop_line + stop_buffer):
                        # Xe đã ở dưới vạch dừng
                        pass

                    elif vehicle_centroid < (stop_line - stop_buffer) and is_red_light:
                        # Xe vượt vạch dừng khi đèn đỏ
                        self.violation_status[track_id] = True
                        label = VIOLATION_LABEL

                    else:
                        # Xe ở trong vùng [stop_line - stop_buffer, stop_line + stop_buffer]
                        self.track_states[track_id] = is_red_light

                else:
                    # Đã biết trạng thái đèn ban đầu của xe này
                    if vehicle_centroid > (stop_line + stop_buffer):
                        #  Xe từ vùng  [stop_line - stop_buffer, stop_line + stop_buffer] xuống dưới vạch và trạng thái đèn gần nhất là đỏ
                        if initial_red_light is True:
                            self.violation_status[track_id] = True
                            label = VIOLATION_LABEL

                    elif vehicle_centroid < (stop_line - stop_buffer) and is_red_light:
                        # Xe trên vạch và đèn đỏ
                        self.violation_status[track_id] = True
                        label = VIOLATION_LABEL

                    else:
                        # Cập nhật lại trạng thái đèn gần nhất
                        self.track_states[track_id] = is_red_light

            # Gán nhãn cuối cùng để hiển thị
            text = f"#{track_id} {vehicle_type} {int(confidence * 100)}%"
            if label:
                text += f" - {label}"
                
            color = self.RED_BGR if label == VIOLATION_LABEL else self.GREEN_BGR
            self.draw_bounding_box(frame, x1, y1, x2, y2, color=color, label=text)

            if label == VIOLATION_LABEL and track_id not in self.violated_ids:
                self.violated_ids.add(track_id)

                frame_copy = np.copy(original_frame)
                vehicle_img = frame_copy[y1:y2, x1:x2]

                self.draw_bounding_box(frame_copy, x1, y1, x2, y2, color=color, label=label)

                violation = self.track_violation(
                    session_id=self.config.get("session_id"),
                    camera_id=self.config.get("camera_id"),
                    violation_type="red_light",
                    confidence=confidence,
                    vehicle_type=vehicle_type,
                    frame_img=frame_copy,
                    vehicle_img=vehicle_img,
                )

                violations.append(violation)

        return {
            "frame": frame,
            "violations": violations
        }

