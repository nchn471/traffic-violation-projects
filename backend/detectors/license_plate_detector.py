from core.base_detector import BaseDetector
import math
import numpy as np
import cv2

def linear_equation(x1, y1, x2, y2):
    b = y1 - (y2 - y1) * x1 / (x2 - x1)
    a = (y1 - b) / x1
    return a, b

def check_point_linear(x, y, x1, y1, x2, y2):
    a, b = linear_equation(x1, y1, x2, y2)
    y_pred = a * x + b
    return math.isclose(y_pred, y, abs_tol=3)


class LicensePlateDetector(BaseDetector):
    def __init__(self, lp_model_path, ocr_model_path,minio_client):
        super().__init__(minio_client)
        self.lp_model = self.load_model(lp_model_path)
        self.ocr_model = self.load_model(ocr_model_path)

    def change_contrast(self, img):
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_channel, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l_channel)
        enhanced = cv2.merge((cl, a, b))
        return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    def rotate_image(self, img, angle):
        center = tuple(np.array(img.shape[1::-1]) / 2)
        rot_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(img, rot_matrix, img.shape[1::-1], flags=cv2.INTER_LINEAR)

    def compute_skew_angle(self, img, use_top_lines):
        if len(img.shape) not in [2, 3]:
            print("Unsupported image type")
            return 0.0

        gray = cv2.medianBlur(img, 3) if len(img.shape) == 2 else cv2.medianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), 3)
        edges = cv2.Canny(gray, 30, 100, apertureSize=3, L2gradient=True)
        h, w = gray.shape
        lines = cv2.HoughLinesP(edges, 1, math.pi / 180, 30, minLineLength=w / 1.5, maxLineGap=h / 3.0)
        if lines is None:
            return 0.0

        selected_index = 0
        min_y = float('inf')
        for i, line in enumerate(lines):
            x1, y1, x2, y2 = line[0]
            center_y = (y1 + y2) / 2
            if use_top_lines and center_y >= 7:
                continue
            if center_y < min_y:
                min_y = center_y
                selected_index = i

        angle_sum = 0.0
        count = 0
        x1, y1, x2, y2 = lines[selected_index][0]
        angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
        if abs(angle) <= 30:
            angle_sum += math.radians(angle)
            count += 1

        return math.degrees(angle_sum / count) if count > 0 else 0.0

    def deskew_image(self, img, enhance_contrast=False, use_top_lines=False):
        processed_img = self.change_contrast(img) if enhance_contrast else img
        angle = self.compute_skew_angle(processed_img, use_top_lines)
        return self.rotate_image(img, angle)

    def read_license_plate(self, im):
        LP_type = "1"
        results = self.ocr_model.predict(im, verbose=False)[0]
        if not results.boxes:
            return "unknown"

        boxes = results.boxes
        if len(boxes) < 7 or len(boxes) > 10:
            return "unknown"

        center_list = []
        y_sum = 0

        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            x_c = (x1 + x2) / 2
            y_c = (y1 + y2) / 2
            y_sum += y_c

            cls_id = int(box.cls[0].item())
            char = results.names[cls_id] 
            center_list.append([x_c, y_c, char])

        l_point = min(center_list, key=lambda x: x[0])
        r_point = max(center_list, key=lambda x: x[0])

        for ct in center_list:
            if l_point[0] != r_point[0]:
                if not check_point_linear(ct[0], ct[1], l_point[0], l_point[1], r_point[0], r_point[1]):
                    LP_type = "2"
                    break

        y_mean = int(y_sum / len(center_list))

        line_1, line_2 = [], []
        license_plate = ""

        if LP_type == "2":
            for c in center_list:
                (line_2 if c[1] > y_mean else line_1).append(c)
            for c in sorted(line_1, key=lambda x: x[0]):
                license_plate += str(c[2])
            license_plate += "-"
            for c in sorted(line_2, key=lambda x: x[0]):
                license_plate += str(c[2])
        else:
            for c in sorted(center_list, key=lambda x: x[0]):
                license_plate += str(c[2])

        return license_plate


    def detect(self, roi, frame):
        results = self.lp_model.predict(source=roi, imgsz=640, conf=0.2, iou=0.4)[0]
        plate_boxes = results.boxes.xyxy.cpu().numpy().tolist()
        detected_plates = set()

        if not plate_boxes:
            lp = self.read_license_plate(roi)
            if lp != "unknown":
                detected_plates.add(lp)
                cv2.putText(frame, lp, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)
        else:
            for i, box in enumerate(plate_boxes):
                x1, y1, x2, y2 = map(int, box[:4])
                crop = roi[y1:y2, x1:x2]
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)

                for contrast in [False, True]:
                    for threshold in [False, True]:
                        rotated = self.deskew_image(crop, enhance_contrast=contrast, use_top_lines=threshold)
                        lp = self.read_license_plate(rotated)
                        if lp != "unknown":
                            detected_plates.add(lp)
                            cv2.putText(frame, lp, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12), 2)
                            break
                    else:
                        continue
                    break

        return {
            "frame" : frame
        }
                
    def lp_recognition(self, vehicle_img):
        results = self.lp_model.predict(source=vehicle_img, imgsz=640, conf=0.1, iou=0.4, verbose=False)[0]
        boxes = results.boxes

        if boxes is None or len(boxes) == 0:
            lp = self.read_license_plate(vehicle_img)
            return None, lp

        best_idx = boxes.conf.argmax()
        best_box = boxes[best_idx]
        x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())
        crop = vehicle_img[y1:y2, x1:x2]

        for contrast in [False, True]:
            for threshold in [False, True]:
                rotated = self.deskew_image(crop, enhance_contrast=contrast, use_top_lines=threshold)
                lp = self.read_license_plate(rotated)
                if lp != "unknown":
                    return rotated, lp

        return crop, "unknown"

