# core/light_detector.py
from core.base_detector import BaseDetector
from core.tracker import Tracker
from ultralytics import YOLO
import numpy as np
import cv2

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
    def __init__(self, model_path, params):
        super().__init__(params)
        self.tracker = Tracker(max_age=30)
        self.model = self.load_model(model_path)
        self.track_states = {}
        self.violation_status = {}
        
    def detect(self, roi, frame):
        detection_results = self.model.predict(source=roi, conf=0.2, verbose=False)[0]

        # Check light color
        light_roi = self.params['light_roi']
        is_red_light = is_red(frame, light_roi)
        light_label = 'RED' if is_red_light else 'GREEN'
        light_color = self.RED_BGR if is_red_light else self.GREEN_BGR

        # Draw light ROI
        cv2.polylines(frame, [np.array(light_roi, dtype=np.int32)], True, light_color, 2)
        cv2.putText(frame, f"Light: {light_label}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, light_color, 2)

        # Draw stop line
        stop_line = self.params['stop_line']
        cv2.line(frame, stop_line[0], stop_line[1], self.YELLOW_BGR, 2)
        y_line = (stop_line[0][1] + stop_line[1][1]) // 2
        # _, width = frame.shape[:2]
        # cv2.line(frame, (0, y_line), (width, y_line), self.YELLOW_BGR, 2)
        y_buffer = 30

        # Prepare detections
        detections = []
        for box in detection_results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = box.conf.item()
            cls = int(box.cls.item())
            detections.append([[x1, y1, x2 - x1, y2 - y1], conf, cls])

        tracks = self.tracker.update(detections, frame=roi)

        for track in tracks:
            if not track.is_confirmed() or not track.det_conf:
                continue
            x1, y1, x2, y2 = map(int, track.to_ltrb())
            center_y = (y1 + (y2 - y1) // 2)  # hoặc center_y = (y1 + y2) // 2

            # cv2.line(frame, (0, center_y), (width, center_y), self.BLUE_BGR, 2)
            

            track_id = track.track_id
            status = self.violation_status.get(track_id, None)
            VIOLATION_LABEL = 'Red Light Violation'
            NO_VIOLATION_LABEL = 'No Violation'
            label = None
            

            if status:
                label = VIOLATION_LABEL if status == True else NO_VIOLATION_LABEL
            else:
                initial_state = self.track_states.get(track_id)
                if not initial_state:
                    if center_y > (y_line + y_buffer):
                        self.violation_status[track_id] = False
                        label = NO_VIOLATION_LABEL
                        
                    elif center_y < (y_line - y_buffer) and is_red_light:
                        self.violation_status[track_id] = True 
                        label = VIOLATION_LABEL
                    else:
                        self.track_states[track_id] = is_red_light
                else:
                    if center_y > (y_line + y_buffer):
                        self.violation_status[track_id] = True if self.track_states[track_id] else False
                        label = VIOLATION_LABEL if self.violation_status[track_id] else NO_VIOLATION_LABEL
                    elif center_y < (y_line - y_buffer) and is_red_light:
                        self.violation_status[track_id] = True
                        label = VIOLATION_LABEL
                    else:
                        self.track_states[track_id] = is_red_light

            color = self.RED_BGR if label == VIOLATION_LABEL else self.GREEN_BGR
            self.draw_bounding_box(frame, x1, y1, x2, y2, color=color, label=label)
