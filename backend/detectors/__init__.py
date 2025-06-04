
from storage.minio_manager import MinIOManager

VEHICLE_MODEL_PATH = 'models/vehicle.pt'
LP_MODEL_PATH = 'models/lp_yolo11_best.pt'
OCR_MODEL_PATH = 'models/lp_ocr_yolo11.pt'
HELMET_MODEL_PATH = 'models/best_helmet_end.pt'

def get_detector_by_type(det_type, params=None):
    minio_client = MinIOManager()
    
    if det_type == "record":
        from detectors.violation_recorder import ViolationRecorder
        from storage.database import get_db
        db = next(get_db())
        return ViolationRecorder(
            lp_model_path=LP_MODEL_PATH,
            ocr_model_path=OCR_MODEL_PATH,
            params=params,
            minio_client=minio_client,
            db=db
        )
    elif det_type == "vehicle":
        from .vehicle_detector import VehicleDetector
        return VehicleDetector(
            model_path=VEHICLE_MODEL_PATH,
            minio_client=minio_client
        )
    
    elif det_type == "light":
        from .light_detector import LightDetector
        return LightDetector(
            vehicle_path=VEHICLE_MODEL_PATH,
            minio_client=minio_client,
            params=params
        )    
    elif det_type == "helmet":
        from .helmet_detector import HelmetDetector
        return HelmetDetector(
            vehicle_path=VEHICLE_MODEL_PATH,
            helmet_path=HELMET_MODEL_PATH,
            minio_client=minio_client,
            params=params
        )

    elif det_type == "lane":
        from .lane_detector import LaneDetector
        return LaneDetector(
            vehicle_path=VEHICLE_MODEL_PATH,
            minio_client=minio_client,
            params=params
        )
    
    elif det_type == "lp":
        from .license_plate_detector import LicensePlateDetector
        return LicensePlateDetector(
            lp_model_path=LP_MODEL_PATH,
            ocr_model_path=OCR_MODEL_PATH,
            params=params,
            minio_client=minio_client
        )
    else:
        raise ValueError(f"Unknown detection type: {det_type}")
