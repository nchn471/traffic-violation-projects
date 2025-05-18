import os
import cv2
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort
import numpy as np

executor = ThreadPoolExecutor()
model_vehicle = YOLO('backend/model/best_helmet_end.pt')
model_helmet = YOLO('backend/model/vehicle.pt')
track_vehicle = DeepSort(max_age=30)
track_light = DeepSort(max_age=30)

def detect_violation(video_path: str, config: dict):
    roi_x1 = config.get("roi_x1", 100)
    roi_y1 = config.get("roi_y1", 350)
    roi_x2 = config.get("roi_x2", 1150)
    roi_y2 = config.get("roi_y2", 750)
    detection_type = config.get("detection_type", "none").lower()
    left_labels = config.get("left_labels", [])
    right_labels = config.get("right_labels", [])

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise IOError(f"Cannot open video {video_path}")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            roi = frame[roi_y1:roi_y2, roi_x1:roi_x2]

            if detection_type in ['vehicle', 'helmet']:
                roi = process_vehicle_or_helmet(roi, video_path, detection_type)

            elif detection_type == 'lane':
                frame = process_lane_violation(roi, frame, video_path, roi_x1, roi_y1, roi_x2, roi_y2, left_labels, right_labels)

            elif detection_type == 'light':
                frame = process_light_violation(roi, frame, video_path, config, roi_y1)

            frame[roi_y1:roi_y2, roi_x1:roi_x2] = roi
            yield frame

    finally:
        cap.release()

# Function to detect if a frame is red
def is_red(frame, threshold=0.008, tich_luy_hien_tai=0, tich_luy=3):
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    lower_red1 = np.array([0, 70, 50])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([170, 70, 50])
    upper_red2 = np.array([180, 255, 255])
    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = mask1 | mask2
    red_ratio = np.sum(red_mask) / red_mask.size

    if red_ratio > threshold:
        return True, tich_luy_hien_tai + 1, None
    else:
        return False, tich_luy_hien_tai, None
    
def process_vehicle_or_helmet(roi, video_path, detection_type):
    detect_vehicle = []
    results_vehicle = model_vehicle.predict(source=roi, imgsz=320, conf=0.3, iou=0.4)[0]
    for box in results_vehicle.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        conf = box.conf.item()
        cls = int(box.cls.item())
        detect_vehicle.append([[x1, y1, x2 - x1, y2 - y1], conf, cls])

    current_track_vehicle = track_vehicle.update_tracks(detect_vehicle, frame=roi)

    for track in current_track_vehicle:
        if not (track.is_confirmed() and track.det_conf):
            continue

        x1, y1, x2, y2 = map(int, track.to_ltrb())
        confidence = track.det_conf
        label = track.det_class

        if confidence > 0.65:
            cv2.rectangle(roi, (x1, y1), (x2, y2), (0, 255, 0), 1)

        if detection_type == 'helmet':
            crop_img = roi[y1:y2, x1:x2]
            if crop_img.size == 0:
                continue
            results_helmet = model_helmet.predict(source=crop_img, imgsz=320, conf=0.45, iou=0.45)[0]
            for helmet_box in results_helmet.boxes:
                hx1, hy1, hx2, hy2 = map(int, helmet_box.xyxy[0].tolist())
                hlabel = helmet_box.cls[0]
                hconfidence = helmet_box.conf[0]
                if hconfidence > 0.65 and model_helmet.names[int(hlabel)] == "Without Helmet":
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    cv2.imwrite(violation_image_path, crop_img)
    return roi


def process_lane_violation(roi, frame, video_path, roi_x1, roi_y1, roi_x2, roi_y2, left_labels, right_labels):
    midpoint_x = roi_x1 + (roi_x2 - roi_x1) // 2
    cv2.line(frame, (midpoint_x, roi_y1), (midpoint_x, roi_y2), (0, 0, 255), 2)

    results_vehicle = model_vehicle.predict(source=roi, imgsz=320, conf=0.3, iou=0.4)[0]
    for box in results_vehicle.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        vehicle_center_x = (x1 + x2) // 2
        vehicle_label = model_vehicle.names[int(box.cls.item())]

        if vehicle_label in left_labels:
            lane = "Left"
        elif vehicle_label in right_labels:
            lane = "Right"
        else:
            continue

        if (lane == "Left" and vehicle_center_x > midpoint_x) or (lane == "Right" and vehicle_center_x < midpoint_x):
            color = (0, 0, 255)
            cv2.rectangle(frame, (roi_x1 + x1, roi_y1 + y1), (roi_x1 + x2, roi_y1 + y2), color, 2)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    return frame


def process_light_violation(roi, frame, video_path, config, roi_y1):
    tich_luy = 0
    state_all = {}
    ok = {}

    light_roi_x1 = config.get('lightRoiX1', 0)
    light_roi_y1 = config.get('lightRoiY1', 0)
    light_roi_x2 = config.get('lightRoiX2', 0)
    light_roi_y2 = config.get('lightRoiY2', 0)
    y_line = config.get('yLine', 450)
    y_line_buffer = 30

    light_frame = frame[light_roi_y1:light_roi_y2, light_roi_x1:light_roi_x2]
    red, tich_luy, _ = is_red(light_frame, tich_luy_hien_tai=tich_luy)

    detect = []
    results_vehicle = model_vehicle.predict(roi, imgsz=320, conf=0.35)[0]
    for box in results_vehicle.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        conf = box.conf.item()
        cls = int(box.cls.item())
        detect.append([[x1, y1, x2 - x1, y2 - y1], conf, cls])

    tracks = track_light.update_tracks(detect, frame=roi)
    for track in tracks:
        if not track.is_confirmed() or not track.det_conf:
            continue

        x1, y1, x2, y2 = map(int, track.to_ltrb())
        yc = roi_y1 + (y1 + (y2 - y1) // 2)
        track_id = track.track_id

        is_ok = ok.get(track_id, None)
        if is_ok:
            label = "k vuot" if ok[track_id] == 2 else 'vuot'
        else:
            state = state_all.get(track_id)
            if state is None and yc > (y_line + y_line_buffer):
                ok[track_id] = 2
                label = "k vuot"
            elif state is None and yc < (y_line - y_line_buffer) and red:
                ok[track_id] = 1
                label = "vuot"
            else:
                label = None

        if label:
            color = (0, 0, 255) if label == 'vuot' else (0, 255, 0)
            cv2.rectangle(roi, (x1, y1), (x2, y2), color, 2)

    return frame

# Cấu hình detection
config = {
    "roi_x1": 100,
    "roi_y1": 350,
    "roi_x2": 1150,
    "roi_y2": 750,
    "detection_type": "helmet",  # vehicle, helmet, lane, light
    "left_labels": ["car", "bike"],
    "right_labels": ["truck"],
    "lightRoiX1": 0,
    "lightRoiY1": 0,
    "lightRoiX2": 100,
    "lightRoiY2": 100,
    "yLine": 450
}

video_path = '/mnt/data/ĐATN/traffic-violation-projects/backend/video/La-Khê-Hà_Đông.mp4'

for frame in detect_violation(video_path, config):
    cv2.imshow("Violation Detection", frame)

    # Nhấn 'q' để thoát
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cv2.destroyAllWindows()