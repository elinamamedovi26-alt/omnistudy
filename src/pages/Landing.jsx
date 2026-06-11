import React, { useState } from 'react'
import { GraduationCap, ArrowRight, ShieldCheck, Zap, Sparkles, Brain, BookOpen } from 'lucide-react'

export default function Landing({ onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setError('გთხოვთ შეავსოთ ორივე ველი')
      return
    }
    if (!email.includes('@')) {
      setError('გთხოვთ შეიყვანოთ სწორი ელ-ფოსტა')
      return
    }
    onLogin({ name, email })
  }

  return (
    <div className="landing-container animate-fade-in">
      <header className="landing-header">
        <div className="logo-container">
          <div className="logo-icon-box">
            <GraduationCap size={24} />
          </div>
          <span className="logo-text">OmniStudy</span>
        </div>
      </header>

      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-content">
            <div className="badge badge-info animate-pulse-soft" style={{ marginBottom: '16px' }}>
              <Sparkles size={12} style={{ marginRight: '6px' }} />
              სასწავლო პროცესის ახალი ეპოქა
            </div>
            <h1>დაძლიე ინფორმაციული ქაოსი OmniStudy-სთან ერთად</h1>
            <p className="hero-subtitle">
              ტრადიციული პლანერები ვერ უმკლავდებიან სასწავლო ქაოსს. OmniStudy გთავაზობთ პერსონალიზებულ 
              AI დროის დამგეგმავს, ჭკვიან სასწავლო ჰაბსა და Twin-AI ქოუჩს, რომელიც ერგება თქვენს ინდივიდუალურ ტემპს.
            </p>

            <div className="features-grid">
              <div className="feature-card glass-panel">
                <div className="feature-icon-box purple">
                  <Zap size={20} />
                </div>
                <h3>AI დროის მენეჯერი</h3>
                <p>დაყავით დიდი მასალა Pomodoro, Time-Blocking და ეიზენჰაუერის მეთოდოლოგიებით.</p>
              </div>

              <div className="feature-card glass-panel">
                <div className="feature-icon-box blue">
                  <Brain size={20} />
                </div>
                <h3>სასწავლო ჰაბი & RAG</h3>
                <p>ატვირთეთ მასალები, აქციეთ ქვიზებად/პოდკასტებად და დაუსვით კითხვები ჰალუცინაციების გარეშე.</p>
              </div>
            </div>
          </div>

          <div className="auth-section">
            <div className="auth-card glass-panel animate-scale-in">
              <h2>დაიწყე სწავლა დღესვე</h2>
              <p className="auth-card-subtitle">
                უსაფრთხო და მარტივი ავტორიზაცია სენსიტიური მონაცემების გარეშე.
              </p>

              <form onSubmit={handleSubmit} className="auth-form">
                {error && <div className="form-error-msg">{error}</div>}
                
                <div className="input-group">
                  <label htmlFor="student-name">სახელი</label>
                  <input
                    id="student-name"
                    type="text"
                    className="input-field"
                    placeholder="მაგ: ელენე"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError('')
                    }}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="student-email">ელ-ფოსტა</label>
                  <input
                    id="student-email"
                    type="email"
                    className="input-field"
                    placeholder="elene@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                  />
                </div>

                <button type="submit" className="btn-primary auth-submit-btn">
                  პლატფორმაზე შესვლა
                  <ArrowRight size={18} />
                </button>
              </form>

              <div className="privacy-badge">
                <ShieldCheck size={16} className="shield-icon" />
                <span>დაცულია: ჩვენ ვითხოვთ მხოლოდ სახელსა და ელ-ფოსტას.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .landing-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: radial-gradient(circle at 10% 20%, rgba(224, 242, 254, 0.4) 0%, rgba(255, 255, 255, 1) 90%);
          padding: 0 40px;
          box-sizing: border-box;
        }

        .landing-header {
          padding: 30px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }

        .landing-main {
          flex: 1;
          display: flex;
          align-items: center;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 0 80px 0;
        }

        .hero-section {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 60px;
          align-items: center;
          width: 100%;
        }

        .hero-content h1 {
          font-size: 2.85rem;
          line-height: 1.25;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1.1rem;
          color: var(--text-medium);
          margin-bottom: 40px;
          line-height: 1.7;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .feature-card {
          padding: 24px;
          border-radius: var(--radius-md);
        }

        .feature-icon-box {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .feature-icon-box.purple {
          background: #f5f3ff;
          color: #8b5cf6;
        }

        .feature-icon-box.blue {
          background: #eff6ff;
          color: #3b82f6;
        }

        .feature-card h3 {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-main);
        }

        .feature-card p {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .auth-section {
          display: flex;
          justify-content: center;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          padding: 40px 32px;
          background: #ffffff;
          box-shadow: 0 20px 40px rgba(2, 132, 199, 0.08);
          border-radius: var(--radius-lg);
          border: 1px solid rgba(2, 132, 199, 0.05);
        }

        .auth-card h2 {
          font-size: 1.6rem;
          font-weight: 700;
          margin-bottom: 10px;
          color: var(--text-main);
          letter-spacing: -0.01em;
        }

        .auth-card-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 30px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-error-msg {
          padding: 10px 14px;
          background-color: var(--danger-light);
          color: var(--danger);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-medium);
        }

        .auth-submit-btn {
          width: 100%;
          justify-content: center;
          padding: 14px;
          font-size: 0.98rem;
          margin-top: 10px;
        }

        .privacy-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
          color: var(--text-muted);
          font-size: 0.78rem;
        }

        .shield-icon {
          color: var(--success);
        }

        @media (max-width: 992px) {
          .hero-section {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .landing-main {
            padding: 20px 0 60px 0;
          }
        }

        @media (max-width: 576px) {
          .landing-container {
            padding: 0 20px;
          }
          .hero-content h1 {
            font-size: 2.1rem;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .auth-card {
            padding: 30px 20px;
          }
        }
      ` }} />
    </div>
  )
}
