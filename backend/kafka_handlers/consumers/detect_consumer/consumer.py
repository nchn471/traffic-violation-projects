import os
import cv2
import numpy as np
from dotenv import load_dotenv

from detectors import get_detector_by_type
from core.frame_processor import FrameProcessor
from ...kafka_consumer import KafkaAvroConsumer
from ...kafka_producer import KafkaAvroProducer
from ...utils import encode_frame, decode_frame

def convert_point(point_dict):
    if isinstance(point_dict, dict) and 'x' in point_dict and 'y' in point_dict:
        return (point_dict['x'], point_dict['y'])
    return point_dict

def convert_params(params):
    if not isinstance(params, dict):
        return params

    for key in ['roi', 'stop_line', 'light_roi']:
        if key in params and isinstance(params[key], list):
            params[key] = [convert_point(p) for p in params[key]]

    if 'lanes' in params and isinstance(params['lanes'], list):
        for lane in params['lanes']:
            if isinstance(lane, dict) and 'polygon' in lane and isinstance(lane['polygon'], list):
                lane['polygon'] = [convert_point(p) for p in lane['polygon']]

    return params

def from_dict(obj, ctx):
    if isinstance(obj, dict) and 'params' in obj:
        obj['params'] = convert_params(obj['params'])
    return obj

class DetectConsumer(KafkaAvroConsumer):
    def __init__(self, config, topics, schema_registry_url, subject):
        super().__init__(config, topics, schema_registry_url, subject, from_dict_func=from_dict)
        self.ws_producer = KafkaAvroProducer(
            config['bootstrap.servers'],
            schema_registry_url,
            "frames-out",
            "frames-out-value"  
        )
        self.record_producer = KafkaAvroProducer(
            config['bootstrap.servers'],
            schema_registry_url,
            "violations",
            "violations-value"  
        )
        self.cached = {}
        
    def process_message(self, data: dict):
        try:
            session_id = data.get("session_id")
            frame_bytes = data.get("frame")
            params = data.get("params")
            timestamp = data.get("timestamp")
            
            if not all([session_id, frame_bytes, params]):
                print("Warning: Missing required fields in message.")
                return

            frame = decode_frame(frame_bytes)
            if frame is None:
                print(f"Warning: Failed to decode frame for session {session_id}")
                return
            
            detection_type = params.get("detection_type")
            if session_id in self.cached:
                detector = self.cached[session_id]
            else:
                detector = get_detector_by_type(detection_type, params)
                self.cached[session_id] = detector
                
            processor = FrameProcessor(detector, params)
            output = processor.process(frame)
            processed_frame_bytes = output.get("frame")
            violations = output.get("violations", [])

            processed_frame = encode_frame(processed_frame_bytes)
            if not processed_frame:
                print(f"Warning: Failed to encode processed frame for session {session_id}")
                return

            result = {
                "session_id": session_id,
                "processed_frame": processed_frame
            }

            self.ws_producer.publish(result, key=session_id)
            self.ws_producer.producer.poll(0)

            # if violations:
            #     for violation in violations:
            #         violation_payload = {
            #             "violation_type": violation.get("violation_type"),
            #             "vehicle_type": violation.get("vehicle_type"),
            #             "confidence": violation.get("confidence"),
            #             "location": violation.get("location"),
            #             "timestamp": timestamp,  
            #         }

            #         violation_frame_bytes = encode_frame(violation.get("violation_frame"))
            #         if violation_frame_bytes:
            #             violation_payload["violation_frame"] = violation_frame_bytes

            #         vehicle_frame_bytes = encode_frame(violation.get("vehicle_frame"))
            #         if vehicle_frame_bytes:
            #             violation_payload["vehicle_frame"] = vehicle_frame_bytes

            #         self.record_producer.publish(violation_payload, key=session_id)
            #         self.record_producer.producer.poll(0)

        
        except Exception as e:
            print(f"Error processing message: {e}")


def main():
    print("Starting Detect Consumer")

    load_dotenv()

    config = {
        "bootstrap.servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS"),
        "group.id": "detect-consumers",
        "auto.offset.reset": "latest",
    }
    topics = ["frames-in"]
    schema_registry_url = os.getenv("SCHEMA_REGISTRY_URL")
    subject = "frames-in-value"

    consumer = DetectConsumer(config, topics, schema_registry_url, subject)
    consumer.run()


if __name__ == "__main__":
    main()
