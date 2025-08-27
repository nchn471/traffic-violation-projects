from typing import Annotated
from pydantic import BaseModel, StringConstraints

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_token_expires_in: int  
    refresh_token_expires_in: int 

class RefreshTokenRequest(BaseModel):
    refresh_token: str
    
class RegisterRequest(BaseModel):
    
    name: Annotated[
        str,
        StringConstraints(min_length=1, max_length=100)
    ] = "Officer"
    
    username: Annotated[
        str,
        StringConstraints(min_length=3, max_length=50)
    ]
    password: Annotated[
        str,
        StringConstraints(min_length=6, max_length=128)
    ]
    role: Annotated[
        str,
        StringConstraints(min_length=3, max_length=20)
    ]

class TokenPayload(BaseModel):
    id: str
    sub: str
    role: str
    
