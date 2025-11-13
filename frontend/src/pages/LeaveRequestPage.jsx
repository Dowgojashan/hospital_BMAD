import React, { useState, useEffect } from 'react';
import './LeaveRequestPage.css';
import api from '../api/axios'; // Use existing axios instance
import Calendar from 'react-calendar'; // Import react-calendar
import 'react-calendar/dist/Calendar.css'; // Import react-calendar CSS

const TIME_PERIOD_OPTIONS = [
  { value: "morning", label: "上午診" },
  { value: "afternoon", label: "下午診" },
  { value: "night", label: "夜間診" },
];

// Generic Message Modal Component
const MessageModal = ({ show, onClose, message, type }) => {
  if (!show) return null;
  const modalTitle = type === 'success' ? '操作成功！' : '操作失敗！';
  const titleClass = type === 'success' ? 'modal-title-success' : 'modal-title-error';
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className={titleClass}>{modalTitle}</h2>
        <p>{message}</p>
        <button onClick={onClose} className={`btn ${type === 'success' ? 'btn-primary' : 'btn-danger'}`}>關閉</button>
      </div>
    </div>
  );
};

const LeaveRequestPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedScheduleSlot, setSelectedScheduleSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // New states for multi-day leave
  const [leaveType, setLeaveType] = useState('single'); // 'single' or 'range'
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // States for modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (leaveType === 'single') {
      loadSchedules();
    }
  }, [calendarDate, leaveType]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const params = { month: calendarDate.getMonth() + 1, year: calendarDate.getFullYear() };
      const response = await api.get('/api/v1/doctors/me/schedules', { params });
      setSchedules(response.data);
    } catch (error) {
      console.error('載入班表失敗:', error);
      setModalMessage(error.response?.data?.detail || '載入班表失敗，請稍後再試。');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowSuccessModal(false);
    setShowErrorModal(false);

    if (!reason.trim()) {
      setModalMessage('請填寫停診原因。');
      setShowErrorModal(true);
      setLoading(false);
      return;
    }

    try {
      if (leaveType === 'single') {
        if (!selectedScheduleSlot) {
          setModalMessage('請從日曆中選擇一個班表時段進行停診申請。');
          setShowErrorModal(true);
          setLoading(false);
          return;
        }
        const payload = {
          date: selectedScheduleSlot.date,
          time_period: selectedScheduleSlot.time_period,
          reason: reason,
        };
        await api.post('/api/v1/doctors/me/leave-requests', payload);
        setModalMessage('停診申請已送出，該時段已標記為不可預約。');
      } else { // Range leave
        if (endDate < startDate) {
          setModalMessage('結束日期不能早於開始日期。');
          setShowErrorModal(true);
          setLoading(false);
          return;
        }
        const payload = {
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
          time_periods: ['morning', 'afternoon', 'night'], // Always request for the whole day
          reason: reason,
        };
        await api.post('/api/v1/doctors/me/leave-requests/range', payload);
        setModalMessage('連續停診申請已送出，相關時段已標記為不可預約。');
      }
      
      setShowSuccessModal(true);
      resetForm();
      if (leaveType === 'single') loadSchedules();
    } catch (error) {
      console.error('停診申請失敗:', error);
      setModalMessage(error.response?.data?.detail || '停診申請失敗，請稍後再試。');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedScheduleSlot(null);
    setReason('');
    setStartDate(new Date());
    setEndDate(new Date());
  };

  const getTimePeriodLabel = (value) => {
    const option = TIME_PERIOD_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">停診申請</h1>
        <p className="page-subtitle">選擇單日或連續停診，並說明原因</p>
      </div>

      <div className="card">
        <div className="leave-type-toggle">
          <button className={`btn ${leaveType === 'single' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLeaveType('single')}>單日停診</button>
          <button className={`btn ${leaveType === 'range' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setLeaveType('range')}>連續停診</button>
        </div>
      </div>

      {leaveType === 'single' ? (
        // Single Day Leave UI
        <div id="single-day-leave">
          <div className="card">
            <h3>選擇停診時段</h3>
            {loading && schedules.length === 0 ? <div className="loading">載入中...</div> : (
              <Calendar
                onChange={setCalendarDate}
                value={calendarDate}
                onActiveStartDateChange={({ activeStartDate }) => setCalendarDate(activeStartDate)}
                minDate={new Date()}
                locale="zh-TW"
                className="react-calendar-custom"
                tileContent={({ date, view }) => {
                  if (view === 'month') {
                    const daySchedules = schedules.filter(s => new Date(s.date).toDateString() === date.toDateString());
                    if (daySchedules.length === 0) return null;
                    return (
                      <div className="schedule-tile-content">
                        {daySchedules.map(schedule => (
                          <div
                            key={schedule.schedule_id}
                            className={`schedule-entry ${selectedScheduleSlot?.schedule_id === schedule.schedule_id ? 'selected' : ''} ${schedule.max_patients === 0 ? 'unavailable' : ''}`}
                            onClick={() => setSelectedScheduleSlot(schedule)}
                          >
                            <span className="time-period-label">{getTimePeriodLabel(schedule.time_period)}</span>
                            <span className="status-label">{schedule.max_patients === 0 ? '(已停診)' : `(${schedule.booked_patients}/${schedule.max_patients})`}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            )}
          </div>
          <div className="card">
            <h3>停診申請詳情</h3>
            <form onSubmit={handleSubmit}>
              {selectedScheduleSlot ? (
                <div className="form-group selected-slot-display">
                  <label className="form-label">已選擇停診時段</label>
                  <p><strong>{new Date(selectedScheduleSlot.date).toLocaleDateString('zh-TW')} - {getTimePeriodLabel(selectedScheduleSlot.time_period)}</strong></p>
                  <p>目前預約: <strong>{selectedScheduleSlot.booked_patients} / {selectedScheduleSlot.max_patients}</strong></p>
                  {selectedScheduleSlot.booked_patients > 0 && <p className="text-danger">注意：此時段已有病患預約，停診將會影響這些病患。</p>}
                </div>
              ) : (
                <div className="form-group"><p>請從上方日曆中選擇一個班表時段。</p></div>
              )}
              <div className="form-group">
                <label className="form-label">停診原因 *</label>
                <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} rows={5} required placeholder="請說明停診原因" disabled={!selectedScheduleSlot} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading || !selectedScheduleSlot || !reason.trim()}>
                {loading ? '送出中...' : '送出單日停診申請'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        // Multi-Day Leave UI
        <div id="multi-day-leave">
          <div className="card">
            <h3>連續停診申請</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">選擇日期範圍</label>
                <div className="date-range-picker">
                  <input type="date" className="form-control" value={formatDate(startDate)} onChange={(e) => setStartDate(new Date(e.target.value))} min={formatDate(new Date())} />
                  <span>至</span>
                  <input type="date" className="form-control" value={formatDate(endDate)} onChange={(e) => setEndDate(new Date(e.target.value))} min={formatDate(startDate)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">停診原因 *</label>
                <textarea className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} rows={5} required placeholder="請說明停診原因" />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading || !reason.trim()}>
                {loading ? '送出中...' : '送出連續停診申請'}
              </button>
            </form>
          </div>
        </div>
      )}

      <MessageModal show={showSuccessModal} onClose={() => setShowSuccessModal(false)} message={modalMessage} type="success" />
      <MessageModal show={showErrorModal} onClose={() => setShowErrorModal(false)} message={modalMessage} type="error" />
    </div>
  );
};

export default LeaveRequestPage;
