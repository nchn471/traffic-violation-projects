from fastapi import FastAPI
from api.ws_router import ws_router 

from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.include_router(ws_router)

