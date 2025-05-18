import os
import cv2
import json
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

# Config
VIDEO_PATH = 'backend/video/La-Khê-Hà_Đông.mp4'
MODEL_PATH_VEHICLE = 'backend/model/vehicle.pt'
MODEL_PATH_HELMET = 'backend/model/best_helmet_end.pt'

model_vehicle = YOLO(MODEL_PATH_VEHICLE)
model_helmet = YOLO(MODEL_PATH_HELMET)
track_vehicle = DeepSort(max_age=30)

def test_video(video_path: str, detection_type: str = 'helmet', roi_x1: int = 100, roi_y1: int = 350, roi_x2: int = 1150, roi_y2: int = 750):
    cap = cv2.VideoCapture(video_path)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        roi = frame[roi_y1:roi_y2, roi_x1:roi_x2]

        if detection_type in ['vehicle', 'helmet']:
            detect_vehicle = []
            results_vehicle = model_vehicle.predict(source=roi, imgsz=320, conf=0.3, iou=0.4)[0]
            for box in results_vehicle.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = box.conf.item()
                cls = int(box.cls.item())
                detect_vehicle.append([[x1, y1, x2 - x1, y2 - y1], conf, cls])

            current_tracks = track_vehicle.update_tracks(detect_vehicle, frame=roi)

            for track in current_tracks:
                if not (track.is_confirmed() and track.det_conf):
                    continue
                x1, y1, x2, y2 = list(map(int, track.to_ltrb()))
                label = model_vehicle.names[int(track.det_class)]
                cv2.rectangle(roi, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(roi, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

        frame[roi_y1:roi_y2, roi_x1:roi_x2] = roi
        cv2.rectangle(frame, (roi_x1, roi_y1), (roi_x2, roi_y2), (255, 0, 0), 2)

        cv2.imshow('Detection Test', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    test_video(VIDEO_PATH, detection_type='helmet')
