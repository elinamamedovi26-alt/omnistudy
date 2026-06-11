import React from 'react'
import { LayoutDashboard, Calendar, BookOpen, Settings, LogOut, GraduationCap, Menu, X } from 'lucide-react'

export default function Sidebar({ activePage, setActivePage, user, onLogout }) {
  const [isOpen, setIsOpen] = React.useState(false)

  const menuItems = [
    { id: 'dashboard', name: 'მთავარი დაფა', icon: LayoutDashboard },
    { id: 'time-manager', name: 'AI დროის მენეჯერი', icon: Calendar },
    { id: 'study-hub', name: 'სასწავლო ჰაბი', icon: BookOpen },
    { id: 'settings', name: 'პროფილი & პარამეტრები', icon: Settings },
  ]

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Mobile Toggle Button */}
      <button className="mobile-toggle" onClick={toggleSidebar} aria-label="Toggle navigation">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}

      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon-box">
              <GraduationCap size={26} className="logo-icon" />
            </div>
            <span className="logo-text">OmniStudy</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id)
                  setIsOpen(false)
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} className="nav-icon" />
                <span className="nav-text">{item.name}</span>
                {isActive && <div className="active-indicator" />}
              </button>
            )
          })}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="user-profile-capsule">
              <div className="avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="user-info">
                <p className="user-name">{user.name || 'სტუდენტი'}</p>
                <p className="user-email">{user.email || 'student@omnistudy.edu'}</p>
              </div>
            </div>
            <button className="logout-btn" onClick={onLogout} title="გამოსვლა">
              <LogOut size={18} />
              <span>გამოსვლა</span>
            </button>
          </div>
        )}
      </aside>

      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar {
          width: 280px;
          height: calc(100vh - 40px);
          position: sticky;
          top: 20px;
          left: 20px;
          margin: 20px 0 20px 20px;
          display: flex;
          flex-direction: column;
          padding: 24px;
          z-index: 100;
          box-sizing: border-box;
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(2, 132, 199, 0.1);
        }

        .sidebar-header {
          margin-bottom: 36px;
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon-box {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, var(--primary) 0%, #38bdf8 100%);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
        }

        .logo-text {
          font-size: 1.35rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: transparent;
          border: none;
          color: var(--text-medium);
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-weight: 500;
          width: 100%;
          text-align: left;
          transition: all var(--transition-fast);
          position: relative;
        }

        .nav-item:hover {
          background: var(--primary-subtle);
          color: var(--primary);
        }

        .nav-item.active {
          background: var(--primary-light);
          color: var(--primary-hover);
          font-weight: 600;
        }

        .nav-icon {
          opacity: 0.8;
          transition: transform var(--transition-fast);
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.05);
          opacity: 1;
        }

        .active-indicator {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 20px;
          background: var(--primary);
          border-radius: var(--radius-full) 0 0 var(--radius-full);
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-top: 1px solid var(--border);
          padding-top: 20px;
        }

        .user-profile-capsule {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px;
        }

        .avatar {
          width: 40px;
          height: 40px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
          border: 1px solid var(--border-focus);
        }

        .user-info {
          overflow: hidden;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-main);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }

        .logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          width: 100%;
          border: 1.5px solid var(--danger-light);
          background: transparent;
          color: var(--danger);
          font-weight: 500;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          transition: all var(--transition-fast);
        }

        .logout-btn:hover {
          background: var(--danger-light);
        }

        .mobile-toggle {
          display: none;
          position: fixed;
          top: 16px;
          left: 16px;
          z-index: 101;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          align-items: center;
          justify-content: center;
          color: var(--text-main);
          box-shadow: var(--shadow-sm);
        }

        .sidebar-backdrop {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(4px);
          z-index: 99;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: -300px;
            bottom: 0;
            height: 100vh;
            margin: 0;
            width: 280px;
            border-radius: 0;
            transition: left var(--transition-normal);
            box-shadow: var(--shadow-lg);
          }

          .sidebar.open {
            left: 0;
          }

          .mobile-toggle {
            display: flex;
          }

          .sidebar-backdrop {
            display: block;
          }
        }
      ` }} />
    </>
  )
}
