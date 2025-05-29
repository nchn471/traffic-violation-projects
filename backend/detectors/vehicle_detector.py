from core.base_detector import BaseDetector

class VehicleDetector(BaseDetector):
    
    def __init__(self, model_path):
        super().__init__()
        self.model = self.load_model(model_path)

    def detect(self, roi, frame):

        results = self.model.track(
            source=roi,
            conf=0.2,
            iou=0.4,
            imgsz=640,
            persist=True,
            stream=False
        )[0]

        if not results or not results.boxes:
            return

        for box in results.boxes:
            if box.id is None:
                continue 

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            track_id = int(box.id[0])
            label = self.model.names[cls_id]
            text = f"#{track_id} {label[:5]} {int(conf*100)}%"

            self.draw_bounding_box(frame, x1, y1, x2, y2, self.BLUE_BGR, text)
