import { useState, useEffect } from 'react';
import { Stats } from '../types';

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const statsData = await window.electronAPI.getStats();
    setStats(statsData);

    const today = new Date().toISOString().split('T')[0];
    const schedules = await window.electronAPI.getSchedules(today);
    setTodaySchedules(schedules);
  };

  const statCards = [
    {
      label: '教练总数',
      value: stats?.coachCount || 0,
      icon: '🏋️',
      color: '#dbeafe',
    },
    {
      label: '会员总数',
      value: stats?.memberCount || 0,
      icon: '👤',
      color: '#d1fae5',
    },
    {
      label: '家庭数',
      value: stats?.familyCount || 0,
      icon: '👨‍👩‍👧',
      color: '#fef3c7',
    },
    {
      label: '今日预约',
      value: stats?.todayBookings || 0,
      icon: '📅',
      color: '#fce7f3',
    },
    {
      label: '总课时余额',
      value: stats?.totalBalance || 0,
      icon: '💰',
      color: '#e0e7ff',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          今日课程
        </h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>课程名称</th>
                <th>教练</th>
                <th>预约情况</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {todaySchedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>
                    {schedule.start_time} - {schedule.end_time}
                  </td>
                  <td>{schedule.course_name}</td>
                  <td>{schedule.coach_name}</td>
                  <td>
                    {schedule.booked_count}/{schedule.capacity} 人
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        schedule.status === 'available'
                          ? 'badge-success'
                          : schedule.status === 'full'
                          ? 'badge-warning'
                          : 'badge-secondary'
                      }`}
                    >
                      {schedule.status === 'available'
                        ? '可预约'
                        : schedule.status === 'full'
                        ? '已满员'
                        : '已取消'}
                    </span>
                  </td>
                </tr>
              ))}
              {todaySchedules.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: 24 }}>
                    今日暂无课程安排
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

export default Dashboard;
