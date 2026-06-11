import React, { useState } from 'react'
import { Sparkles, Calendar, Clock, ListTodo, ShieldAlert, ArrowRight, Check } from 'lucide-react'
import { generateStudyPlan } from '../services/gemini'

export default function TimeManager({ tasks, setTasks, apiKey, academicPace }) {
  const [goalText, setGoalText] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pomodoro') // 'pomodoro' | 'time-blocking' | 'eisenhower'
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [synced, setSynced] = useState(false)

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!goalText.trim()) return

    setLoading(true)
    setSynced(false)
    try {
      const plan = await generateStudyPlan(goalText, academicPace, apiKey)
      setGeneratedPlan(plan)
      // Save summary for coaching updates
      if (plan.summary) {
        localStorage.setItem('last_study_plan_summary', plan.summary)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncToDashboard = () => {
    if (!generatedPlan) return

    // Extract tasks to push into main tasks checklist
    const newTasksToSync = []

    // 1. Add Pomodoro tasks
    if (generatedPlan.pomodoro && generatedPlan.pomodoro.length > 0) {
      generatedPlan.pomodoro.forEach((item, index) => {
        newTasksToSync.push({
          id: `sync-pomo-${Date.now()}-${index}`,
          text: `[Pomodoro] ${item.task} (${item.cycles} ციკლი)`,
          priority: 'high',
          deadline: 'დღეს',
          done: false,
          createdAt: new Date().toISOString()
        })
      })
    }

    // 2. Add high priority Eisenhower tasks if present
    if (generatedPlan.eisenhower && generatedPlan.eisenhower.q1) {
      generatedPlan.eisenhower.q1.forEach((item, index) => {
        // Avoid duplicate descriptions
        if (!newTasksToSync.some(t => t.text.includes(item))) {
          newTasksToSync.push({
            id: `sync-eis-${Date.now()}-${index}`,
            text: `[სასწრაფო] ${item}`,
            priority: 'high',
            deadline: 'ხვალ',
            done: false,
            createdAt: new Date().toISOString()
          })
        }
      })
    }

    if (newTasksToSync.length > 0) {
      setTasks([...newTasksToSync, ...tasks])
      setSynced(true)
      setTimeout(() => setSynced(false), 3000)
    }
  }

  return (
    <div className="time-manager-container animate-fade-in">
      <div className="page-header">
        <h1>AI დროის მენეჯერი და დამგეგმავი</h1>
        <p className="subtitle">შეიყვანე შენი მიზანი მარტივი ტექსტით და AI გაგიწერს დანაწევრებულ სასწავლო გეგმას.</p>
      </div>

      <div className="planner-layout">
        {/* Input area */}
        <div className="planner-input-panel glass-panel">
          <h2>ახალი გეგმის გენერაცია</h2>
          <form onSubmit={handleGenerate} className="goal-form">
            <div className="form-group">
              <label htmlFor="goal-input">აღწერე შენი სასწავლო გამოწვევა</label>
              <textarea
                id="goal-input"
                className="input-field goal-textarea"
                rows="4"
                placeholder="მაგალითად: '3 დღეში გამოცდა მაქვს ბიოლოგიაში და 50 გვერდი მაქვს წასაკითხი' ან 'შაბათამდე უნდა ჩავაბარო პროგრამირების პროექტი და 3 ლექცია მაქვს საყურებელი'"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                required
              />
            </div>

            <div className="input-tips">
              <span className="badge badge-info">რჩევა</span>
              <p>მიუთითე დრო (დღეების რაოდენობა), მასალის მოცულობა და საგანი უკეთესი შედეგისთვის.</p>
            </div>

            <button type="submit" className="btn-primary generate-btn" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner-small" />
                  <span>AI აგენერირებს გეგმას...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>გეგმის გენერაცია</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output area */}
        <div className="planner-output-panel">
          {loading && (
            <div className="plan-loading-skeleton glass-panel">
              <div className="skeleton-circle" />
              <div className="skeleton-line short" />
              <div className="skeleton-line long" />
              <div className="skeleton-line medium" />
              <p className="loading-text">ჩვენი ტვინის (Brain) ძრავა აანალიზებს დროსა და მოცულობებს, რათა შექმნას რეალისტური განრიგი...</p>
            </div>
          )}

          {!loading && !generatedPlan && (
            <div className="plan-empty-state glass-panel">
              <Calendar size={48} className="empty-icon" />
              <h3>სასწავლო გეგმა ცარიელია</h3>
              <p>შეიყვანე დავალების ტექსტი მარცხენა პანელში და დააჭირე გენერაციის ღილაკს.</p>
            </div>
          )}

          {!loading && generatedPlan && (
            <div className="plan-result-card glass-panel animate-scale-in">
              <div className="plan-result-header">
                <div>
                  <span className="badge badge-success">გეგმა მზადაა</span>
                  <h2 className="plan-title">გეგმის ანალიზი და განრიგი</h2>
                </div>
                <button 
                  onClick={handleSyncToDashboard} 
                  className={`btn-secondary sync-btn ${synced ? 'synced' : ''}`}
                >
                  {synced ? <Check size={18} className="icon-success" /> : <ListTodo size={18} />}
                  <span>{synced ? 'დაემატა დაფაზე!' : 'დაფაზე სინქრონიზაცია'}</span>
                </button>
              </div>

              {generatedPlan.summary && (
                <div className="plan-summary-box">
                  <ShieldAlert size={20} className="summary-icon" />
                  <p><strong>ტვინის შეფასება:</strong> {generatedPlan.summary}</p>
                </div>
              )}

              {/* Navigation tabs */}
              <div className="plan-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'pomodoro' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pomodoro')}
                >
                  <Clock size={16} />
                  <span>Pomodoro ტექნიკა</span>
                </button>
                
                <button 
                  className={`tab-btn ${activeTab === 'time-blocking' ? 'active' : ''}`}
                  onClick={() => setActiveTab('time-blocking')}
                >
                  <Calendar size={16} />
                  <span>Time-Blocking</span>
                </button>

                <button 
                  className={`tab-btn ${activeTab === 'eisenhower' ? 'active' : ''}`}
                  onClick={() => setActiveTab('eisenhower')}
                >
                  <Sparkles size={16} />
                  <span>ეზენჰაუერის მატრიცა</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="tab-content">
                {activeTab === 'pomodoro' && (
                  <div className="pomodoro-tab animate-fade-in">
                    <p className="tab-desc">დაყავით მუშაობა მოკლე, კონცენტრირებულ ინტერვალებად დასვენებებთან ერთად სტრესის შესამცირებლად.</p>
                    <div className="pomodoro-list">
                      {generatedPlan.pomodoro?.map((pomo, i) => (
                        <div key={i} className="pomodoro-item">
                          <div className="pomo-info">
                            <h4>{pomo.task}</h4>
                            <p>ინტერვალები: {pomo.duration} წთ მეცადინეობა / {pomo.breaks} წთ დასვენება</p>
                          </div>
                          <div className="pomo-cycles">
                            <span className="cycle-badge">{pomo.cycles} ციკლი</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'time-blocking' && (
                  <div className="time-blocking-tab animate-fade-in">
                    <p className="tab-desc">გამოყავით კონკრეტული საათები დღის განმავლობაში მხოლოდ ამ აქტივობებისთვის.</p>
                    <div className="time-block-calendar">
                      {generatedPlan.timeBlocking?.map((block, i) => (
                        <div key={i} className="calendar-block">
                          <div className="block-time">{block.time}</div>
                          <div className="block-activity">
                            <ArrowRight size={14} className="arrow-icon" />
                            <span>{block.activity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'eisenhower' && (
                  <div className="eisenhower-tab animate-fade-in">
                    <p className="tab-desc">დაყავით დავალებები პრიორიტეტების მიხედვით, რათა ფოკუსირდეთ ყველაზე კრიტიკულ საქმეებზე.</p>
                    <div className="eisenhower-matrix-grid">
                      {/* Q1: Urgent & Important */}
                      <div className="matrix-quadrant q1">
                        <div className="quadrant-title">Q1: სასწრაფო & მნიშვნელოვანი</div>
                        <ul className="quadrant-list">
                          {generatedPlan.eisenhower?.q1?.map((item, i) => <li key={i}>{item}</li>)}
                          {(!generatedPlan.eisenhower?.q1 || generatedPlan.eisenhower.q1.length === 0) && <li>დავალებები არ არის</li>}
                        </ul>
                      </div>

                      {/* Q2: Important, Not Urgent */}
                      <div className="matrix-quadrant q2">
                        <div className="quadrant-title">Q2: მნიშვნელოვანი, არა სასწრაფო</div>
                        <ul className="quadrant-list">
                          {generatedPlan.eisenhower?.q2?.map((item, i) => <li key={i}>{item}</li>)}
                          {(!generatedPlan.eisenhower?.q2 || generatedPlan.eisenhower.q2.length === 0) && <li>დავალებები არ არის</li>}
                        </ul>
                      </div>

                      {/* Q3: Urgent, Not Important */}
                      <div className="matrix-quadrant q3">
                        <div className="quadrant-title">Q3: სასწრაფო, არა მნიშვნელოვანი</div>
                        <ul className="quadrant-list">
                          {generatedPlan.eisenhower?.q3?.map((item, i) => <li key={i}>{item}</li>)}
                          {(!generatedPlan.eisenhower?.q3 || generatedPlan.eisenhower.q3.length === 0) && <li>დავალებები არ არის</li>}
                        </ul>
                      </div>

                      {/* Q4: Not Urgent, Not Important */}
                      <div className="matrix-quadrant q4">
                        <div className="quadrant-title">Q4: არა სასწრაფო, არა მნიშვნელოვანი</div>
                        <ul className="quadrant-list">
                          {generatedPlan.eisenhower?.q4?.map((item, i) => <li key={i}>{item}</li>)}
                          {(!generatedPlan.eisenhower?.q4 || generatedPlan.eisenhower.q4.length === 0) && <li>დავალებები არ არის</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .time-manager-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .page-header h1 {
          font-size: 2.1rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .page-header .subtitle {
          color: var(--text-muted);
          font-size: 1rem;
          margin-top: 4px;
        }

        .planner-layout {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 30px;
          align-items: start;
        }

        .planner-input-panel {
          padding: 26px;
          background: #ffffff;
        }

        .planner-input-panel h2 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: var(--text-main);
        }

        .goal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .goal-textarea {
          resize: none;
          min-height: 120px;
          line-height: 1.6;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .input-tips {
          display: flex;
          gap: 12px;
          background: var(--bg-primary);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.82rem;
          line-height: 1.5;
        }

        .input-tips p {
          color: var(--text-medium);
        }

        .generate-btn {
          width: 100%;
          justify-content: center;
          padding: 14px;
          font-size: 0.95rem;
        }

        .planner-output-panel {
          min-height: 400px;
        }

        /* Loading Skeleton styling */
        .plan-loading-skeleton {
          padding: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          gap: 16px;
          min-height: 400px;
          text-align: center;
        }

        .skeleton-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary-light);
          animation: pulse 1.5s infinite ease-in-out;
        }

        .skeleton-line {
          height: 12px;
          border-radius: 6px;
          background: var(--border-light);
          animation: pulse 1.5s infinite ease-in-out;
        }

        .skeleton-line.short { width: 40%; }
        .skeleton-line.medium { width: 70%; }
        .skeleton-line.long { width: 85%; }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0.6; }
        }

        .loading-text {
          font-size: 0.88rem;
          color: var(--text-muted);
          max-width: 320px;
          margin-top: 10px;
        }

        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Empty state */
        .plan-empty-state {
          padding: 60px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: #ffffff;
          color: var(--text-muted);
          min-height: 400px;
        }

        .plan-empty-state h3 {
          font-size: 1.1rem;
          margin: 16px 0 8px 0;
          color: var(--text-main);
        }

        .plan-empty-state p {
          font-size: 0.88rem;
          max-width: 300px;
        }

        /* Generated plan card details */
        .plan-result-card {
          padding: 30px;
          background: #ffffff;
        }

        .plan-result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 24px;
          border-bottom: 1.5px solid var(--border-light);
          padding-bottom: 20px;
        }

        .plan-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-main);
          margin-top: 6px;
        }

        .sync-btn {
          padding: 10px 18px;
          font-size: 0.88rem;
        }

        .sync-btn.synced {
          background: var(--success-light);
          border-color: var(--success);
          color: var(--success);
        }

        .icon-success {
          color: var(--success);
        }

        .plan-summary-box {
          display: flex;
          gap: 12px;
          background: #f0fdf4; /* green tint */
          border: 1px solid #dcfce7;
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 26px;
          font-size: 0.88rem;
          color: var(--text-medium);
          line-height: 1.5;
        }

        .summary-icon {
          color: var(--success);
          flex-shrink: 0;
        }

        /* Tabs configuration */
        .plan-tabs {
          display: flex;
          border-bottom: 1.5px solid var(--border);
          gap: 16px;
          margin-bottom: 20px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 6px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          position: relative;
          transition: color var(--transition-fast);
        }

        .tab-btn:hover {
          color: var(--primary);
        }

        .tab-btn.active {
          color: var(--primary);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1.5px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary);
        }

        .tab-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        /* Tab panels contents */
        .pomodoro-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pomodoro-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border: 1px solid var(--border-light);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
        }

        .pomodoro-item h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
        }

        .pomodoro-item p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .cycle-badge {
          background: var(--primary-light);
          color: var(--primary-hover);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 700;
        }

        /* Calendar grid */
        .time-block-calendar {
          display: flex;
          flex-direction: column;
          border: 1.5px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .calendar-block {
          display: flex;
          border-bottom: 1px solid var(--border-light);
        }

        .calendar-block:last-child {
          border-bottom: none;
        }

        .block-time {
          width: 110px;
          padding: 14px;
          background: var(--bg-tertiary);
          border-right: 1.5px solid var(--border-light);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-medium);
          text-align: center;
        }

        .block-activity {
          flex: 1;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          color: var(--text-main);
          font-weight: 500;
        }

        .arrow-icon {
          color: var(--primary);
        }

        /* Eisenhower matrix */
        .eisenhower-matrix-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .matrix-quadrant {
          padding: 20px;
          border-radius: var(--radius-md);
          min-height: 150px;
          border: 1.5px dashed transparent;
        }

        .matrix-quadrant.q1 {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;
        }

        .matrix-quadrant.q2 {
          background: #fef3c7;
          border-color: #fcd34d;
          color: #92400e;
        }

        .matrix-quadrant.q3 {
          background: #e0f2fe;
          border-color: #7dd3fc;
          color: #075985;
        }

        .matrix-quadrant.q4 {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #334155;
        }

        .quadrant-title {
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding-bottom: 6px;
        }

        .quadrant-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.85rem;
          padding-left: 0;
        }

        .quadrant-list li {
          position: relative;
          padding-left: 14px;
          line-height: 1.4;
        }

        .quadrant-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          font-weight: bold;
        }

        @media (max-width: 992px) {
          .planner-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 576px) {
          .eisenhower-matrix-grid {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  )
}
