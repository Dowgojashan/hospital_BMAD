# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
from app.api.routers import auth, admin_management, schedules, patient_appointments, queue, doctor_clinic_management, user_profile, medical_records, patient_lookup
import os
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",  # 您的前端地址
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(admin_management.router, prefix="/api/v1", tags=["Admin Management"])
app.include_router(schedules.router, prefix="/api/v1/schedules", tags=["Schedules"])
app.include_router(patient_appointments.router, prefix="/api/v1/patient", tags=["Patient"])
app.include_router(queue.router, prefix="/api/v1", tags=["Queue"])
app.include_router(doctor_clinic_management.router, prefix="/api/v1", tags=["Doctor Clinic Management"])
app.include_router(user_profile.router, prefix="/api/v1/profile", tags=["User Profile"])
app.include_router(medical_records.router, prefix="/api/v1/medical-records", tags=["Medical Records"])
app.include_router(patient_lookup.router, prefix="/api/v1/patients", tags=["Patient Lookup"])

# 僅在開發環境中包含開發工具路由
if os.getenv("ENV") == "development":
    from app.api.routers import dev_tools
    app.include_router(dev_tools.router, prefix="/api/v1/dev", tags=["Development Tools"])

# ... 其他應用程式邏輯