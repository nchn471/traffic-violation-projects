import cv2
import os
import json
from ultralytics import YOLO
from datetime import datetime
from deep_sort_realtime.deepsort_tracker import DeepSort
from utils import *

VIDEO_BASE_PATH = 'backend/video'
MODEL_PATH_VEHICLE = 'backend/model/vehicle.pt'
MODEL_PATH_HELMET = 'backend/model/best_helmet_end.pt'
VIOLATION_FOLDER = './violations'
os.makedirs(VIOLATION_FOLDER, exist_ok=True)

track_vehicle = DeepSort(max_age=30)
track_helmet = DeepSort(max_age=30)
track_light = DeepSort(max_age=30)

model_vehicle = YOLO(MODEL_PATH_VEHICLE)
model_helmet = YOLO(MODEL_PATH_HELMET)

RED_BGR      = (99, 49, 222)
GREEN_BGR    = (105, 121, 9)
BLUE_BGR     = (186, 82, 15)
WHITE_BGR = (255, 255, 255)

def process_video(params_json: str):
    params = json.loads(params_json)
    video_path = os.path.join(VIDEO_BASE_PATH, params['video_name'])
    cap = cv2.VideoCapture(video_path)
    print(f"Connected to {params['video_name']}")
    print(f"Detection Type: {params['detection_type']}")

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            process_frame(frame, params)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()

def process_frame(frame, params):
    roi = frame[params['roi_y1']:params['roi_y2'], params['roi_x1']:params['roi_x2']]
    detection_type = params['detection_type']

    if detection_type in ['vehicle', 'helmet']:
        handle_vehicle_and_helmet_detection(roi, params)
    elif detection_type == 'lane':
        handle_lane_detection(roi, frame, params)
    elif detection_type == 'light':
        handle_light_detection(roi, frame, params)

    frame[params['roi_y1']:params['roi_y2'], params['roi_x1']:params['roi_x2']] = roi
    cv2.rectangle(frame, (params['roi_x1'], params['roi_y1']), (params['roi_x2'], params['roi_y2']), (255, 0, 0), 3)
    cv2.imshow('Video Processing', frame)

def handle_vehicle_and_helmet_detection(roi, params):
    current_track_vehicle = detect_track_objects(roi, model_vehicle, track_vehicle)
    for track in current_track_vehicle:
        draw_vehicle_tracking(roi, track, model_vehicle)
        if params['detection_type'] == 'helmet':
            handle_helmet_detection(roi, track)


def detect_track_objects(roi, model, tracker):
    results = model.predict(source=roi, imgsz=320, conf=0.3, iou=0.4)[0]
    detections = []
    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        conf = box.conf.item()
        cls = int(box.cls.item())
        detections.append([[x1, y1, x2 - x1, y2 - y1], conf, cls])
    tracked_objects = tracker.update_tracks(detections, frame=roi)
    return tracked_objects

def draw_vehicle_tracking(roi, track, model):
    if not (track.is_confirmed() and track.det_conf):
        return
    x1, y1, x2, y2 = map(int, track.to_ltrb())
    label = model.names[int(track.det_class)]
    text = f"{label} ({round(track.det_conf, 2)})"
    draw_bounding_box(roi, x1, y1, x2, y2, BLUE_BGR, text)
    
def draw_bounding_box(roi, x1, y1, x2, y2, color=(0, 255, 0), label="Object", font_scale=0.5, thickness=2):
    cv2.rectangle(roi, (x1, y1), (x2, y2), color, thickness)
    font = cv2.FONT_HERSHEY_SIMPLEX
    (text_w, text_h), _ = cv2.getTextSize(label, font, font_scale, 1)
    text_bg_top = max(y1 - text_h - 6, 0)
    text_bg_right = x1 + text_w + 6
    text_bg_bottom = y1
    cv2.rectangle(roi, (x1, text_bg_top), (text_bg_right, text_bg_bottom), color, -1)
    cv2.putText(roi, label, (x1 + 3, y1 - 3), font, font_scale, WHITE_BGR, 1, cv2.LINE_AA)
       
def handle_helmet_detection(roi, track):
    x1, y1, x2, y2 = map(int, track.to_ltrb())
    crop_img = roi[y1:y2, x1:x2]

    if crop_img.size == 0:
        return

    results = model_helmet.predict(source=crop_img, imgsz=320, conf=0.45, iou=0.45)[0]


    for box in results.boxes:
        hx1, hy1, hx2, hy2 = map(int, box.xyxy[0].tolist())
        label = model_helmet.names[int(box.cls[0])]
        conf = float(box.conf[0])

        color = GREEN_BGR if label == "Helmet" else RED_BGR
        text = f"{label}: {conf:.2f}"
        draw_bounding_box(roi,x1+hx1,y1+hy1,x1+hx2,y1+hy2,color,text, font_scale=0.25,thickness=1)
        if conf > 0.65 and label == "Without Helmet":
            pass
            #TODO: violation recorder



