import { useState, useEffect } from 'react';
import { BalanceTransaction, Family, Member } from '../types';

function FamilyPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    initial_balance: 0,
  });
  const [rechargeAmount, setRechargeAmount] = useState(10);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [familiesData, membersData] = await Promise.all([
      window.electronAPI.getFamilies(),
      window.electronAPI.getMembers(),
    ]);
    setFamilies(familiesData);
    setMembers(membersData);
  };

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAddFamily = async () => {
    if (!formData.name) {
      showMessage('error', '请输入家庭名称');
      return;
    }
    await window.electronAPI.addFamily(formData);
    setShowAddModal(false);
    setFormData({ name: '', initial_balance: 0 });
    loadData();
    showMessage('success', '家庭创建成功');
  };

  const handleRecharge = async () => {
    if (!selectedFamily) return;
    if (rechargeAmount <= 0) {
      showMessage('error', '充值数量必须大于0');
      return;
    }
    await window.electronAPI.rechargeFamily({
      family_id: selectedFamily.id,
      amount: rechargeAmount,
      description: '课时充值',
    });
    setShowRechargeModal(false);
    setRechargeAmount(10);
    loadData();
    showMessage('success', '充值成功');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个家庭吗？家庭成员将变为独立会员。')) return;
    await window.electronAPI.deleteFamily(id);
    loadData();
    showMessage('success', '家庭删除成功');
  };

  const openRechargeModal = (family: Family) => {
    setSelectedFamily(family);
    setShowRechargeModal(true);
  };

  const openTxModal = async (family: Family) => {
    setSelectedFamily(family);
    const txs = await window.electronAPI.getBalanceTransactions(family.id);
    setTransactions(txs);
    setShowTxModal(true);
  };

  const getTxTypeText = (type: string) => {
    const map: any = {
      recharge: '充值',
      book: '预约扣课',
      waitlist_book: '候补补位扣课',
      cancel: '取消退款',
    };
    return map[type] || type;
  };

  const getTxBadgeClass = (type: string) => {
    if (type === 'recharge' || type === 'cancel') return 'badge-success';
    if (type === 'waitlist_book') return 'badge-info';
    return 'badge-warning';
  };

  const availableMembers = members.filter((m) => !m.family_id);

  const handleAddMember = async (familyId: number) => {
    const memberId = prompt('请输入要添加的会员ID：');
    if (!memberId) return;
    const member = members.find((m) => m.id === parseInt(memberId));
    if (!member) {
      showMessage('error', '会员不存在');
      return;
    }
    if (member.family_id) {
      showMessage('error', '该会员已属于其他家庭');
      return;
    }
    await window.electronAPI.addFamilyMember({
      family_id: familyId,
      member_id: parseInt(memberId),
    });
    loadData();
    showMessage('success', '成员添加成功');
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('确定要移除该家庭成员吗？')) return;
    await window.electronAPI.removeFamilyMember(memberId);
    loadData();
    showMessage('success', '成员移除成功');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">家庭额度</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + 创建家庭
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
        <h3 style={{ marginBottom: 16, fontSize: 16 }}>
          独立会员（未加入家庭）：{availableMembers.length}人
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {availableMembers.map((m) => (
            <span key={m.id} className="badge badge-secondary">
              {m.name} (ID: {m.id})
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20 }}>
        {families.map((family) => (
          <div key={family.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>
                  👨‍👩‍👧 {family.name}
                </h3>
                <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>
                      当前余额：
                    </span>
                    <span
                      style={{
                        color: '#4f46e5',
                        fontWeight: 600,
                        fontSize: 18,
                      }}
                    >
                      {family.balance} 课时
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>
                      累计购买：
                    </span>
                    <span style={{ color: '#059669', fontWeight: 500 }}>
                      {family.total_purchased} 课时
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => openRechargeModal(family)}
                >
                  充值
                </button>
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => openTxModal(family)}
                >
                  流水
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleAddMember(family.id)}
                >
                  添加成员
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(family.id)}
                >
                  删除
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                家庭成员（{family.members?.length || 0}人）
              </div>
              {family.members && family.members.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {family.members.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: 20,
                      }}
                    >
                      <span>{member.name}</span>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          fontSize: 16,
                        }}
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: 13 }}>暂无成员</div>
              )}
            </div>
          </div>
        ))}

        {families.length === 0 && (
          <div
            className="card"
            style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}
          >
            暂无家庭数据，点击上方按钮创建家庭
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">创建家庭</h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">家庭名称</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="如：张伟家庭"
                />
              </div>
              <div className="form-group">
                <label className="form-label">初始课时数</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={formData.initial_balance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initial_balance: parseInt(e.target.value) || 0,
                    })
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
              <button className="btn btn-primary" onClick={handleAddFamily}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showRechargeModal && selectedFamily && (
        <div
          className="modal-overlay"
          onClick={() => setShowRechargeModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">课时充值</h3>
              <button
                className="modal-close"
                onClick={() => setShowRechargeModal(false)}
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
                <div style={{ marginBottom: 4 }}>
                  家庭：<strong>{selectedFamily.name}</strong>
                </div>
                <div>
                  当前余额：
                  <span style={{ color: '#4f46e5', fontWeight: 600 }}>
                    {selectedFamily.balance} 课时
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">充值数量</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={rechargeAmount}
                  onChange={(e) =>
                    setRechargeAmount(parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div
                style={{
                  padding: 12,
                  backgroundColor: '#ecfdf5',
                  borderRadius: 8,
                  color: '#059669',
                }}
              >
                充值后余额：{selectedFamily.balance + rechargeAmount} 课时
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRechargeModal(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleRecharge}>
                确认充值
              </button>
            </div>
          </div>
        </div>
      )}

      {showTxModal && selectedFamily && (
        <div
          className="modal-overlay"
          onClick={() => setShowTxModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 800, minWidth: 640 }}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {selectedFamily.name} - 课时流水
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowTxModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: 480, overflowY: 'auto' }}>
              <div style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
                当前余额: <strong style={{ color: '#4f46e5' }}>{selectedFamily.balance}</strong> 课时
                　|　累计购买: <strong>{selectedFamily.total_purchased}</strong> 课时
              </div>
              {transactions.length > 0 ? (
                <table style={{ width: '100%', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>时间</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>类型</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px' }}>课时</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>会员</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px' }}>课程/备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 4px', color: '#6b7280' }}>
                          {tx.created_at?.slice(0, 16).replace('T', ' ')}
                        </td>
                        <td style={{ padding: '8px 4px' }}>
                          <span className={`badge ${getTxBadgeClass(tx.type)}`}>
                            {getTxTypeText(tx.type)}
                          </span>
                        </td>
                        <td style={{
                          padding: '8px 4px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: tx.amount > 0 ? '#059669' : '#dc2626',
                        }}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </td>
                        <td style={{ padding: '8px 4px' }}>
                          {tx.member_name || '-'}
                        </td>
                        <td style={{ padding: '8px 4px', color: '#374151' }}>
                          {tx.course_name ? (
                            <>
                              <div>{tx.course_name}</div>
                              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                                {tx.course_date} {tx.start_time} · {tx.coach_name}
                              </div>
                            </>
                          ) : (
                            tx.description || '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                  暂无流水记录
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowTxModal(false)}
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

export default FamilyPage;
