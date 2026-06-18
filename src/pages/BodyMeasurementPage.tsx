import { useState, useEffect } from 'react';
import { Member, BodyMeasurement } from '../types';

function BodyMeasurementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    measure_date: new Date().toISOString().split('T')[0],
    height: '',
    weight: '',
    bmi: '',
    body_fat: '',
    muscle_mass: '',
    waist: '',
    hip: '',
    chest: '',
    notes: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const data = await window.electronAPI.getMembers();
    setMembers(data);
  };

  const loadMeasurements = async (memberId: number) => {
    const data = await window.electronAPI.getBodyMeasurements(memberId);
    setMeasurements(data);
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    loadMeasurements(member.id);
  };

  const handleAddMeasurement = async () => {
    if (!selectedMember) return;

    const data = {
      member_id: selectedMember.id,
      measure_date: formData.measure_date,
      height: formData.height ? parseFloat(formData.height) : null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      bmi: formData.bmi ? parseFloat(formData.bmi) : null,
      body_fat: formData.body_fat ? parseFloat(formData.body_fat) : null,
      muscle_mass: formData.muscle_mass
        ? parseFloat(formData.muscle_mass)
        : null,
      waist: formData.waist ? parseFloat(formData.waist) : null,
      hip: formData.hip ? parseFloat(formData.hip) : null,
      chest: formData.chest ? parseFloat(formData.chest) : null,
      notes: formData.notes || null,
    };

    await window.electronAPI.addBodyMeasurement(data);
    setShowAddModal(false);
    loadMeasurements(selectedMember.id);
    showMessage('success', '体测数据添加成功');
  };

  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const height = parseFloat(formData.height) / 100;
      const weight = parseFloat(formData.weight);
      if (height > 0 && weight > 0) {
        const bmi = (weight / (height * height)).toFixed(1);
        setFormData({ ...formData, bmi });
      }
    }
  };

  const latestMeasurement = measurements[0];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">体测数据</h1>
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

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 260, flexShrink: 0 }}>
          <div className="card">
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>会员列表</h3>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {members.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 4,
                    backgroundColor:
                      selectedMember?.id === member.id
                        ? '#e0e7ff'
                        : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  className="member-item"
                >
                  <div style={{ fontWeight: 500 }}>{member.name}</div>
                  <div
                    style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}
                  >
                    {member.phone || '未填电话'}
                    {member.family_name && ` | ${member.family_name}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {selectedMember ? (
            <>
              <div className="card" style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <h3 style={{ fontSize: 16 }}>
                    {selectedMember.name} - 最新体测数据
                  </h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setFormData({
                        measure_date: new Date()
                          .toISOString()
                          .split('T')[0],
                        height: '',
                        weight: '',
                        bmi: '',
                        body_fat: '',
                        muscle_mass: '',
                        waist: '',
                        hip: '',
                        chest: '',
                        notes: '',
                      });
                      setShowAddModal(true);
                    }}
                  >
                    + 添加体测
                  </button>
                </div>

                {latestMeasurement ? (
                  <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>身高</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
                        {latestMeasurement.height || '-'}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}> cm</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>体重</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e' }}>
                        {latestMeasurement.weight || '-'}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}> kg</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>BMI</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#4f46e5' }}>
                        {latestMeasurement.bmi || '-'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>体脂率</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>
                        {latestMeasurement.body_fat || '-'}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}> %</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>肌肉量</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>
                        {latestMeasurement.muscle_mass || '-'}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}> kg</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>腰围</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#ec4899' }}>
                        {latestMeasurement.waist || '-'}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}> cm</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>臀围</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6' }}>
                        {latestMeasurement.hip || '-'}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}> cm</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 4 }}>胸围</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>
                        {latestMeasurement.chest || '-'}
                        <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}> cm</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: 32,
                      color: '#9ca3af',
                    }}
                  >
                    暂无体测数据，点击右上角按钮添加
                  </div>
                )}
              </div>

              <div className="card">
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>历史记录</h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>测量日期</th>
                        <th>身高</th>
                        <th>体重</th>
                        <th>BMI</th>
                        <th>体脂率</th>
                        <th>肌肉量</th>
                        <th>腰围</th>
                        <th>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => (
                        <tr key={m.id}>
                          <td>{m.measure_date}</td>
                          <td>{m.height || '-'}</td>
                          <td>{m.weight || '-'}</td>
                          <td>{m.bmi || '-'}</td>
                          <td>{m.body_fat ? `${m.body_fat}%` : '-'}</td>
                          <td>{m.muscle_mass || '-'}</td>
                          <td>{m.waist || '-'}</td>
                          <td>{m.notes || '-'}</td>
                        </tr>
                      ))}
                      {measurements.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              textAlign: 'center',
                              color: '#9ca3af',
                              padding: 24,
                            }}
                          >
                            暂无记录
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: 48,
                color: '#9ca3af',
                fontSize: 16,
              }}
            >
              请从左侧选择会员查看体测数据
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">添加体测数据</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">测量日期</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.measure_date}
                  onChange={(e) =>
                    setFormData({ ...formData, measure_date: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">身高 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                    onBlur={calculateBMI}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    onBlur={calculateBMI}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">BMI</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.bmi}
                    onChange={(e) =>
                      setFormData({ ...formData, bmi: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">体脂率 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.body_fat}
                    onChange={(e) =>
                      setFormData({ ...formData, body_fat: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">肌肉量 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.muscle_mass}
                    onChange={(e) =>
                      setFormData({ ...formData, muscle_mass: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">腰围 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.waist}
                    onChange={(e) =>
                      setFormData({ ...formData, waist: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">臀围 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.hip}
                    onChange={(e) =>
                      setFormData({ ...formData, hip: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">胸围 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={formData.chest}
                    onChange={(e) =>
                      setFormData({ ...formData, chest: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="可选备注信息"
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
              <button className="btn btn-primary" onClick={handleAddMeasurement}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BodyMeasurementPage;
