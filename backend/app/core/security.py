import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from passlib.context import CryptContext
from jose import jwt, JWTError

logger = logging.getLogger(__name__)

# Config
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    logger.info("get_password_hash: start")
    hashed = pwd_context.hash(password[:72])
    logger.info("get_password_hash: end")
    return hashed


def verify_password(plain_password: str, hashed_password: str) -> bool:
    logger.info("verify_password: start")
    ok = pwd_context.verify(plain_password, hashed_password)
    logger.info("verify_password: end")
    return ok


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    logger.info("create_access_token: start")
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    logger.info("create_access_token: end")
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    logger.info("verify_token: start")
    logger.info(f"verify_token: Using SECRET_KEY: {SECRET_KEY}")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.info("verify_token: end - Token successfully decoded.")
        return payload
    except JWTError as e:
        logger.error(f"verify_token: failed - JWTError: {e}")
        raise
