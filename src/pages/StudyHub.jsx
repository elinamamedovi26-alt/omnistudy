import React, { useState, useEffect, useRef } from 'react'
import { Upload, Play, Pause, FileText, Send, HelpCircle, Volume2, Sparkles, Check, X, RefreshCw, MessageSquare } from 'lucide-react'
import { generateQuiz, generatePodcastScript, askRAGChat } from '../services/gemini'

export default function StudyHub({ apiKey }) {
  const [docText, setDocText] = useState('')
  const [fileName, setFileName] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'quiz' | 'podcast'
  
  // RAG Chat State
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatBottomRef = useRef(null)

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({}) // { questionId: selectedOption }
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizLoading, setQuizLoading] = useState(false)

  // Podcast State
  const [podcastScript, setPodcastScript] = useState([])
  const [podcastLoading, setPodcastLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentLineIndex, setCurrentLineIndex] = useState(-1)
  const [podcastSpeed, setPodcastSpeed] = useState(1)
  const speechUtteranceRef = useRef(null)

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Stop reading if page changes or unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      setDocText(event.target.result)
      setIsLoaded(true)
      // reset states
      setChatMessages([
        {
          id: 'welcome',
          sender: 'assistant',
          text: `გამარჯობა! დოკუმენტი "${file.name}" წარმატებით აიტვირთა. ახლა შეგიძლიათ დამისვათ კითხვები მხოლოდ ამ მასალიდან, ან დააგენერიროთ ქვიზები და პოდკასტი.`
        }
      ])
      setQuizQuestions([])
      setQuizAnswers({})
      setQuizSubmitted(false)
      setPodcastScript([])
      setIsPlaying(false)
      setCurrentLineIndex(-1)
      window.speechSynthesis.cancel()
    }
    reader.readAsText(file)
  }

  const handleTextPaste = (e) => {
    e.preventDefault()
    if (!docText.trim()) return

    setFileName('პასტირებული მასალა')
    setIsLoaded(true)
    setChatMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'გამარჯობა! ტექსტური მასალა წარმატებით ჩაიტვირთა. შეგიძლიათ დამისვათ კითხვები ამ ტექსტიდან, ან დააგენერიროთ ქვიზები და პოდკასტი.'
      }
    ])
    setQuizQuestions([])
    setQuizAnswers({})
    setQuizSubmitted(false)
    setPodcastScript([])
    setIsPlaying(false)
    setCurrentLineIndex(-1)
    window.speechSynthesis.cancel()
  }

  // RAG Chat actions
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMsg = { id: Date.now().toString(), sender: 'user', text: chatInput }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const response = await askRAGChat(chatInput, docText, chatMessages, apiKey)
      setChatMessages(prev => [...prev, { id: (Date.now()+1).toString(), sender: 'assistant', text: response }])
    } catch (err) {
      console.error(err)
      setChatMessages(prev => [...prev, { id: (Date.now()+1).toString(), sender: 'assistant', text: 'დაფიქსირდა შეცდომა ჩატის დამუშავებისას.' }])
    } finally {
      setChatLoading(false)
    }
  }

  // Quiz Maker actions
  const handleGenerateQuiz = async () => {
    setQuizLoading(true)
    setQuizSubmitted(false)
    setQuizAnswers({})
    try {
      const quiz = await generateQuiz(docText, apiKey)
      setQuizQuestions(quiz)
    } catch (err) {
      console.error(err)
    } finally {
      setQuizLoading(false)
    }
  }

  const handleSelectOption = (qId, option) => {
    if (quizSubmitted) return
    setQuizAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleSubmitQuiz = () => {
    let score = 0
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        score++
      }
    })
    setQuizScore(score)
    setQuizSubmitted(true)
  }

  // Podcast audio conversion
  const handleGeneratePodcast = async () => {
    setPodcastLoading(true)
    setIsPlaying(false)
    setCurrentLineIndex(-1)
    window.speechSynthesis.cancel()
    try {
      const script = await generatePodcastScript(docText, apiKey)
      setPodcastScript(script)
    } catch (err) {
      console.error(err)
    } finally {
      setPodcastLoading(false)
    }
  }

  // Play podcast audio line-by-line using Web Speech Synthesis
  const playPodcastLine = (index) => {
    if (index >= podcastScript.length) {
      setIsPlaying(false)
      setCurrentLineIndex(-1)
      return
    }

    setCurrentLineIndex(index)
    const line = podcastScript[index]
    
    // Setup utterance
    const utterance = new SpeechSynthesisUtterance(line.text)
    
    // Choose voice based on speaker (Tamta / Giorgi)
    const voices = window.speechSynthesis.getVoices()
    
    // In Georgian browser setups, native voices are limited, so we can vary pitch/rate to simulate different speakers
    if (line.speaker === 'თამთა') {
      utterance.pitch = 1.25 // Slightly higher pitch for female speaker simulation
      utterance.rate = 1.05 * podcastSpeed
    } else {
      utterance.pitch = 0.9 // Lower pitch for male speaker simulation
      utterance.rate = 0.95 * podcastSpeed
    }

    // Attempt to set Georgian locale if possible (though browser fallbacks are common)
    utterance.lang = 'ka-GE'

    utterance.onend = () => {
      if (isPlaying) {
        playPodcastLine(index + 1)
      }
    }

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e)
      setIsPlaying(false)
    }

    speechUtteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const togglePodcastPlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      const startLine = currentLineIndex === -1 ? 0 : currentLineIndex
      playPodcastLine(startLine)
    }
  }

  const handleSpeedChange = (newSpeed) => {
    setPodcastSpeed(newSpeed)
    if (isPlaying) {
      // Restart current line with new speed
      window.speechSynthesis.cancel()
      playPodcastLine(currentLineIndex)
    }
  }

  const handleResetDocument = () => {
    setIsLoaded(false)
    setDocText('')
    setFileName('')
    setChatMessages([])
    setQuizQuestions([])
    setQuizAnswers({})
    setQuizSubmitted(false)
    setPodcastScript([])
    setIsPlaying(false)
    setCurrentLineIndex(-1)
    window.speechSynthesis.cancel()
  }

  return (
    <div className="study-hub-container animate-fade-in">
      <div className="page-header">
        <h1>სასწავლო მასალების ჰაბი და მულტიმედია</h1>
        <p className="subtitle">ატვირთე სასწავლო მასალები და გარდაქმენი ისინი ინტერაქტიულ ქვიზებად, პოდკასტებად და გაესაუბრე AI ასისტენტს.</p>
      </div>

      <div className="study-hub-layout">
        {/* Left column: Upload & Document controls */}
        <div className="hub-left-panel">
          {!isLoaded ? (
            <div className="upload-box glass-panel">
              <h2>მასალის ატვირთვა</h2>
              
              <div className="file-drop-zone">
                <Upload size={36} className="upload-icon" />
                <p className="drop-title">ჩააგდეთ ფაილი აქ ან აირჩიეთ ფაილი</p>
                <p className="drop-subtitle">მხარდაჭერილია ტექსტური ფაილები (.txt)</p>
                <input 
                  type="file" 
                  accept=".txt" 
                  onChange={handleFileUpload} 
                  className="file-input-hidden" 
                  id="file-upload-input"
                />
                <label htmlFor="file-upload-input" className="btn-secondary file-upload-btn">
                  ფაილის შერჩევა
                </label>
              </div>

              <div className="divider-or">ან ჩაწერეთ ტექსტი</div>

              <div className="paste-zone">
                <textarea
                  className="input-field paste-textarea"
                  placeholder="ჩაწერეთ ან ჩააკოპირეთ სასწავლო მასალა აქ..."
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  rows="8"
                />
                <button 
                  onClick={handleTextPaste} 
                  className="btn-primary paste-submit-btn" 
                  disabled={!docText.trim()}
                >
                  ტექსტის ჩატვირთვა
                </button>
              </div>
            </div>
          ) : (
            <div className="loaded-document-card glass-panel">
              <div className="doc-icon-box">
                <FileText size={32} />
              </div>
              <h3 className="doc-title">{fileName}</h3>
              <p className="doc-meta">მოცულობა: {docText.length} სიმბოლო</p>
              
              <div className="doc-actions-list">
                <button 
                  onClick={() => setActiveTab('chat')} 
                  className={`doc-action-btn ${activeTab === 'chat' ? 'active' : ''}`}
                >
                  <MessageSquare size={16} />
                  <span>ჩაშენებული AI ასისტენტი (RAG)</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('quiz')
                    if (quizQuestions.length === 0) handleGenerateQuiz()
                  }} 
                  className={`doc-action-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                >
                  <HelpCircle size={16} />
                  <span>ინტერაქტიული ქვიზები</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveTab('podcast')
                    if (podcastScript.length === 0) handleGeneratePodcast()
                  }} 
                  className={`doc-action-btn ${activeTab === 'podcast' ? 'active' : ''}`}
                >
                  <Volume2 size={16} />
                  <span>სასწავლო პოდკასტი</span>
                </button>
              </div>

              <button onClick={handleResetDocument} className="btn-secondary reset-doc-btn">
                ახალი მასალის ატვირთვა
              </button>
            </div>
          )}
        </div>

        {/* Right column: Dynamic active work workspace */}
        <div className="hub-right-panel">
          {!isLoaded ? (
            <div className="hub-empty-state glass-panel">
              <FileText size={48} className="empty-icon" />
              <h3>სამუშაო სივრცე ცარიელია</h3>
              <p>გთხოვთ, ჯერ ატვირთოთ სასწავლო მასალა მარცხენა პანელიდან შესაბამისი ხელსაწყოების გასააქტიურებლად.</p>
            </div>
          ) : (
            <div className="workspace-card glass-panel">
              
              {/* Tab: RAG Chat */}
              {activeTab === 'chat' && (
                <div className="chat-workspace animate-fade-in">
                  <div className="workspace-header">
                    <h3>AI ასისტენტი (ჰალუცინაციების გარეშე)</h3>
                    <span className="badge badge-info">RAG ძრავა ჩართულია</span>
                  </div>
                  <div className="chat-messages-container">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
                        <div className="chat-avatar">
                          {msg.sender === 'user' ? 'ს' : 'AI'}
                        </div>
                        <div className="chat-bubble-text">
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="chat-bubble-row assistant">
                        <div className="chat-avatar">AI</div>
                        <div className="chat-bubble-text loading">
                          <div className="typing-indicator">
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="chat-input-bar">
                    <input
                      type="text"
                      className="input-field chat-input"
                      placeholder="დაუსვი კითხვა ატვირთულ მასალაზე..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                    />
                    <button type="submit" className="btn-primary chat-send-btn" disabled={chatLoading || !chatInput.trim()}>
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Quiz Center */}
              {activeTab === 'quiz' && (
                <div className="quiz-workspace animate-fade-in">
                  <div className="workspace-header">
                    <h3>ინტერაქტიული ქვიზები</h3>
                    <button 
                      onClick={handleGenerateQuiz} 
                      className="btn-secondary regenerate-btn"
                      disabled={quizLoading}
                    >
                      <RefreshCw size={14} className={quizLoading ? 'anim-spin' : ''} />
                      <span>თავიდან გენერაცია</span>
                    </button>
                  </div>

                  {quizLoading ? (
                    <div className="quiz-loading-state">
                      <div className="spinner-large" />
                      <p>AI აგენერირებს ქვიზს მასალაზე დაყრდნობით...</p>
                    </div>
                  ) : quizQuestions.length === 0 ? (
                    <div className="quiz-empty-state">
                      <HelpCircle size={40} className="empty-icon" />
                      <p>ქვიზის მასალა არ არის მომზადებული.</p>
                      <button onClick={handleGenerateQuiz} className="btn-primary">
                        ქვიზის გენერირება
                      </button>
                    </div>
                  ) : (
                    <div className="quiz-test-flow">
                      <div className="quiz-list">
                        {quizQuestions.map((q, idx) => {
                          const selected = quizAnswers[q.id]
                          return (
                            <div key={q.id} className="quiz-card-item">
                              <h4 className="quiz-question-title">{idx + 1}. {q.question}</h4>
                              <div className="quiz-options-list">
                                {q.options.map((opt, oIdx) => {
                                  const isSelected = selected === opt
                                  const isCorrect = opt === q.correctAnswer
                                  let optClass = ''
                                  if (isSelected) optClass = 'selected'
                                  if (quizSubmitted) {
                                    if (isCorrect) optClass = 'correct'
                                    else if (isSelected) optClass = 'wrong'
                                  }

                                  return (
                                    <button
                                      key={oIdx}
                                      onClick={() => handleSelectOption(q.id, opt)}
                                      className={`quiz-option-btn ${optClass}`}
                                      disabled={quizSubmitted}
                                    >
                                      <span className="opt-letter">
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span className="opt-text">{opt}</span>
                                      {quizSubmitted && isCorrect && <Check size={16} className="opt-status-icon success" />}
                                      {quizSubmitted && isSelected && !isCorrect && <X size={16} className="opt-status-icon danger" />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {!quizSubmitted ? (
                        <button 
                          onClick={handleSubmitQuiz} 
                          className="btn-primary quiz-submit-btn"
                          disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                        >
                          ტესტის დასრულება და შეფასება
                        </button>
                      ) : (
                        <div className="quiz-result-score-box">
                          <div className="score-badge">
                            {quizScore} / {quizQuestions.length}
                          </div>
                          <h4>შედეგი: {Math.round((quizScore / quizQuestions.length) * 100)}%</h4>
                          <p>{quizScore === quizQuestions.length ? 'შესანიშნავია! სრულიად აითვისე მასალა! 🌟' : 'კარგი ცდაა, მასალა კიდევ ერთხელ გადაიკითხე უკეთესი შედეგისთვის.'}</p>
                          <button onClick={handleGenerateQuiz} className="btn-secondary retry-btn">
                            სცადე ახალი ტესტი
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Podcast Player */}
              {activeTab === 'podcast' && (
                <div className="podcast-workspace animate-fade-in">
                  <div className="workspace-header">
                    <h3>სასწავლო აუდიო-პოდკასტი</h3>
                    <button 
                      onClick={handleGeneratePodcast} 
                      className="btn-secondary regenerate-btn"
                      disabled={podcastLoading}
                    >
                      <RefreshCw size={14} className={podcastLoading ? 'anim-spin' : ''} />
                      <span>თავიდან გენერაცია</span>
                    </button>
                  </div>

                  {podcastLoading ? (
                    <div className="podcast-loading-state">
                      <div className="spinner-large" />
                      <p>AI ამზადებს პოდკასტის სკრიპტსა და აუდიო ფაილს...</p>
                    </div>
                  ) : podcastScript.length === 0 ? (
                    <div className="podcast-empty-state">
                      <Volume2 size={40} className="empty-icon" />
                      <p>პოდკასტი არ არის მომზადებული.</p>
                      <button onClick={handleGeneratePodcast} className="btn-primary">
                        პოდკასტის გენერირება
                      </button>
                    </div>
                  ) : (
                    <div className="podcast-player-card">
                      {/* Visual Audio Waveform */}
                      <div className="audio-visualizer">
                        <div className={`bar ${isPlaying ? 'playing' : ''}`} style={{ height: '30px' }}></div>
                        <div className={`bar ${isPlaying ? 'playing' : ''}`} style={{ height: '45px' }}></div>
                        <div className={`bar ${isPlaying ? 'playing' : ''}`} style={{ height: '20px' }}></div>
                        <div className={`bar ${isPlaying ? 'playing' : ''}`} style={{ height: '60px' }}></div>
                        <div className={`bar ${isPlaying ? 'playing' : ''}`} style={{ height: '35px' }}></div>
                        <div className={`bar ${isPlaying ? 'playing' : ''}`} style={{ height: '50px' }}></div>
                        <div className={`bar ${isPlaying ? 'playing' : ''}`} style={{ height: '30px' }}></div>
                      </div>

                      {/* Main Audio Controls */}
                      <div className="audio-controls">
                        <button onClick={togglePodcastPlay} className="play-pause-btn">
                          {isPlaying ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '4px' }} />}
                        </button>
                        
                        <div className="podcast-info-meta">
                          <h4>OmniStudy: საგანმანათლებლო მიმოხილვა</h4>
                          <p>მონაწილეობენ: <strong>თამთა</strong> და <strong>გიორგი</strong></p>
                        </div>

                        <div className="speed-control">
                          <label>სიჩქარე</label>
                          <select 
                            value={podcastSpeed} 
                            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                            className="input-field speed-select"
                          >
                            <option value="0.8">0.8x</option>
                            <option value="1">1.0x</option>
                            <option value="1.2">1.2x</option>
                            <option value="1.5">1.5x</option>
                          </select>
                        </div>
                      </div>

                      {/* Transcription / Subtitles scroll */}
                      <div className="transcript-box">
                        <div className="transcript-header">პოდკასტის სკრიპტი:</div>
                        <div className="transcript-lines">
                          {podcastScript.map((line, idx) => {
                            const isCurrent = idx === currentLineIndex
                            return (
                              <div 
                                key={idx} 
                                className={`transcript-line ${line.speaker === 'თამთა' ? 'tamta' : 'giorgi'} ${isCurrent ? 'active' : ''}`}
                              >
                                <span className="speaker-name">{line.speaker}:</span>
                                <span className="speaker-text">{line.text}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .study-hub-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .study-hub-layout {
          display: grid;
          grid-template-columns: 1fr 1.6fr;
          gap: 30px;
          align-items: start;
        }

        .hub-left-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .upload-box, .loaded-document-card {
          padding: 26px;
          background: #ffffff;
        }

        .upload-box h2 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: var(--text-main);
        }

        .file-drop-zone {
          border: 2px dashed var(--border-focus);
          background: var(--bg-primary);
          border-radius: var(--radius-md);
          padding: 30px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          transition: all var(--transition-fast);
        }

        .file-drop-zone:hover {
          border-color: var(--primary);
          background: var(--primary-subtle);
        }

        .upload-icon {
          color: var(--primary);
        }

        .drop-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .drop-subtitle {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .file-input-hidden {
          display: none;
        }

        .file-upload-btn {
          padding: 8px 16px;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .divider-or {
          text-align: center;
          position: relative;
          margin: 20px 0;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .divider-or::before, .divider-or::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 30%;
          height: 1px;
          background: var(--border-light);
        }

        .divider-or::before { left: 0; }
        .divider-or::after { right: 0; }

        .paste-zone {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .paste-textarea {
          resize: none;
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .paste-submit-btn {
          width: 100%;
          justify-content: center;
          padding: 10px;
          font-size: 0.88rem;
        }

        /* Loaded Doc Card */
        .doc-icon-box {
          width: 54px;
          height: 54px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .doc-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
          word-break: break-all;
        }

        .doc-meta {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .doc-actions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .doc-action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid var(--border-light);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          color: var(--text-medium);
          font-weight: 600;
          font-size: 0.88rem;
          text-align: left;
          width: 100%;
          transition: all var(--transition-fast);
        }

        .doc-action-btn:hover {
          background: var(--primary-subtle);
          color: var(--primary);
          border-color: var(--primary-light);
        }

        .doc-action-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .reset-doc-btn {
          width: 100%;
          justify-content: center;
          font-size: 0.88rem;
        }

        /* Workspace details styling */
        .workspace-card {
          padding: 26px;
          background: #ffffff;
          min-height: 500px;
          display: flex;
          flex-direction: column;
        }

        .workspace-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1.5px solid var(--border-light);
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .workspace-header h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .regenerate-btn {
          padding: 6px 12px;
          font-size: 0.78rem;
        }

        .anim-spin {
          animation: spin 1s linear infinite;
        }

        .hub-empty-state {
          padding: 80px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: #ffffff;
          color: var(--text-muted);
          min-height: 500px;
        }

        .hub-empty-state h3 {
          font-size: 1.1rem;
          color: var(--text-main);
          margin: 16px 0 8px 0;
        }

        .hub-empty-state p {
          font-size: 0.88rem;
          max-width: 320px;
        }

        /* Chat Panel */
        .chat-workspace {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .chat-messages-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 8px;
          margin-bottom: 20px;
        }

        .chat-bubble-row {
          display: flex;
          gap: 12px;
          max-width: 85%;
        }

        .chat-bubble-row.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .chat-bubble-row.assistant .chat-avatar {
          background: var(--primary-light);
          color: var(--primary);
        }

        .chat-bubble-row.user .chat-avatar {
          background: var(--border-focus);
          color: var(--primary-hover);
        }

        .chat-bubble-text {
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .chat-bubble-row.assistant .chat-bubble-text {
          background: var(--bg-tertiary);
          color: var(--text-main);
          border-top-left-radius: 2px;
        }

        .chat-bubble-row.user .chat-bubble-text {
          background: var(--primary);
          color: white;
          border-top-right-radius: 2px;
        }

        .chat-bubble-text.loading {
          background: var(--bg-tertiary);
          padding: 12px 20px;
        }

        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          display: inline-block;
          animation: typingBubble 1s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBubble {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .chat-input-bar {
          display: flex;
          gap: 10px;
        }

        .chat-input {
          flex: 1;
          font-size: 0.88rem;
        }

        .chat-send-btn {
          padding: 12px 18px;
        }

        /* Quiz Work Panel */
        .quiz-loading-state, .podcast-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--text-muted);
          flex: 1;
        }

        .spinner-large {
          width: 44px;
          height: 44px;
          border: 4px solid var(--border-light);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 0.8s linear infinite;
          margin-bottom: 20px;
        }

        .quiz-test-flow {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-height: 440px;
          overflow-y: auto;
          padding-right: 6px;
        }

        .quiz-card-item {
          border: 1px solid var(--border-light);
          padding: 20px;
          border-radius: var(--radius-md);
          background: var(--bg-tertiary);
        }

        .quiz-question-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 16px;
        }

        .quiz-options-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quiz-option-btn {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border: 1.5px solid var(--border);
          background: #ffffff;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 0.88rem;
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
        }

        .quiz-option-btn:hover:not(:disabled) {
          border-color: var(--primary);
          background: var(--primary-subtle);
        }

        .quiz-option-btn.selected {
          border-color: var(--primary);
          background: var(--primary-light);
          color: var(--primary-hover);
          font-weight: 600;
        }

        .quiz-option-btn.correct {
          background: var(--success-light);
          border-color: var(--success);
          color: var(--success);
          font-weight: 600;
        }

        .quiz-option-btn.wrong {
          background: var(--danger-light);
          border-color: var(--danger);
          color: var(--danger);
        }

        .opt-letter {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--border-light);
          color: var(--text-medium);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .quiz-option-btn.selected .opt-letter {
          background: var(--primary);
          color: white;
        }

        .quiz-option-btn.correct .opt-letter {
          background: var(--success);
          color: white;
        }

        .quiz-option-btn.wrong .opt-letter {
          background: var(--danger);
          color: white;
        }

        .opt-status-icon {
          margin-left: auto;
        }

        .opt-status-icon.success { color: var(--success); }
        .opt-status-icon.danger { color: var(--danger); }

        .quiz-submit-btn {
          align-self: center;
          padding: 12px 30px;
        }

        .quiz-result-score-box {
          text-align: center;
          padding: 30px;
          border: 1px solid var(--success-light);
          background: #f0fdf4;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .score-badge {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--success);
          color: white;
          font-size: 1.5rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .quiz-result-score-box h4 {
          font-size: 1.2rem;
          color: var(--success);
          font-weight: 700;
        }

        .quiz-result-score-box p {
          font-size: 0.88rem;
          color: var(--text-medium);
        }

        .retry-btn {
          margin-top: 10px;
        }

        /* Podcast Player visualizer */
        .audio-visualizer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 90px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: 24px;
        }

        .audio-visualizer .bar {
          width: 8px;
          border-radius: var(--radius-full);
          background: var(--primary-light);
          transition: height 0.2s;
        }

        .audio-visualizer .bar.playing {
          background: var(--primary);
          animation: wave 1.2s infinite ease-in-out alternate;
        }

        .audio-visualizer .bar:nth-child(2) { animation-delay: 0.1s; }
        .audio-visualizer .bar:nth-child(3) { animation-delay: 0.2s; }
        .audio-visualizer .bar:nth-child(4) { animation-delay: 0.3s; }
        .audio-visualizer .bar:nth-child(5) { animation-delay: 0.4s; }
        .audio-visualizer .bar:nth-child(6) { animation-delay: 0.5s; }
        .audio-visualizer .bar:nth-child(7) { animation-delay: 0.6s; }

        @keyframes wave {
          0% { height: 15px; }
          100% { height: 75px; }
        }

        .audio-controls {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 20px;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          margin-bottom: 24px;
        }

        .play-pause-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
          transition: all var(--transition-fast);
        }

        .play-pause-btn:hover {
          background: var(--primary-hover);
          transform: scale(1.04);
        }

        .podcast-info-meta {
          flex: 1;
        }

        .podcast-info-meta h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .podcast-info-meta p {
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        .speed-control {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .speed-control label {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .speed-select {
          padding: 6px 12px;
          font-size: 0.8rem;
        }

        .transcript-box {
          border: 1.5px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .transcript-header {
          background: var(--bg-tertiary);
          padding: 10px 16px;
          border-bottom: 1.5px solid var(--border-light);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-medium);
        }

        .transcript-lines {
          padding: 16px;
          max-height: 240px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transcript-line {
          font-size: 0.85rem;
          line-height: 1.5;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid transparent;
          transition: all var(--transition-fast);
        }

        .transcript-line.tamta {
          background: #fdf2f8;
          border-left: 3px solid #db2777;
        }

        .transcript-line.giorgi {
          background: #f0fdf4;
          border-left: 3px solid #16a34a;
        }

        .transcript-line.active {
          border: 1px solid var(--primary);
          box-shadow: 0 0 8px var(--border-focus);
          transform: scale(1.01);
        }

        .speaker-name {
          font-weight: 800;
          margin-right: 6px;
        }

        .speaker-name {
          color: var(--text-main);
        }

        @media (max-width: 992px) {
          .study-hub-layout {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  )
}
