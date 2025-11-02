import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

    class Config:
        orm_mode = True
