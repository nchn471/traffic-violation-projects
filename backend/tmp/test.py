import cv2
import numpy as np
polygon_points = []
drawing = False

def mouse_callback(event, x, y, flags, param):
    global polygon_points, drawing
    if event == cv2.EVENT_LBUTTONDOWN:
        polygon_points.append((x, y))

def draw_polygon(frame, points):
    for pt in points:
        cv2.circle(frame, pt, 5, (0, 255, 0), -1)
    if len(points) > 1:
        cv2.polylines(frame, [np.array(points)], isClosed=True, color=(0, 255, 0), thickness=2)

if __name__ == "__main__":
    cap = cv2.VideoCapture("backend/video/La-Khê-Hà_Đông.mp4")
    ret, frame = cap.read()
    cap.release()

    if not ret:
        print("Không đọc được frame.")
        exit()

    cv2.namedWindow("Select ROI Polygon")
    cv2.setMouseCallback("Select ROI Polygon", mouse_callback)

    while True:
        display_frame = frame.copy()
        draw_polygon(display_frame, polygon_points)
        cv2.imshow("Select ROI Polygon", display_frame)
        key = cv2.waitKey(1)

        if key == ord('r'):
            polygon_points.clear()  # reset
        elif key == 13:  # Enter
            break
        elif key == 27:  # ESC
            polygon_points.clear()
            break

    cv2.destroyAllWindows()
    print("Polygon coordinates:", polygon_points)

