import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SchedulePage from './pages/SchedulePage';
import CoachPage from './pages/CoachPage';
import MemberPage from './pages/MemberPage';
import FamilyPage from './pages/FamilyPage';
import BodyMeasurementPage from './pages/BodyMeasurementPage';
import BookingPage from './pages/BookingPage';
import './styles/App.css';

export type PageType =
  | 'dashboard'
  | 'schedule'
  | 'bookings'
  | 'coaches'
  | 'members'
  | 'families'
  | 'measurements';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  useEffect(() => {
    const interval = setInterval(() => {
      window.electronAPI.checkTimeoutAndRelease();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'schedule':
        return <SchedulePage />;
      case 'bookings':
        return <BookingPage />;
      case 'coaches':
        return <CoachPage />;
      case 'members':
        return <MemberPage />;
      case 'families':
        return <FamilyPage />;
      case 'measurements':
        return <BodyMeasurementPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
