from fastapi import FastAPI
from api.router.ws_router import ws_router 
from api.router.auth import auth_router

from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.include_router(ws_router)
app.include_router(auth_router,prefix="api/v1")

