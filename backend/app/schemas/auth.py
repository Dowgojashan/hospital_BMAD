from pydantic import BaseModel, EmailStr

class EmailRequest(BaseModel):
    email: EmailStr

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    token: str
    password: str
