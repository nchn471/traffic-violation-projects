# core/tracker.py
from deep_sort_realtime.deepsort_tracker import DeepSort

class Tracker:
    def __init__(self, max_age=30):
        self.tracker = DeepSort(max_age=max_age)

    def update(self, detections, frame=None):
        tracks = self.tracker.update_tracks(detections, frame=frame)
        return tracks
