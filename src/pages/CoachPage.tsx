import { useState, useEffect } from 'react';
import { Coach } from '../types';

function CoachPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    specialty: '',
    avatar: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    const data = await window.electronAPI.getCoaches();
    setCoaches(data);
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const openAddModal = () => {
    setEditingCoach(null);
    setFormData({ name: '', phone: '', specialty: '', avatar: '' });
    setShowModal(true);
  };

  const openEditModal = (coach: Coach) => {
    setEditingCoach(coach);
    setFormData({
      name: coach.name,
      phone: coach.phone || '',
      specialty: coach.specialty || '',
      avatar: coach.avatar || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      showMessage('error', '请输入教练姓名');
      return;
    }

    if (editingCoach) {
      await window.electronAPI.updateCoach({
        id: editingCoach.id,
        ...formData,
      });
      showMessage('success', '教练信息更新成功');
    } else {
      await window.electronAPI.addCoach(formData);
      showMessage('success', '教练添加成功');
    }

    setShowModal(false);
    loadCoaches();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个教练吗？')) return;
    await window.electronAPI.deleteCoach(id);
    loadCoaches();
    showMessage('success', '教练删除成功');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">教练管理</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          + 添加教练
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

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>电话</th>
                <th>专长</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr key={coach.id}>
                  <td>{coach.id}</td>
                  <td>{coach.name}</td>
                  <td>{coach.phone || '-'}</td>
                  <td>{coach.specialty || '-'}</td>
                  <td>{coach.created_at?.slice(0, 10)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(coach)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(coach.id)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coaches.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: 'center',
                      color: '#9ca3af',
                      padding: 32,
                    }}
                  >
                    暂无教练数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCoach ? '编辑教练' : '添加教练'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="请输入教练姓名"
                />
              </div>
              <div className="form-group">
                <label className="form-label">电话</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="请输入联系电话"
                />
              </div>
              <div className="form-group">
                <label className="form-label">专长</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  placeholder="如：力量训练、瑜伽等"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoachPage;
