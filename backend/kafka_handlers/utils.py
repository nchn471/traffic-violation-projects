import cv2
import numpy as np

def encode_frame(frame: np.ndarray) -> bytes | None:
    
    if frame is not None:
        success, buffer = cv2.imencode(".jpg", frame)
        if success:
            return buffer.tobytes()
        else:
            print("[encode_frame] Failed to encode frame.")
    return None


def decode_frame(frame_bytes: bytes) -> np.ndarray | None:
    
    if not frame_bytes:
        print("[decode_frame] Empty frame bytes.")
        return None

    try:
        np_arr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if frame is None:
            print("[decode_frame] Decoded frame is None.")
        return frame
    except Exception as e:
        print(f"[decode_frame] Exception during decoding: {e}")
        return None
