import React, { useState } from 'react'
import { Settings, User, Key, Eye, EyeOff, ShieldAlert, Zap, Award } from 'lucide-react'

export default function ProfileSettings({ user, onUpdateProfile, apiKey, setApiKey, tasks }) {
  const [name, setName] = useState(user.name || '')
  const [email, setEmail] = useState(user.email || '')
  const [pace, setPace] = useState(user.pace || 'balanced')
  const [keyInput, setKeyInput] = useState(apiKey || '')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  // Calculate Reality Tracker Metrics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.done).length
  const actualRatio = totalTasks > 0 ? (completedTasks / totalTasks) : 0
  const disciplineScore = Math.round(actualRatio * 100)

  let disciplineLevel = 'დაბალი'
  let disciplineClass = 'badge-danger'
  let disciplineFeedback = 'დაგეგმვა კარგია, მაგრამ რეალური მუშაობის გარეშე შედეგს ვერ მიაღწევ. აიღე ერთი დავალება და გააკეთე ის ახლავე!'
  
  if (disciplineScore >= 75) {
    disciplineLevel = 'სანიმუშო'
    disciplineClass = 'badge-success'
    disciplineFeedback = 'შესანიშნავი დისციპლინაა! შენ რეალურად ასრულებ შენს გეგმებს. გააგრძელე ასე!'
  } else if (disciplineScore >= 40) {
    disciplineLevel = 'საშუალო'
    disciplineClass = 'badge-warning'
    disciplineFeedback = 'კარგი მცდელობაა, მაგრამ გეგმების ნაწილი შეუსრულებელი რჩება. ყურადღება მიაქციე დროის ბლოკირებას.'
  }

  const handleSave = (e) => {
    e.preventDefault()
    onUpdateProfile({ name, email, pace })
    setApiKey(keyInput)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="settings-page-container animate-fade-in">
      <div className="page-header">
        <h1>პირადი პროფილის პარამეტრები</h1>
        <p className="subtitle">მართე შენი აკადემიური მონაცემები, სწავლის ტემპი და Gemini API გასაღები.</p>
      </div>

      <div className="settings-grid">
        {/* Profile Info Form */}
        <div className="settings-card glass-panel form-card">
          <h2>პროფილის რედაქტირება</h2>
          
          <form onSubmit={handleSave} className="settings-form">
            {saved && <div className="save-success-msg">ცვლილებები წარმატებით შეინახა!</div>}
            
            <div className="form-group">
              <label htmlFor="settings-name">
                <User size={16} />
                <span>სახელი</span>
              </label>
              <input
                id="settings-name"
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="settings-email">
                <span>ელ-ფოსტა</span>
              </label>
              <input
                id="settings-email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>სწავლის სასურველი ტემპი</label>
              <div className="pace-options">
                <button
                  type="button"
                  onClick={() => setPace('casual')}
                  className={`pace-btn ${pace === 'casual' ? 'active' : ''}`}
                >
                  <strong>Casual</strong>
                  <span>მშვიდი, ნაკლები დატვირთვა</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPace('balanced')}
                  className={`pace-btn ${pace === 'balanced' ? 'active' : ''}`}
                >
                  <strong>Balanced</strong>
                  <span>ოპტიმალური ბალანსი</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPace('intensive')}
                  className={`pace-btn ${pace === 'intensive' ? 'active' : ''}`}
                >
                  <strong>Intensive</strong>
                  <span>მაქსიმალური ფოკუსი</span>
                </button>
              </div>
            </div>

            {/* API Key Configuration */}
            <div className="form-group">
              <label htmlFor="settings-api-key">
                <Key size={16} />
                <span>Google AI Studio API Key (Gemini)</span>
              </label>
              <div className="api-key-input-container">
                <input
                  id="settings-api-key"
                  type={showKey ? 'text' : 'password'}
                  className="input-field api-key-field"
                  placeholder="AIStudio API გასაღები (AI მუშაობისთვის)..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                />
                <button
                  type="button"
                  className="key-toggle-btn"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="field-note">
                თუ გასაღები ცარიელია, პლატფორმა მუშაობს <b>სადემონსტრაციო რეჟიმში</b> (Mock Engine). 
                საკუთარი გასაღების შეყვანა საშუალებას მოგცემთ გამოიყენოთ ცოცხალი AI.
              </p>
            </div>

            <button type="submit" className="btn-primary save-btn">
              ცვლილებების შენახვა
            </button>
          </form>
        </div>

        {/* Reality Tracker */}
        <div className="settings-card glass-panel reality-tracker-card">
          <h2>რეალობის თრექერი (Expectation vs. Reality)</h2>
          
          <div className="disclaimer-alert">
            <ShieldAlert size={20} className="alert-icon" />
            <div className="alert-content">
              <strong>დისციპლინის შეხსენება</strong>
              <p>
                AI არის დამხმარე ასისტენტი, რომელიც ქმნის საუკეთესო გეგმას. თუმცა, გეგმის რეალური 
                შესრულება მთლიანად შენზეა. პროგრესის დაფა აჩვენებს მკაცრ, ცივ რეალობას.
              </p>
            </div>
          </div>

          <div className="score-visualization-box">
            <div className="score-gauge-label">დისციპლინის ქულა (Discipline Score)</div>
            
            <div className="score-display">
              <Award size={32} className="award-icon" />
              <div className="score-number">{disciplineScore}<span>/100</span></div>
              <span className={`badge ${disciplineClass}`}>{disciplineLevel}</span>
            </div>

            {/* Discipline progress bar */}
            <div className="discipline-bar-bg">
              <div 
                className="discipline-bar-fill"
                style={{ 
                  width: `${disciplineScore}%`,
                  backgroundColor: disciplineScore >= 75 ? 'var(--success)' : disciplineScore >= 40 ? 'var(--warning)' : 'var(--danger)'
                }}
              />
            </div>

            <div className="score-stats-grid">
              <div className="score-stat-cell">
                <span className="cell-num">{totalTasks}</span>
                <span className="cell-txt">დაგეგმილი</span>
              </div>
              <div className="score-stat-cell">
                <span className="cell-num">{completedTasks}</span>
                <span className="cell-txt">შესრულებული</span>
              </div>
              <div className="score-stat-cell">
                <span className="cell-num">{totalTasks - completedTasks}</span>
                <span className="cell-txt">შეუსრულებელი</span>
              </div>
            </div>

            <div className="reality-feedback">
              <Zap size={16} className="feedback-icon" />
              <p>{disciplineFeedback}</p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .settings-page-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 30px;
          align-items: start;
        }

        .settings-card {
          padding: 26px;
          background: #ffffff;
        }

        .settings-card h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 20px;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .save-success-msg {
          padding: 10px 14px;
          background-color: var(--success-light);
          color: var(--success);
          font-weight: 600;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-medium);
          margin-bottom: 6px;
        }

        /* Pace Buttons custom layout */
        .pace-options {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          width: 100%;
        }

        .pace-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 14px 10px;
          border: 1.5px solid var(--border);
          background: #ffffff;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: center;
        }

        .pace-btn strong {
          font-size: 0.88rem;
          color: var(--text-main);
          margin-bottom: 4px;
        }

        .pace-btn span {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .pace-btn:hover {
          border-color: var(--primary);
          background: var(--primary-subtle);
        }

        .pace-btn.active {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .pace-btn.active strong {
          color: var(--primary-hover);
        }

        /* API key display */
        .api-key-input-container {
          display: flex;
          position: relative;
        }

        .api-key-field {
          padding-right: 46px;
        }

        .key-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .field-note {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-top: 6px;
        }

        .save-btn {
          align-self: flex-start;
          padding: 12px 30px;
          margin-top: 10px;
        }

        /* Reality Tracker Box layout */
        .disclaimer-alert {
          display: flex;
          gap: 14px;
          background: #fffbeb; /* amber/warning tint */
          border: 1px solid #fef3c7;
          padding: 16px;
          border-radius: var(--radius-md);
          margin-bottom: 24px;
        }

        .alert-icon {
          color: var(--warning);
          flex-shrink: 0;
        }

        .alert-content strong {
          display: block;
          font-size: 0.88rem;
          color: #92400e;
          margin-bottom: 4px;
        }

        .alert-content p {
          font-size: 0.8rem;
          line-height: 1.45;
          color: #92400e;
        }

        .score-visualization-box {
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 24px;
          background: var(--bg-tertiary);
          text-align: center;
        }

        .score-gauge-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .score-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .award-icon {
          color: var(--primary);
        }

        .score-number {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .score-number span {
          font-size: 1rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .discipline-bar-bg {
          width: 100%;
          height: 10px;
          background: var(--border);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 24px;
        }

        .discipline-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.5s ease-in-out;
        }

        .score-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 16px 0;
          margin-bottom: 20px;
        }

        .score-stat-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .score-stat-cell:not(:last-child) {
          border-right: 1px solid var(--border);
        }

        .cell-num {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .cell-txt {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .reality-feedback {
          display: flex;
          gap: 8px;
          text-align: left;
          align-items: flex-start;
          font-size: 0.82rem;
          color: var(--text-medium);
          line-height: 1.45;
          padding: 0 4px;
        }

        .feedback-icon {
          color: var(--primary);
          flex-shrink: 0;
          margin-top: 2px;
        }

        @media (max-width: 992px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 576px) {
          .pace-options {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  )
}
