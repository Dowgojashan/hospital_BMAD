import pytest
from unittest.mock import MagicMock
from datetime import date, timedelta
from uuid import uuid4

from app.services.infraction_service import InfractionService
from app.crud.infraction_crud import InfractionCRUD
from app.models.infraction import Infraction
from app.models.patient import Patient
from app.schemas.infraction import InfractionCreate

@pytest.fixture
def mock_db_session():
    return MagicMock()

@pytest.fixture
def mock_infraction_crud():
    crud = MagicMock(spec=InfractionCRUD)
    crud.create.return_value = MagicMock(spec=Infraction)
    crud.count_infractions_by_patient_and_type.return_value = 0
    crud.get_all_by_patient.return_value = []
    crud.update_penalty_status.return_value = MagicMock(spec=Infraction)
    return crud

@pytest.fixture
def mock_update_patient_suspended_until(mocker):
    return mocker.patch('app.services.infraction_service.update_patient_suspended_until')

@pytest.fixture
def infraction_service(mock_db_session, mock_infraction_crud, mock_update_patient_suspended_until):
    service = InfractionService(mock_db_session)
    service.infraction_crud = mock_infraction_crud
    return service

@pytest.mark.asyncio
async def test_create_infraction_no_penalty(infraction_service, mock_infraction_crud, mock_update_patient_suspended_until):
    patient_id = uuid4()
    appointment_id = uuid4()
    infraction_type = "no_show"

    mock_infraction_crud.count_infractions_by_patient_and_type.return_value = 1 # Below threshold

    await infraction_service.create_infraction(patient_id, appointment_id, infraction_type)

    mock_infraction_crud.create.assert_called_once()
    mock_infraction_crud.count_infractions_by_patient_and_type.assert_called_once_with(patient_id=patient_id, infraction_type="no_show")
    mock_update_patient_suspended_until.assert_not_called()
    mock_infraction_crud.update_penalty_status.assert_not_called()

@pytest.mark.asyncio
async def test_create_infraction_with_penalty(infraction_service, mock_infraction_crud, mock_update_patient_suspended_until):
    patient_id = uuid4()
    appointment_id = uuid4()
    infraction_type = "no_show"

    # Simulate reaching the threshold
    mock_infraction_crud.count_infractions_by_patient_and_type.return_value = InfractionService.NO_SHOW_PENALTY_THRESHOLD

    # Mock existing infractions that need penalty_applied to be set
    mock_existing_infraction_1 = MagicMock(spec=Infraction, infraction_id=uuid4(), infraction_type="no_show", penalty_applied=False)
    mock_existing_infraction_2 = MagicMock(spec=Infraction, infraction_id=uuid4(), infraction_type="no_show", penalty_applied=False)
    mock_infraction_crud.get_all_by_patient.return_value = [mock_existing_infraction_1, mock_existing_infraction_2]

    await infraction_service.create_infraction(patient_id, appointment_id, infraction_type)

    mock_infraction_crud.create.assert_called_once()
    mock_infraction_crud.count_infractions_by_patient_and_type.assert_called_once_with(patient_id=patient_id, infraction_type="no_show")
    mock_update_patient_suspended_until.assert_called_once()
    
    # Check that penalty_until is approximately correct
    called_suspended_until = mock_update_patient_suspended_until.call_args[1]['suspended_until']
    expected_penalty_until = date.today() + timedelta(days=InfractionService.PENALTY_DURATION_DAYS)
    assert called_suspended_until == expected_penalty_until

    # Check that update_penalty_status was called for existing infractions
    assert mock_infraction_crud.update_penalty_status.call_count == 2
    mock_infraction_crud.update_penalty_status.assert_any_call(
        infraction_id=mock_existing_infraction_1.infraction_id,
        penalty_applied=True,
        penalty_until=expected_penalty_until
    )
    mock_infraction_crud.update_penalty_status.assert_any_call(
        infraction_id=mock_existing_infraction_2.infraction_id,
        penalty_applied=True,
        penalty_until=expected_penalty_until
    )

@pytest.mark.asyncio
async def test_create_infraction_other_type_no_penalty(infraction_service, mock_infraction_crud, mock_update_patient_suspended_until):
    patient_id = uuid4()
    appointment_id = uuid4()
    infraction_type = "late_cancel" # Not a no_show

    await infraction_service.create_infraction(patient_id, appointment_id, infraction_type)

    mock_infraction_crud.create.assert_called_once()
    mock_infraction_crud.count_infractions_by_patient_and_type.assert_not_called() # Only for no_show
    mock_update_patient_suspended_until.assert_not_called()
    mock_infraction_crud.update_penalty_status.assert_not_called()