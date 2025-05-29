# from .vehicle_detector import VehicleDetector
# from .light_detector import LightDetector
# from .helmet_detector import HelmetDetector
# from .lane_detector import LaneDetector
from .license_plate_detector import LicensePlateDetector

def get_detector_by_type(det_type, params):
    # if det_type == "vehicle":
    #     return VehicleDetector("models/vehicle.pt")
    # elif det_type == "light":
    #     return LightDetector('models/lp_yolo11_best.pt', 'models/lp_ocr_yolo11.pt', 'models/vehicle.pt', params)
    # elif det_type == "helmet":
    #     return HelmetDetector('models/lp_yolo11_best.pt', 'models/lp_ocr_yolo11.pt', 'models/vehicle.pt', 'models/best_helmet_end.pt', params)
    # elif det_type == "lane":
    #     return LaneDetector('models/lp_yolo11_best.pt', 'models/lp_ocr_yolo11.pt', 'models/vehicle.pt', params)
    if det_type == "lp":
        return LicensePlateDetector('models/lp_yolo11_best.pt', 'models/lp_ocr_yolo11.pt', params)
    else:
        raise ValueError(f"Unknown detection type: {det_type}")
