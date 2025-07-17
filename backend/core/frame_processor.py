# core/frame_processor.py

import cv2
import numpy as np

class FrameProcessor:
    def __init__(self, detector, roi):
        self.detector = detector
        self.roi = np.array(roi, dtype=np.int32)  
        
    def extract_roi(self, frame, buffer = 10):
        mask = np.zeros(frame.shape[:2], dtype=np.uint8)

        x, y, w, h = cv2.boundingRect(self.roi)

        x1 = max(x - buffer, 0)
        y1 = max(y - buffer, 0)
        x2 = min(x + w + buffer, frame.shape[1])
        y2 = min(y + h + buffer, frame.shape[0])

        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, thickness=-1)

        roi = cv2.bitwise_and(frame, frame, mask=mask)

        overlay = frame.copy()
        color = (255, 255, 150)
        alpha = 0.1

        cv2.fillPoly(overlay, [self.roi], color)
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
        cv2.polylines(frame, [self.roi], isClosed=True, color=(255, 0, 0), thickness=1)

        # cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)

        return roi

    def process(self, frame):
        roi = self.extract_roi(frame)

        result = self.detector.detect(roi, frame)

        return result