def handle_lane_detection(roi, frame, params):
    midpoint_x = params['roi_x1'] + (params['roi_x2'] - params['roi_x1']) // 2
    cv2.line(frame, (midpoint_x, params['roi_y1']), (midpoint_x, params['roi_y2']), (0, 0, 255), 2)
    results = model_vehicle.predict(source=roi, imgsz=320, conf=0.3, iou=0.4)[0]
    for box in results.boxes:
        check_and_draw_lane_violation(roi, frame, box, params, midpoint_x)

def check_and_draw_lane_violation(roi, frame, box, params, midpoint_x):
    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
    vehicle_center_x = (x1 + x2) // 2
    vehicle_label = model_vehicle.names[int(box.cls.item())]
    lane = "Left" if vehicle_label in params['left_labels'] else "Right" if vehicle_label in params['right_labels'] else None
    if lane and ((lane == "Left" and vehicle_center_x > midpoint_x) or (lane == "Right" and vehicle_center_x < midpoint_x)):
        color = (0, 0, 255)
        cv2.rectangle(frame, (params['roi_x1'] + x1, params['roi_y1'] + y1), (params['roi_x1'] + x2, params['roi_y1'] + y2), color, 2)
        cv2.putText(frame, f"{vehicle_label} - Lane Violation", (params['roi_x1'] + x1, params['roi_y1'] + y1 - 10), cv2.FONT_HERSHEY_TRIPLEX, 0.5, color, 2)
        save_violation_image(frame, "Lane Violation")

def handle_light_detection(roi, frame, params):
    tich_luy = 0
    state_all = {}
    ok = {}
    y_line = params['y_line']
    roi_y1 = params['roi_y1']
    y_line_buffer = 30
    light_frame = frame[params['light_roi_x1']:params['light_roi_x2'], params['light_roi_y1']:params['light_roi_y2']]
    red, tich_luy, _ = is_red(light_frame, tich_luy_hien_tai=tich_luy)
    text = 'RED' if red else 'GREEN'
    light_color = (0, 0, 255) if red else (0, 255, 0)

    cv2.putText(frame, f"Light: {text}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, light_color, 2)
    cv2.rectangle(frame, (params['light_roi_x1'], params['light_roi_y1']), (params['light_roi_x2'], params['light_roi_y2']), (0, 255, 255), 2)
    cv2.line(frame, (0, y_line), (frame.shape[1], y_line), (0, 255, 255), 2)

    result = model_vehicle.predict(roi, conf=0.35, verbose=False)
    if len(result):
        result = result[0]
        detect = []
        for box in result.boxes:
            x1, y1, x2, y2 = list(map(int, box.xyxy[0]))
            conf = box.conf.item()
            cls = int(box.cls.item())
            detect.append([[x1, y1, x2 - x1, y2 - y1], conf, cls])

        tracks = track_light.update_tracks(detect, frame=roi)
        for track in tracks:
            if track.is_confirmed() and track.det_conf:
                x1, y1, x2, y2 = list(map(int, track.to_ltrb()))
                yc = roi_y1 + (y1 + (y2 - y1) // 2)
                track_id = track.track_id
                is_ok = ok.get(track_id, None)
                label = None

                if is_ok:
                    label = "k vuot" if ok[track_id] == 2 else "vuot"
                else:
                    state = state_all.get(track_id)
                    if state is None:
                        if yc > (y_line + y_line_buffer):
                            ok[track_id] = 2
                            label = "k vuot"
                        elif yc < (y_line - y_line_buffer) and red:
                            ok[track_id] = 1
                            label = "vuot"
                        else:
                            state_all[track_id] = red
                    else:
                        if yc > (y_line + y_line_buffer):
                            ok[track_id] = 1 if state_all[track_id] else 2
                            label = "k vuot" if ok[track_id] == 2 else "vuot"
                        elif yc < (y_line - y_line_buffer) and red:
                            ok[track_id] = 1
                            label = "vuot"
                        else:
                            state_all[track_id] = red

                if label:
                    color = (0, 0, 255) if label == 'vuot' else (0, 255, 0)
                    cv2.rectangle(roi, (x1, y1), (x2, y2), color, 2)
                    cv2.rectangle(roi, (x1 - 1, y1 - 20), (x1 + len(label) * 12, y1), color, -1)
                    cv2.putText(roi, label, (x1 + 5, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)

def save_violation_image(image, violation_type):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(VIOLATION_FOLDER, f"{violation_type.replace(' ', '_')}_{timestamp}.jpg")
    cv2.imwrite(path, image)
    print(f"Saved: {path}")

if __name__ == "__main__":
    params = {
        "video_name": "La-Khê-Hà_Đông.mp4",
        "roi_x1": 100,
        "roi_y1": 350,
        "roi_x2": 1150,
        "roi_y2": 750,
        "detection_type": "helmet",
        "left_labels": ["car", "truck"],
        "right_labels": ["motorcycle", "bicycle"],
        "light_roi_x1": 650,
        "light_roi_y1": 5,
        "light_roi_x2": 700,
        "light_roi_y2": 50,
        "y_line": 450
    }
    process_video(json.dumps(params))
