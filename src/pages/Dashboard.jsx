import React, { useState, useEffect } from 'react'
import { CheckCircle2, Circle, AlertCircle, Plus, Trash2, Calendar, Star, Sparkles, BrainCircuit } from 'lucide-react'
import { getCoachingResponse } from '../services/gemini'

export default function Dashboard({ tasks, setTasks, apiKey, academicPace }) {
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  
  const [heartFeedback, setHeartFeedback] = useState('')
  const [brainFeedback, setBrainFeedback] = useState('')
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  // Calculations
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.done).length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // SVG parameters for the radial gauge
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  // Fetch coaching responses whenever tasks change
  useEffect(() => {
    let active = true
    async function fetchCoaching() {
      setLoadingFeedback(true)
      try {
        const lastPlanSummary = localStorage.getItem('last_study_plan_summary') || ''
        
        // Parallel requests
        const [heartRes, brainRes] = await Promise.all([
          getCoachingResponse(totalTasks - completedTasks, completedTasks, lastPlanSummary, 'HEART', apiKey),
          getCoachingResponse(totalTasks - completedTasks, completedTasks, lastPlanSummary, 'BRAIN', apiKey)
        ])
        
        if (active) {
          setHeartFeedback(heartRes)
          setBrainFeedback(brainRes)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoadingFeedback(false)
      }
    }
    fetchCoaching()

    return () => {
      active = false
    }
  }, [completedTasks, totalTasks, apiKey])

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskText.trim()) return

    const newTask = {
      id: Date.now().toString(),
      text: newTaskText,
      priority: newTaskPriority,
      deadline: newTaskDeadline || 'უცნობია',
      done: false,
      createdAt: new Date().toISOString()
    }

    setTasks([newTask, ...tasks])
    setNewTaskText('')
    setNewTaskDeadline('')
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header-greeting">
        <h1>სტუდენტის მთავარი დაფა</h1>
        <p className="subtitle">აკონტროლე შენი პროგრესი, დაგეგმე დღე და მიიღე AI რეკომენდაციები.</p>
      </div>

      <div className="dashboard-grid">
        {/* Progress Card */}
        <section className="dashboard-card glass-panel progress-card">
          <h2>მიმდინარე პროგრესი</h2>
          
          <div className="progress-visualization">
            <svg className="radial-progress-svg" width="160" height="160" viewBox="0 0 160 160">
              <circle 
                className="radial-bg" 
                cx="80" 
                cy="80" 
                r={radius} 
                strokeWidth="12" 
              />
              <circle 
                className="radial-fill" 
                cx="80" 
                cy="80" 
                r={radius} 
                strokeWidth="12" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
              <text className="radial-text" x="80" y="86" textAnchor="middle">
                {progressPercent}%
              </text>
            </svg>
            
            <div className="progress-details">
              <div className="stat-item">
                <span className="stat-label">შესრულებული:</span>
                <span className="stat-value text-success">{completedTasks}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">აქტიური:</span>
                <span className="stat-value text-primary">{totalTasks - completedTasks}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">სულ დავალება:</span>
                <span className="stat-value">{totalTasks}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Twin Coach Persona Cards */}
        <section className="dashboard-card glass-panel coaching-card">
          <h2>Twin-AI აკადემიური მრჩევლები</h2>
          
          <div className="coaches-container">
            {/* The Heart Persona */}
            <div className="coach-bubble heart">
              <div className="coach-badge heart">
                <Sparkles size={16} />
                <span>ქოუჩი (გული)</span>
              </div>
              <div className="coach-message">
                {loadingFeedback ? (
                  <span className="feedback-spinner">AI აანალიზებს პროგრესს...</span>
                ) : (
                  <p>"{heartFeedback}"</p>
                )}
              </div>
            </div>

            {/* The Brain Persona */}
            <div className="coach-bubble brain">
              <div className="coach-badge brain">
                <BrainCircuit size={16} />
                <span>მენეჯერი (ტვინი)</span>
              </div>
              <div className="coach-message">
                {loadingFeedback ? (
                  <span className="feedback-spinner">AI აანალიზებს პროგრესს...</span>
                ) : (
                  <p>"{brainFeedback}"</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="tasks-section-grid">
        {/* To-Do Lists */}
        <section className="dashboard-card glass-panel tasks-card">
          <div className="card-header-actions">
            <h2>მიმდინარე დავალებები</h2>
            <span className="badge badge-info">{tasks.filter(t => !t.done).length} დარჩენილი</span>
          </div>

          <div className="tasks-list">
            {tasks.length === 0 ? (
              <div className="no-tasks-state">
                <CheckCircle2 size={48} className="empty-icon" />
                <p>დავალებები არ არის. დაამატე ახალი დავალება ან გამოიყენე <b>AI დროის მენეჯერი</b> გეგმის შესადგენად.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className={`task-row ${task.done ? 'done' : ''}`}>
                  <button className="task-toggle-btn" onClick={() => toggleTask(task.id)}>
                    {task.done ? (
                      <CheckCircle2 size={22} className="check-icon done" />
                    ) : (
                      <Circle size={22} className="check-icon" />
                    )}
                  </button>

                  <div className="task-body">
                    <span className="task-text">{task.text}</span>
                    <div className="task-meta">
                      {task.deadline && (
                        <span className="task-deadline">
                          <Calendar size={12} />
                          დედლაინი: {task.deadline}
                        </span>
                      )}
                      <span className={`priority-badge badge-${task.priority}`}>
                        {task.priority === 'high' ? 'სასწრაფო' : task.priority === 'medium' ? 'საშუალო' : 'დაბალი'}
                      </span>
                    </div>
                  </div>

                  <button className="task-delete-btn" onClick={() => deleteTask(task.id)} title="წაშლა">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Add Task Quick Form */}
        <section className="dashboard-card glass-panel add-task-card">
          <h2>დავალების დამატება</h2>
          
          <form onSubmit={handleAddTask} className="add-task-form">
            <div className="form-group">
              <label>დავალების აღწერა</label>
              <input
                type="text"
                className="input-field"
                placeholder="მაგ: ფიზიკის მე-3 თავის წაკითხვა..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>პრიორიტეტი</label>
                <select 
                  className="input-field select-field" 
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  <option value="low">დაბალი</option>
                  <option value="medium">საშუალო</option>
                  <option value="high">მაღალი (სასწრაფო)</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label>დედლაინი</label>
                <input
                  type="date"
                  className="input-field"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary add-btn">
              <Plus size={18} />
              <span>დავალების შექმნა</span>
            </button>
          </form>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .dashboard-header-greeting h1 {
          font-size: 2.1rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .dashboard-header-greeting .subtitle {
          color: var(--text-muted);
          font-size: 1rem;
          margin-top: 4px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 30px;
        }

        .dashboard-card {
          padding: 26px;
          border-radius: var(--radius-lg);
          background: #ffffff;
        }

        .dashboard-card h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 20px;
        }

        /* Progress Card Radial design */
        .progress-visualization {
          display: flex;
          align-items: center;
          gap: 30px;
          justify-content: center;
        }

        .radial-progress-svg {
          filter: drop-shadow(0 4px 10px rgba(2, 132, 199, 0.08));
        }

        .radial-bg {
          fill: none;
          stroke: var(--border-light);
        }

        .radial-fill {
          fill: none;
          stroke: url(#blueGradient); /* we'll define a gradient in App.jsx or fallback to primary */
          stroke: var(--primary);
          transition: stroke-dashoffset var(--transition-slow);
        }

        .radial-text {
          font-size: 1.6rem;
          font-weight: 800;
          fill: var(--text-main);
          font-family: var(--font-sans);
        }

        .progress-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1.5px solid var(--border-light);
          padding-bottom: 6px;
          font-size: 0.92rem;
        }

        .stat-label {
          color: var(--text-muted);
        }

        .stat-value {
          font-weight: 700;
        }

        .text-success { color: var(--success); }
        .text-primary { color: var(--primary); }

        /* Twin Coaches Styles */
        .coaches-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .coach-bubble {
          border-radius: var(--radius-md);
          padding: 16px;
          border: 1px solid var(--border-light);
          transition: all var(--transition-fast);
        }

        .coach-bubble:hover {
          transform: translateX(4px);
        }

        .coach-bubble.heart {
          background: #fdf2f8; /* pink tint */
          border-color: #fce7f3;
        }

        .coach-bubble.brain {
          background: #f0fdf4; /* green tint */
          border-color: #dcfce7;
        }

        .coach-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .coach-badge.heart {
          background: #fce7f3;
          color: #db2777;
        }

        .coach-badge.brain {
          background: #dcfce7;
          color: #16a34a;
        }

        .coach-message {
          font-size: 0.88rem;
          line-height: 1.5;
          color: var(--text-medium);
          font-style: italic;
        }

        .feedback-spinner {
          color: var(--text-muted);
          font-size: 0.82rem;
        }

        /* Tasks Layout */
        .tasks-section-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 30px;
        }

        .card-header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-header-actions h2 {
          margin-bottom: 0;
        }

        .tasks-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .no-tasks-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
          color: var(--text-muted);
        }

        .empty-icon {
          color: var(--primary-light);
          margin-bottom: 16px;
        }

        .no-tasks-state p {
          font-size: 0.9rem;
          max-width: 340px;
          line-height: 1.6;
        }

        .task-row {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
          transition: all var(--transition-fast);
        }

        .task-row:hover {
          border-color: var(--primary-light);
          background: #ffffff;
          box-shadow: var(--shadow-sm);
        }

        .task-toggle-btn {
          background: transparent;
          border: none;
          padding: 0;
          margin-right: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }

        .check-icon {
          transition: color var(--transition-fast);
        }

        .check-icon.done {
          color: var(--success);
        }

        .task-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .task-text {
          font-size: 0.95rem;
          color: var(--text-main);
          font-weight: 500;
          transition: text-decoration var(--transition-fast);
        }

        .task-row.done .task-text {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .task-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .task-deadline {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .priority-badge {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: var(--radius-full);
          text-transform: uppercase;
          font-weight: 700;
        }

        .priority-badge.badge-high { background: #fee2e2; color: #ef4444; }
        .priority-badge.badge-medium { background: #fef3c7; color: #d97706; }
        .priority-badge.badge-low { background: #e0f2fe; color: #0284c7; }

        .task-delete-btn {
          border: none;
          background: transparent;
          color: var(--text-muted);
          padding: 6px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          opacity: 0;
        }

        .task-row:hover .task-delete-btn {
          opacity: 1;
        }

        .task-delete-btn:hover {
          color: var(--danger);
          background: var(--danger-light);
        }

        /* Add Task Form styling */
        .add-task-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-medium);
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .flex-1 {
          flex: 1;
        }

        .select-field {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 16px;
          appearance: none;
          padding-right: 36px;
        }

        .add-btn {
          width: 100%;
          justify-content: center;
          padding: 12px;
          margin-top: 8px;
        }

        @media (max-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
          .tasks-section-grid {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  )
}
