# core/frame_processor.py

import cv2
import numpy as np

class FrameProcessor:
    def __init__(self, detector, roi):
        self.detector = detector
        self.roi = np.array(roi, dtype=np.int32)  
        
    def extract_roi(self, frame, buffer=0):
        mask = np.zeros(frame.shape[:2], dtype=np.uint8)

        # Tạo polygon mask với ROI và buffer (tạm thời dùng boundingRect để buffer thôi)
        x, y, w, h = cv2.boundingRect(self.roi)
        x1 = max(x - buffer, 0)
        y1 = max(y - buffer, 0)
        x2 = min(x + w + buffer, frame.shape[1])
        y2 = min(y + h + buffer, frame.shape[0])

        # Vẽ polygon (ROI thật sự) lên mask
        cv2.fillPoly(mask, [self.roi], 255)

        # Áp mask lên ảnh: vùng ngoài ROI sẽ bị đen
        roi_applied = cv2.bitwise_and(frame, frame, mask=mask)

        # Tạo hiệu ứng overlay vùng ROI (optional)
        overlay = frame.copy()
        color = (255, 255, 150)
        alpha = 0.1

        cv2.fillPoly(overlay, [self.roi], color)
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
        cv2.polylines(frame, [self.roi], isClosed=True, color=(255, 0, 0), thickness=1)

        return roi_applied


    def process(self, frame):
        roi = self.extract_roi(frame)

        result = self.detector.detect(roi, frame)

        return result

