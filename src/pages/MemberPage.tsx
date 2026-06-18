import { useState, useEffect } from 'react';
import { Member, Family } from '../types';

function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    birthday: '',
    family_id: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [membersData, familiesData] = await Promise.all([
      window.electronAPI.getMembers(),
      window.electronAPI.getFamilies(),
    ]);
    setMembers(membersData);
    setFamilies(familiesData);
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      phone: '',
      gender: '',
      birthday: '',
      family_id: '',
    });
    setShowModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone || '',
      gender: member.gender || '',
      birthday: member.birthday || '',
      family_id: member.family_id?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      showMessage('error', '请输入会员姓名');
      return;
    }

    const data = {
      ...formData,
      family_id: formData.family_id ? parseInt(formData.family_id) : null,
    };

    if (editingMember) {
      await window.electronAPI.updateMember({ id: editingMember.id, ...data });
      showMessage('success', '会员信息更新成功');
    } else {
      await window.electronAPI.addMember(data);
      showMessage('success', '会员添加成功');
    }

    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个会员吗？')) return;
    await window.electronAPI.deleteMember(id);
    loadData();
    showMessage('success', '会员删除成功');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">会员管理</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          + 添加会员
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
                <th>性别</th>
                <th>生日</th>
                <th>所属家庭</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.id}</td>
                  <td>{member.name}</td>
                  <td>{member.phone || '-'}</td>
                  <td>{member.gender || '-'}</td>
                  <td>{member.birthday || '-'}</td>
                  <td>
                    {member.family_name ? (
                      <span className="badge badge-info">
                        {member.family_name} (余额{member.family_balance}课时)
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{member.created_at?.slice(0, 10)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(member)}
                      >
                        编辑
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(member.id)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: 'center',
                      color: '#9ca3af',
                      padding: 32,
                    }}
                  >
                    暂无会员数据
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
                {editingMember ? '编辑会员' : '添加会员'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">姓名</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="请输入姓名"
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
                    placeholder="请输入电话"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">性别</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">生日</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.birthday}
                    onChange={(e) =>
                      setFormData({ ...formData, birthday: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">所属家庭</label>
                <select
                  className="form-select"
                  value={formData.family_id}
                  onChange={(e) =>
                    setFormData({ ...formData, family_id: e.target.value })
                  }
                >
                  <option value="">无（独立会员）</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.name} (余额{family.balance}课时)
                    </option>
                  ))}
                </select>
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

export default MemberPage;
