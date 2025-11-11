from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Hospital BMAD API",
    description="API for the Hospital BMAD project",
    version="0.1.0",
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.routers import auth, admin_management, schedules, profile

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(admin_management.router, prefix="/api/v1", tags=["admin-management"])
app.include_router(schedules.router, prefix="/api/v1/schedules", tags=["schedules"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["profile-management"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Hospital BMAD API"}
