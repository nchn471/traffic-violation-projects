# from .vehicle_detector import VehicleDetector
# from .light_detector import LightDetector
# from .helmet_detector import HelmetDetector
# from .lane_detector import LaneDetector
from .license_plate_detector import LicensePlateDetector
from detectors.violation_recorder import ViolationRecorder

from storage.minio_manager import MinIOManager
from storage.database import get_db

VEHICLE_MODEL_PATH = 'models/vehicle.pt'
LP_MODEL_PATH = 'models/lp_yolo11_best.pt'
OCR_MODEL_PATH = 'models/lp_ocr_yolo11.pt'
HELMET_MODEL_PATH = 'models/best_helmet_end.pt'

def get_detector_by_type(det_type, params=None):
    minio_client = MinIOManager()
    
    # if det_type == "vehicle":
    #     return VehicleDetector("models/vehicle.pt")
    # elif det_type == "light":
    #     return LightDetector('models/lp_yolo11_best.pt', 'models/lp_ocr_yolo11.pt', 'models/vehicle.pt', params)
    # elif det_type == "helmet":
    #     return HelmetDetector('models/lp_yolo11_best.pt', 'models/lp_ocr_yolo11.pt', 'models/vehicle.pt', 'models/best_helmet_end.pt', params)
    # elif det_type == "lane":
    #     return LaneDetector('models/lp_yolo11_best.pt', 'models/lp_ocr_yolo11.pt', 'models/vehicle.pt', params)
    if det_type == "record":
        db = next(get_db())
        return ViolationRecorder(
            lp_model_path=LP_MODEL_PATH,
            ocr_model_path=OCR_MODEL_PATH,
            params=params,
            minio_client=minio_client,
            db=db
        )
    elif det_type == "lp":
        return LicensePlateDetector(
            lp_model_path=LP_MODEL_PATH,
            ocr_model_path=OCR_MODEL_PATH,
            params=params,
            minio_client=minio_client
        )
    else:
        raise ValueError(f"Unknown detection type: {det_type}")
