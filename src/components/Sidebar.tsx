import { PageType } from '../App';
import './Sidebar.css';

interface SidebarProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
}

interface MenuItem {
  key: PageType;
  label: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '仪表盘', icon: '📊' },
  { key: 'schedule', label: '课程排期', icon: '📅' },
  { key: 'bookings', label: '预约管理', icon: '📝' },
  { key: 'coaches', label: '教练管理', icon: '🏋️' },
  { key: 'members', label: '会员管理', icon: '👤' },
  { key: 'families', label: '家庭额度', icon: '👨‍👩‍👧' },
  { key: 'measurements', label: '体测数据', icon: '📏' },
];

function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">💪</span>
        <span className="logo-text">健身管理系统</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">管</div>
          <div>
            <div className="user-name">管理员</div>
            <div className="user-role">系统管理员</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
