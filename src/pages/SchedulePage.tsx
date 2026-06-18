import { useState, useEffect } from 'react';
import { Schedule, Coach, Member, WaitlistItem } from '../types';

function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [formData, setFormData] = useState({
    coach_id: '',
    course_date: selectedDate,
    start_time: '09:00',
    end_time: '10:00',
    capacity: 1,
    course_name: '私教课',
  });
  const [editFormData, setEditFormData] = useState({
    id: 0,
    coach_id: '',
    course_date: '',
    start_time: '',
    end_time: '',
    capacity: 1,
    course_name: '',
  });
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    const [schedulesData, coachesData, membersData] = await Promise.all([
      window.electronAPI.getSchedules(selectedDate),
      window.electronAPI.getCoaches(),
      window.electronAPI.getMembers(),
    ]);
    setSchedules(schedulesData);
    setCoaches(coachesData);
    setMembers(membersData);
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAddSchedule = async () => {
    if (!formData.coach_id) {
      showMessage('error', '请选择教练');
      return;
    }
    await window.electronAPI.addSchedule({
      ...formData,
      coach_id: parseInt(formData.coach_id),
      capacity: parseInt(formData.capacity as any),
    });
    setShowAddModal(false);
    loadData();
    showMessage('success', '课程添加成功');
  };

  const handleBookClass = async () => {
    if (!selectedSchedule || !selectedMemberId) {
      showMessage('error', '请选择会员');
      return;
    }
    const result = await window.electronAPI.bookClass({
      schedule_id: selectedSchedule.id,
      member_id: parseInt(selectedMemberId),
    });
    if (result.error) {
      showMessage('error', result.error);
    } else {
      setShowBookingModal(false);
      setSelectedMemberId('');
      loadData();
      showMessage('success', '预约成功');
    }
  };

  const handleJoinWaitlist = async () => {
    if (!selectedSchedule || !selectedMemberId) {
      showMessage('error', '请选择会员');
      return;
    }
    const result = await window.electronAPI.joinWaitlist({
      schedule_id: selectedSchedule.id,
      member_id: parseInt(selectedMemberId),
    });
    if (result.error) {
      showMessage('error', result.error);
    } else {
      setShowBookingModal(false);
      setSelectedMemberId('');
      loadData();
      showMessage('success', `已加入候补，当前第${result.position}位`);
    }
  };

  const openBookingModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowBookingModal(true);
  };

  const openWaitlistModal = async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    const data = await window.electronAPI.getWaitlist(schedule.id);
    setWaitlist(data);
    setShowWaitlistModal(true);
  };

  const openEditModal = (schedule: Schedule) => {
    setEditFormData({
      id: schedule.id,
      coach_id: String(schedule.coach_id),
      course_date: schedule.course_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      capacity: schedule.capacity,
      course_name: schedule.course_name || '私教课',
    });
    setShowEditModal(true);
  };

  const handleUpdateSchedule = async () => {
    if (!editFormData.coach_id) {
      showMessage('error', '请选择教练');
      return;
    }
    const result = await window.electronAPI.updateSchedule({
      ...editFormData,
      id: editFormData.id,
      coach_id: parseInt(editFormData.coach_id),
      capacity: parseInt(editFormData.capacity as any),
    });
    if (result.error) {
      showMessage('error', result.error);
      return;
    }
    setShowEditModal(false);
    loadData();
    if (result.waitlistProcessed && result.waitlistProcessed.success) {
      showMessage('success', '课程修改成功，候补已自动补位');
    } else {
      showMessage('success', '课程修改成功');
    }
  };

  const groupedByCoach = schedules.reduce((acc: any, schedule) => {
    const coachId = schedule.coach_id;
    if (!acc[coachId]) {
      acc[coachId] = {
        coachName: schedule.coach_name,
        coachSpecialty: schedule.coach_specialty,
        schedules: [],
      };
    }
    acc[coachId].schedules.push(schedule);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">课程排期</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="date"
            className="form-input"
            style={{ width: 160 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData({ ...formData, course_date: selectedDate });
              setShowAddModal(true);
            }}
          >
            + 添加课程
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`card`}
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            backgroundColor:
              message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#059669' : '#dc2626',
            borderRadius: 8,
          }}
        >
          {message.text}
        </div>
      )}

      {Object.keys(groupedByCoach).length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
          暂无课程安排，请添加课程
        </div>
      ) : (
        Object.entries(groupedByCoach).map(([coachId, data]: any) => (
          <div key={coachId} className="card" style={{ marginBottom: 20 }}>
            <div
              style={{
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                {data.coachName}
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                {data.coachSpecialty}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {data.schedules.map((schedule: Schedule) => (
                <div
                  key={schedule.id}
                  style={{
                    width: 220,
                    padding: 16,
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    backgroundColor:
                      schedule.status === 'available' ? '#fff' : '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    {schedule.start_time} - {schedule.end_time}
                  </div>
                  <div style={{ color: '#6b7280', marginBottom: 8 }}>
                    {schedule.course_name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <span
                      className={`badge ${
                        schedule.status === 'available'
                          ? 'badge-success'
                          : 'badge-warning'
                      }`}
                    >
                      {schedule.status === 'available' ? '可预约' : '已满员'}
                    </span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                      {schedule.booked_count}/{schedule.capacity}人
                      {schedule.bookings && schedule.bookings.filter(b => b.booking_status === 'checked_in').length > 0 && (
                        <span style={{ marginLeft: 8, color: '#059669' }}>
                          (已签到: {schedule.bookings.filter(b => b.booking_status === 'checked_in').length})
                        </span>
                      )}
                    </span>
                  </div>

                  {schedule.bookings && schedule.bookings.length > 0 && (
                    <div style={{
                      marginBottom: 12,
                      padding: 8,
                      backgroundColor: '#f9fafb',
                      borderRadius: 6,
                    }}>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                        预约名单:
                      </div>
                      {schedule.bookings.map((b) => (
                        <div key={b.booking_id} style={{
                          fontSize: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '2px 0',
                        }}>
                          <span>{b.member_name}</span>
                          {b.booking_status === 'checked_in' ? (
                            <span style={{ color: '#059669', fontWeight: 600 }}>✓ 已签到</span>
                          ) : (
                            <span style={{ color: '#6b7280' }}>待签到</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => openBookingModal(schedule)}
                    >
                      预约
                    </button>
                    {schedule.booked_count >= schedule.capacity && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openWaitlistModal(schedule)}
                      >
                        候补
                      </button>
                    )}
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                      onClick={() => openEditModal(schedule)}
                    >
                      编辑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">添加课程</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">教练</label>
                <select
                  className="form-select"
                  value={formData.coach_id}
                  onChange={(e) =>
                    setFormData({ ...formData, coach_id: e.target.value })
                  }
                >
                  <option value="">请选择教练</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name} - {coach.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.course_date}
                    onChange={(e) =>
                      setFormData({ ...formData, course_date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">容量</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">开始时间</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">结束时间</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">课程名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.course_name}
                  onChange={(e) =>
                    setFormData({ ...formData, course_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleAddSchedule}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">编辑课程</h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  padding: 10,
                  backgroundColor: '#f9fafb',
                  borderRadius: 6,
                  marginBottom: 12,
                  fontSize: 13,
                  color: '#374151',
                }}
              >
                当前已预约 <strong>{schedules.find(s => s.id === editFormData.id)?.booked_count || 0}</strong> 人，
                新容量不能小于已预约人数
              </div>
              <div className="form-group">
                <label className="form-label">教练</label>
                <select
                  className="form-select"
                  value={editFormData.coach_id}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, coach_id: e.target.value })
                  }
                >
                  <option value="">请选择教练</option>
                  {coaches.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name} - {coach.specialty}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editFormData.course_date}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, course_date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">容量</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    value={editFormData.capacity}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        capacity: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">开始时间</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editFormData.start_time}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">结束时间</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editFormData.end_time}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, end_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">课程名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.course_name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, course_name: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleUpdateSchedule}>
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showBookingModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">预约课程</h3>
              <button
                className="modal-close"
                onClick={() => setShowBookingModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  padding: 12,
                  backgroundColor: '#f9fafb',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {selectedSchedule.course_name}
                </div>
                <div style={{ color: '#6b7280', fontSize: 13 }}>
                  教练：{selectedSchedule.coach_name} | 时间：
                  {selectedSchedule.start_time} - {selectedSchedule.end_time} |
                  剩余：{selectedSchedule.capacity - selectedSchedule.booked_count}个名额
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">选择会员</label>
                <select
                  className="form-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  <option value="">请选择会员</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                      {member.family_name
                        ? ` (${member.family_name} - 余额${member.family_balance}课时)`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowBookingModal(false)}
              >
                取消
              </button>
              {selectedSchedule.booked_count < selectedSchedule.capacity ? (
                <button className="btn btn-primary" onClick={handleBookClass}>
                  立即预约
                </button>
              ) : (
                <button className="btn btn-warning" onClick={handleJoinWaitlist}>
                  加入候补
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showWaitlistModal && selectedSchedule && (
        <div className="modal-overlay" onClick={() => setShowWaitlistModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">候补队列</h3>
              <button
                className="modal-close"
                onClick={() => setShowWaitlistModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {waitlist.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 24,
                    color: '#9ca3af',
                  }}
                >
                  暂无候补人员
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>排位</th>
                      <th>会员姓名</th>
                      <th>电话</th>
                      <th>加入时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="badge badge-info">
                            第{item.position}位
                          </span>
                        </td>
                        <td>{item.member_name}</td>
                        <td>{item.member_phone || '-'}</td>
                        <td>{item.joined_at?.slice(0, 16).replace('T', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowWaitlistModal(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchedulePage;
