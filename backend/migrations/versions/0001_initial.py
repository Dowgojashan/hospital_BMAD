"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2025-11-02 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # PATIENT
    op.create_table(
        'PATIENT',
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('card_number', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('dob', sa.Date(), nullable=False),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('suspended_until', sa.Date(), nullable=True),
        sa.UniqueConstraint('card_number', name='uq_patient_card_number')
    )

    # DOCTOR
    op.create_table(
        'DOCTOR',
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('doctor_login_id', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('specialty', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('doctor_login_id', name='uq_doctor_login_id')
    )

    # ADMIN
    op.create_table(
        'ADMIN',
        sa.Column('admin_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('account_username', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('is_system_account', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('account_username', name='uq_admin_account_username')
    )

    # APPOINTMENT
    appointment_status = sa.Enum(
        'scheduled', 'confirmed', 'waitlist', 'cancelled', 'checked_in', 'waiting', 'called', 'in_consult', 'completed', 'no_show',
        name='appointment_status'
    )

    op.create_table(
        'APPOINTMENT',
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('PATIENT.patient_id'), nullable=False),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('DOCTOR.doctor_id'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('time_period', sa.String(), nullable=False),
        sa.Column('status', appointment_status, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # CHECKIN
    checkin_method = sa.Enum('onsite', 'online', name='checkin_method')

    op.create_table(
        'CHECKIN',
        sa.Column('checkin_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('APPOINTMENT.appointment_id'), nullable=True),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('PATIENT.patient_id'), nullable=False),
        sa.Column('checkin_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('checkin_method', checkin_method, nullable=True),
        sa.Column('ticket_sequence', sa.Integer(), nullable=True),
        sa.Column('ticket_number', sa.String(), nullable=True),
        sa.Column('cancelled_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('ADMIN.admin_id'), nullable=True),
        sa.Column('cancel_reason', sa.Text(), nullable=True),
    )

    # SCHEDULE
    op.create_table(
        'SCHEDULE',
        sa.Column('schedule_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('DOCTOR.doctor_id'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('start', sa.Time(), nullable=False),
        sa.Column('end', sa.Time(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # MEDICAL_RECORD
    op.create_table(
        'MEDICAL_RECORD',
        sa.Column('record_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('PATIENT.patient_id'), nullable=False),
        sa.Column('doctor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('DOCTOR.doctor_id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
    )

    # AUDIT_LOG
    op.create_table(
        'AUDIT_LOG',
        sa.Column('log_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('target_id', sa.String(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
    )

    # VISIT_CALL
    call_type = sa.Enum('call', 'recall', 'skip', name='call_type')
    call_status = sa.Enum('active', 'expired', 'attended', name='call_status')

    op.create_table(
        'VISIT_CALL',
        sa.Column('call_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('APPOINTMENT.appointment_id'), nullable=True),
        sa.Column('ticket_sequence', sa.Integer(), nullable=False),
        sa.Column('ticket_number', sa.String(), nullable=True),
        sa.Column('called_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('called_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('ADMIN.admin_id'), nullable=True),
        sa.Column('call_type', call_type, nullable=False),
        sa.Column('call_status', call_status, nullable=False),
    )

    # INFRACTION
    infraction_type = sa.Enum('no_show', 'late_cancel', 'other', name='infraction_type')

    op.create_table(
        'INFRACTION',
        sa.Column('infraction_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('patient_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('PATIENT.patient_id'), nullable=False),
        sa.Column('appointment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('APPOINTMENT.appointment_id'), nullable=True),
        sa.Column('infraction_type', infraction_type, nullable=False),
        sa.Column('occurred_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('penalty_applied', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('penalty_until', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
    )

    # ROOM_DAY
    op.create_table(
        'ROOM_DAY',
        sa.Column('room_day_id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('room_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('next_sequence', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('current_called_sequence', sa.Integer(), nullable=True),
    )


def downgrade():
    op.drop_table('ROOM_DAY')
    op.drop_table('INFRACTION')
    op.drop_table('VISIT_CALL')
    op.drop_table('AUDIT_LOG')
    op.drop_table('MEDICAL_RECORD')
    op.drop_table('SCHEDULE')
    op.drop_table('CHECKIN')
    op.drop_table('APPOINTMENT')
    # drop enums explicitly
    op.drop_table('ADMIN')
    op.drop_table('DOCTOR')
    op.drop_table('PATIENT')
    # drop enums
    sa.Enum(name='appointment_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='checkin_method').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='call_type').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='call_status').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='infraction_type').drop(op.get_bind(), checkfirst=True)
