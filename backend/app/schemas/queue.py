from pydantic import BaseModel, Field

class CallNextRequest(BaseModel):
    called_ticket_sequence: int = Field(..., description="The ticket sequence number that has just been called.")
