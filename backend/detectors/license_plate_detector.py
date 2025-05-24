# core/vehicle_detector.py
from core.base_detector import BaseDetector
from ultralytics import YOLO
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

def read_plate(yolo_license_plate, im):
    LP_type = "1"
    results = yolo_license_plate.predict(im, verbose=False)[0]
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

def changeContrast(img):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l_channel)
    limg = cv2.merge((cl, a, b))
    enhanced_img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    return enhanced_img

def rotate_image(image, angle):
    image_center = tuple(np.array(image.shape[1::-1]) / 2)
    rot_mat = cv2.getRotationMatrix2D(image_center, angle, 1.0)
    result = cv2.warpAffine(image, rot_mat, image.shape[1::-1], flags=cv2.INTER_LINEAR)
    return result

def compute_skew(src_img, center_thres):
    if len(src_img.shape) == 3:
        h, w, _ = src_img.shape
    elif len(src_img.shape) == 2:
        h, w = src_img.shape
    else:
        print('unsupported image type')
        return 0.0
    img = cv2.medianBlur(src_img, 3)
    edges = cv2.Canny(img, threshold1=30, threshold2=100, apertureSize=3, L2gradient=True)
    lines = cv2.HoughLinesP(edges, 1, math.pi/180, 30, minLineLength=w / 1.5, maxLineGap=h/3.0)
    if lines is None:
        return 0.0

    min_line = 100
    min_line_pos = 0
    for i in range(len(lines)):
        for x1, y1, x2, y2 in lines[i]:
            center_point = [((x1 + x2) / 2), ((y1 + y2) / 2)]
            if center_thres == 1:
                if center_point[1] < 7:
                    continue
            if center_point[1] < min_line:
                min_line = center_point[1]
                min_line_pos = i

    angle = 0.0
    cnt = 0
    for x1, y1, x2, y2 in lines[min_line_pos]:
        ang = np.arctan2(y2 - y1, x2 - x1)
        if math.fabs(ang) <= 30:
            angle += ang
            cnt += 1
    if cnt == 0:
        return 0.0
    return (angle / cnt) * 180 / math.pi

def deskew(src_img, change_cons, center_thres):
    if change_cons == 1:
        return rotate_image(src_img, compute_skew(changeContrast(src_img), center_thres))
    else:
        return rotate_image(src_img, compute_skew(src_img, center_thres))

class LicensePlateDetector(BaseDetector):
    def __init__(self, lp_path, ocr_path):
        super().__init__()
        self.lp_model = self.load_model(lp_path)
        self.ocr_model = self.load_model(ocr_path)
        
    def detect(self, roi, frame):
        
        results = self.lp_model.predict(source=frame, imgsz=640, conf=0.2, iou=0.4)[0]
        list_plates = results.boxes.xyxy.cpu().numpy().tolist()
        list_read_plates = set()

        if not list_plates:
            lp = read_plate(self.ocr_model, roi)
            if lp != "unknown":
                list_read_plates.add(lp)
                cv2.putText(frame,lp, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36, 255, 12),2)
        else:
            for i, plate in enumerate(list_plates):
                flag = 0
                x, y, xmax, ymax = map(int, plate[:4])
                w = xmax - x
                h = ymax - y

                crop_img = roi[y:y+h, x:x+w]

                cv2.rectangle(
                    frame,
                    (x, y),
                    (xmax, ymax),
                    color=(0, 0, 255),  
                    thickness=2,
                )

                for cc in range(2):  # Contrast: 0 (no contrast), 1 (with contrast)
                    for ct in range(2):  # Center threshold: 0 (no threshold), 1 (with threshold)
                        rotated_img = deskew(crop_img, cc, ct)
                        lp = read_plate(self.ocr_model, rotated_img)
                        if lp != "unknown":
                            # Save the cropped image for debugging
                            crop_filename = f'output/crops/plate_{i}_deskew.jpg'
                            cv2.imwrite(crop_filename, rotated_img)
                            list_read_plates.add(lp)
                            # Draw text above the bounding box
                            cv2.putText(
                                frame,
                                lp,
                                (x, y - 10),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.9,
                                (36, 255, 12),  # Green color
                                2,
                            )
                            flag = 1
                            break
                    if flag == 1:
                        break

        return list_read_plates