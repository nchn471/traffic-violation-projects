import cv2

# Đọc ảnh
image = cv2.imread("frame_10.jpg")
h, w = image.shape[:2]

# Cài đặt thông số lưới
step = 100  # khoảng cách giữa các đường lưới

# Vẽ đường lưới dọc và tọa độ x
for x in range(0, w, step):
    cv2.line(image, (x, 0), (x, h), color=(200, 200, 200), thickness=1)
    cv2.putText(image, f"{x}", (x + 2, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)

# Vẽ đường lưới ngang và tọa độ y
for y in range(0, h, step):
    cv2.line(image, (0, y), (w, y), color=(200, 200, 200), thickness=1)
    cv2.putText(image, f"{y}", (5, y - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)

# Xuất ảnh kết quả
cv2.imwrite("grid_output.png", image)
print("Đã lưu ảnh với lưới: grid_output.png")
