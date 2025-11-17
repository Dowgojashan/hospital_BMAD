import logging
from pydantic import BaseModel, ConfigDict

logger = logging.getLogger(__name__)


class Token(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    token_type: str = "bearer"
