from fastapi import FastAPI
from api.routers.ws_router import ws_router 
from api.routers.auth import auth_router
from api.routers.base import base_router
from api.routers.violation import violation_router
from api.routers.stats import stats_router
from api.routers.ticket import ticket_router

from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# RESTful API
app.include_router(auth_router)
app.include_router(violation_router)
app.include_router(base_router)
app.include_router(stats_router)
app.include_router(ticket_router)

# Websocket
app.include_router(ws_router)
