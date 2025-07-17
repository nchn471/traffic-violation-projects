import cv2
from ultralytics import YOLO

class BaseDetector():
    
    def __init__(self, minio_client, config = None):
        
        self.RED_BGR = (99, 49, 222)
        self.GREEN_BGR = (105, 121, 9)
        self.BLUE_BGR = (186, 82, 15)
        self.WHITE_BGR = (255, 255, 255)
        self.YELLOW_BGR = (0, 255, 255)
        
        self.minio_client = minio_client
        
        if config:
            self.config = config
            
        self.violated_ids = set()

    def load_model(self, model_path: str):
        print(f"Load Model: {model_path}") 
        local_path = self.minio_client.get_file(model_path)
        return YOLO(local_path)
    
    def draw_bounding_box(self, roi, x1, y1, x2, y2, color=(0, 255, 0), label=None, font_scale=0.5, thickness=2):
        cv2.rectangle(roi, (x1, y1), (x2, y2), color, thickness)
 
        if label:
            font = cv2.FONT_HERSHEY_SIMPLEX
            (text_w, text_h), _ = cv2.getTextSize(label, font, font_scale, 1)
            text_bg_top = max(y1 - text_h - 6, 0)
            text_bg_right = x1 + text_w + 6
            text_bg_bottom = y1
            cv2.rectangle(roi, (x1, text_bg_top), (text_bg_right, text_bg_bottom), color, -1)
            cv2.putText(roi, label, (x1 + 3, y1 - 3), font, font_scale, self.WHITE_BGR, 1, cv2.LINE_AA)
    

    
