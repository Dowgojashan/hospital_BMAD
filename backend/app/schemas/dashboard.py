from typing import List, Optional
from pydantic import BaseModel

class ClinicLoad(BaseModel):
    clinic_id: str
    clinic_name: str
    specialty: str # Added specialty
    time_period: str # Added time_period
    current_patients: int
    waiting_count: int

class DashboardStats(BaseModel):
    total_appointments_today: int
    checked_in_count: int
    waiting_count: int
    completed_count: int
    clinic_load: List[ClinicLoad]