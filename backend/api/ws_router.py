from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import cv2
import numpy as np

app = FastAPI()

@app.websocket("/ws/video_binary")
async def video_ws(websocket: WebSocket):
    cap = cv2.VideoCapture(video_path)
