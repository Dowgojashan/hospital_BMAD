from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.admin import AdminCreate
from app.models.admin import Admin
from app.crud import crud_admin

def get_admin_token(client: TestClient, db: Session) -> str:
    admin = db.query(Admin).filter(Admin.account_username == settings.FIRST_SUPERUSER).first()
    if not admin:
        admin_in = AdminCreate(
            account_username=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            name="Test Admin",
            email="test@example.com",
        )
        crud_admin.create_admin(db, admin_in)
    
    login_data = {
        "username": settings.FIRST_SUPERUSER,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    r = client.post("/api/v1/auth/token", data=login_data)
    token = r.json()["access_token"]
    return token
