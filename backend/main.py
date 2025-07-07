from fastapi import FastAPI
from api.routers.ws_router import ws_router 
from api.routers.auth import auth_router
from api.routers.base import base_router
from api.routers.violation import violation_router
from api.routers.stats import stats_router
from api.routers.ticket import ticket_router
from api.routers.camera import camera_router
from api.routers.officer import officer_router
from api.routers.media import media_router

from dotenv import load_dotenv

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RESTful API
app.include_router(base_router)
app.include_router(auth_router)
app.include_router(camera_router)
app.include_router(violation_router)
app.include_router(stats_router)
app.include_router(ticket_router)
app.include_router(officer_router)
app.include_router(media_router)

# # Websocket
app.include_router(ws_router)
