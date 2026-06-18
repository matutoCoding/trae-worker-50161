import { useState, useEffect } from 'react';
import { Booking, Family, Member } from '../types';

function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMemberId, setFilterMemberId] = useState<string>('');
  const [filterFamilyId, setFilterFamilyId] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [mbs, fams] = await Promise.all([
      window.electronAPI.getMembers(),
      window.electronAPI.getFamilies(),
    ]);
    setMembers(mbs);
    setFamilies(fams);
    loadBookings();
  };

  const loadBookings = async () => {
    const filters: any = {};
    if (filterMemberId) filters.memberId = parseInt(filterMemberId);
    if (filterFamilyId) filters.familyId = parseInt(filterFamilyId);
    if (filterDate) filters.courseDate = filterDate;
    const data = await window.electronAPI.getBookings(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    setBookings(data);
  };

  useEffect(() => {
    if (members.length > 0) {
      loadBookings();
    }
  }, [filterMemberId, filterFamilyId, filterDate, filterStatus]);

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    const result = await window.electronAPI.cancelBooking(bookingId);
    if (result.error) {
      showMessage('error', result.error);
    } else {
      loadBookings();
      showMessage('success', '取消成功，课时已退回');
    }
  };

  const handleCheckIn = async (bookingId: number) => {
    if (!confirm('确定要为该会员签到吗？')) return;
    const result = await window.electronAPI.checkInBooking(bookingId);
    if (result.error) {
      showMessage('error', result.error);
    } else {
      loadBookings();
      showMessage('success', '签到成功');
    }
  };

  const handleCheckTimeout = async () => {
    const result = await window.electronAPI.checkTimeoutAndRelease();
    showMessage('success', `已释放${result.releasedCount}个超时预约`);
    loadBookings();
  };

  const handleResetFilters = () => {
    setFilterMemberId('');
    setFilterFamilyId('');
    setFilterDate('');
    setFilterStatus('all');
  };

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filterStatus);

  const getStatusText = (status: string) => {
    const map: any = {
      booked: '已预约',
      cancelled: '已取消',
      checked_in: '已签到',
      completed: '已完成',
    };
    return map[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      booked: 'badge-info',
      cancelled: 'badge-secondary',
      checked_in: 'badge-success',
      completed: 'badge-success',
    };
    return map[status] || 'badge-secondary';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">预约管理</h1>
        <button className="btn btn-secondary" onClick={handleCheckTimeout}>
          检查超时释放
        </button>
      </div>

      {message.text && (
        <div
          className="card"
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

      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ fontWeight: 500, color: '#374151', marginRight: 8 }}>
          筛选：
        </div>

        <select
          className="form-select"
          style={{ width: 130 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="booked">已预约</option>
          <option value="cancelled">已取消</option>
          <option value="checked_in">已签到</option>
        </select>

        <select
          className="form-select"
          style={{ width: 150 }}
          value={filterMemberId}
          onChange={(e) => setFilterMemberId(e.target.value)}
        >
          <option value="">全部会员</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 160 }}
          value={filterFamilyId}
          onChange={(e) => setFilterFamilyId(e.target.value)}
        >
          <option value="">全部家庭</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="form-input"
          style={{ width: 160 }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <button
          className="btn btn-sm"
          style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
          onClick={handleResetFilters}
        >
          重置筛选
        </button>

        <div style={{ marginLeft: 'auto', color: '#6b7280', fontSize: 13 }}>
          共 {filteredBookings.length} 条记录
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>课程日期</th>
                <th>时间</th>
                <th>课程名称</th>
                <th>教练</th>
                <th>会员</th>
                <th>家庭</th>
                <th>预约时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.course_date}</td>
                  <td>
                    {booking.start_time} - {booking.end_time}
                  </td>
                  <td>{booking.course_name}</td>
                  <td>{booking.coach_name}</td>
                  <td>{booking.member_name}</td>
                  <td>{booking.family_name || '-'}</td>
                  <td>
                    {booking.booked_at?.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td>
                    <div>
                      <span className={`badge ${getStatusBadge(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                      {booking.checked_in_at && (
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                          {booking.checked_in_at.slice(0, 16).replace('T', ' ')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {booking.status === 'booked' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleCheckIn(booking.id)}
                          >
                            签到
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            取消预约
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'center',
                      color: '#9ca3af',
                      padding: 32,
                    }}
                  >
                    暂无预约记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
