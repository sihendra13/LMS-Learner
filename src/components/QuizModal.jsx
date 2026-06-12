import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../context/TenantContext';

export const QuizModal = ({ video, onClose }) => {
  const { currentUser, addSubmission, submitEssay, passingScore, updateProgress } = useTenant();

  // Learning wizard steps: 'pre-test' | 'video' | 'post-test' | 'result'
  const midVideoTriggers = [
    ...(video.preQuizzes || []),
    ...(video.postQuizzes || [])
  ].filter(q => q.triggerTime > 0);
  const regularPreQuizzes = (video.preQuizzes || []).filter(q => !q.triggerTime || q.triggerTime === 0);
  const regularPostQuizzes = (video.postQuizzes || []).filter(q => !q.triggerTime || q.triggerTime === 0);
  const hasPreTest = regularPreQuizzes.length > 0;
  const hasPostTest = regularPostQuizzes.length > 0;
  
  const [step, setStep] = useState(() => hasPreTest ? 'pre-test' : 'video');
  
  // Pre-test state
  const [preAnswers, setPreAnswers] = useState({}); // { qId: selectedOption }
  const [preSubmitted, setPreSubmitted] = useState(false);
  const [preScore, setPreScore] = useState(0);

  // Video progress
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const videoRef = useRef(null);
  const maxWatchedTime = useRef(0); // furthest second ever watched
  const triggeredIds = useRef(new Set());
  const [activeTrigger, setActiveTrigger] = useState(null);
  const [triggerAnswer, setTriggerAnswer] = useState('');

  // Post-test state
  const [postAnswers, setPostAnswers] = useState({}); // { qId: answerValue (MCQ option or essay string) }
  const [postSubmitted, setPostSubmitted] = useState(false);
  const [postScore, setPostScore] = useState(0);

  // Simulation mode (no real video URL)
  useEffect(() => {
    if (video.videoUrl) return;
    let interval;
    if (videoPlaying && playProgress < 100) {
      interval = setInterval(() => {
        setPlayProgress(prev => {
          const next = prev + 5;
          if (next >= 100) { setVideoPlaying(false); updateProgress(video.id, 100); return 100; }
          updateProgress(video.id, next);
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [videoPlaying, playProgress, video.id, video.videoUrl]);

  // Real video handlers
  const handleTimeUpdate = () => {
    const el = videoRef.current;
    if (!el || !el.duration) return;
    if (el.currentTime > maxWatchedTime.current) {
      maxWatchedTime.current = el.currentTime;
    }
    const pct = Math.round((el.currentTime / el.duration) * 100);
    setPlayProgress(pct);
    updateProgress(video.id, pct);
    if (!activeTrigger) {
      for (const q of midVideoTriggers) {
        if (!triggeredIds.current.has(q.id) && el.currentTime >= q.triggerTime) {
          triggeredIds.current.add(q.id);
          el.pause();
          setVideoPlaying(false);
          setActiveTrigger(q);
          break;
        }
      }
    }
  };

  const handleSeeking = () => {
    const el = videoRef.current;
    if (!el) return;
    // Block seeking beyond max watched time
    if (el.currentTime > maxWatchedTime.current + 1) {
      el.currentTime = maxWatchedTime.current;
    }
  };

  const handleVideoEnded = () => { setVideoPlaying(false); setPlayProgress(100); updateProgress(video.id, 100); };
  const handlePlayPause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) { el.play(); setVideoPlaying(true); } else { el.pause(); setVideoPlaying(false); }
  };

  const handleTriggerSubmit = () => {
    setActiveTrigger(null);
    setTriggerAnswer('');
    if (videoRef.current) videoRef.current.play();
    setVideoPlaying(true);
  };

  const handlePreSubmit = () => {
    let correct = 0;
    regularPreQuizzes.forEach(q => {
      if (preAnswers[q.id] === q.answer) correct++;
    });
    const calculatedScore = regularPreQuizzes.length > 0 ? Math.round((correct / regularPreQuizzes.length) * 100) : 100;
    setPreScore(calculatedScore);
    setPreSubmitted(true);
    setTimeout(() => { setStep('video'); }, 2000);
  };

  const handlePostSubmit = () => {
    const isEssayQuiz = regularPostQuizzes.some(q => q.isEssay);

    if (isEssayQuiz) {
      const essayQuestions = regularPostQuizzes.map(q => ({
        id: q.id,
        question: q.question,
        answer: postAnswers[q.id] || '',
        score: null
      }));

      const essaySubmission = {
        id: Date.now(),
        employeeName: currentUser.name,
        dept: currentUser.dept,
        videoTitle: video.title,
        date: 'Hari ini',
        questions: essayQuestions
      };

      submitEssay(essaySubmission);
      setPostSubmitted(true);
      setPostScore(null);
      setStep('result');
    } else {
      let correct = 0;
      regularPostQuizzes.forEach(q => {
        if (postAnswers[q.id] === q.answer) correct++;
      });
      const calculatedScore = regularPostQuizzes.length > 0 ? Math.round((correct / regularPostQuizzes.length) * 100) : 100;
      setPostScore(calculatedScore);
      setPostSubmitted(true);

      const isPassed = calculatedScore >= passingScore;
      const newSubmission = {
        id: Date.now(),
        employeeName: currentUser.name,
        videoTitle: video.title,
        preScore: preScore,
        postScore: calculatedScore,
        date: 'Hari ini',
        status: isPassed ? 'Lulus' : 'Remedi (Butuh Ujian Ulang)'
      };

      addSubmission(newSubmission);
      setStep('result');
    }
  };

  return (
    <div className="wizard-modal" onClick={onClose}>
      <div className="wizard-card" onClick={e => e.stopPropagation()}>
        {/* Wizard Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text1)' }}>
              🎥 SOP: {video.title}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Divisi {video.dept} · Durasi {video.duration}</span>
          </div>
          <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text3)' }} onClick={onClose}>✕</button>
        </div>

        {/* Wizard Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* STEP: PRE-TEST */}
          {step === 'pre-test' && (
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>📝 PRE-TEST KUIS</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>Selesaikan sebelum menonton video</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {regularPreQuizzes.map((q, idx) => (
                    <div key={q.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text1)', marginBottom: '12px' }}>
                        {idx + 1}. {q.question}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {q.options.map((option, optIdx) => {
                          const optionChar = String.fromCharCode(65 + optIdx);
                          const isSelected = preAnswers[q.id] === optionChar || preAnswers[q.id] === option;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => setPreAnswers(prev => ({ ...prev, [q.id]: optionChar }))}
                              style={{
                                padding: '10px 14px',
                                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                                background: isSelected ? '#eff6ff' : '#ffffff',
                                color: isSelected ? 'var(--accent)' : 'var(--text1)',
                                borderRadius: '8px',
                                textAlign: 'left',
                                fontSize: '14px',
                                cursor: 'pointer',
                                fontWeight: isSelected ? '600' : 'normal',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <strong>{optionChar}.</strong> {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                {preSubmitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontWeight: '600', fontSize: '13px' }}>
                    ✓ Pre-Test Selesai (Skor: {preScore}%)! Membuka Video...
                  </div>
                ) : (
                  <button 
                    className="btn-primary" 
                    disabled={Object.keys(preAnswers).length < regularPreQuizzes.length}
                    onClick={handlePreSubmit}
                    style={{
                      background: Object.keys(preAnswers).length < regularPreQuizzes.length ? 'var(--text3)' : '#002D72',
                      borderColor: Object.keys(preAnswers).length < regularPreQuizzes.length ? 'var(--text3)' : '#002D72',
                      cursor: Object.keys(preAnswers).length < regularPreQuizzes.length ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Kirim Pre-Test & Lanjutkan
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP: VIDEO PLAYER */}
          {step === 'video' && (
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, background: '#090f1d', borderRadius: '12px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>

                {video.videoUrl ? (
                  /* Real video player */
                  <video
                    ref={videoRef}
                    src={video.videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onSeeking={handleSeeking}
                    onEnded={handleVideoEnded}
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                    controls
                    controlsList="nodownload"
                    style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'contain' }}
                  />
                ) : (
                  /* Simulation fallback */
                  <div style={{ textAlign: 'center', color: '#fff', zIndex: 2 }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎬</div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>{video.title}</h4>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
                      {videoPlaying ? 'Memutar simulasi video...' : playProgress >= 100 ? 'SOP selesai ditonton!' : 'Klik tombol Putar untuk menonton SOP'}
                    </p>
                    <button
                      onClick={() => setVideoPlaying(!videoPlaying)}
                      style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '50px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {videoPlaying ? '⏸ Pause Video' : playProgress >= 100 ? '🔄 Tonton Ulang' : '▶ Putar Video'}
                    </button>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)' }}>
                      <div style={{ height: '100%', width: `${playProgress}%`, background: 'var(--accent)', transition: 'width 0.3s ease' }}></div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '12px', right: '16px', color: '#fff', fontSize: '11px', fontWeight: '600' }}>
                      Progress: {playProgress}%
                    </div>
                  </div>
                )}

                {activeTrigger && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(9,15,29,0.95)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '24px',
                    zIndex: 10
                  }}>
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '480px', width: '100%' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                        📋 Kuis — Video Dijeda Sementara
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '16px', lineHeight: '1.4' }}>
                        {activeTrigger.question}
                      </h4>
                      {activeTrigger.options && activeTrigger.options.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                          {activeTrigger.options.map((opt, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            return (
                              <button
                                key={idx}
                                onClick={() => setTriggerAnswer(letter)}
                                style={{
                                  padding: '10px 14px',
                                  border: triggerAnswer === letter ? '2px solid #002D72' : '1px solid #e2e8f0',
                                  background: triggerAnswer === letter ? '#eff6ff' : '#f8fafc',
                                  color: triggerAnswer === letter ? '#002D72' : '#0f172a',
                                  borderRadius: '8px',
                                  textAlign: 'left',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  fontWeight: triggerAnswer === letter ? '600' : 'normal'
                                }}
                              >
                                <strong>{letter}.</strong> {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <textarea
                          className="form-input"
                          style={{ width: '100%', height: '80px', resize: 'none', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box' }}
                          placeholder="Ketik jawaban Anda..."
                          value={triggerAnswer}
                          onChange={(e) => setTriggerAnswer(e.target.value)}
                        />
                      )}
                      <button
                        className="btn-primary"
                        disabled={!triggerAnswer}
                        onClick={handleTriggerSubmit}
                        style={{
                          width: '100%',
                          background: !triggerAnswer ? '#94a3b8' : '#002D72',
                          cursor: !triggerAnswer ? 'not-allowed' : 'pointer',
                          padding: '10px',
                          border: 'none'
                        }}
                      >
                        Jawab & Lanjutkan Video ▶
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  *Anda wajib menonton hingga 100% sebelum kuis pasca-materi terbuka.
                </span>
                <button 
                  className="btn-primary"
                  disabled={playProgress < 100}
                  onClick={() => setStep(hasPostTest ? 'post-test' : 'result')}
                  style={{
                    background: playProgress < 100 ? 'var(--text3)' : '#002D72',
                    borderColor: playProgress < 100 ? 'var(--text3)' : '#002D72',
                    cursor: playProgress < 100 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {hasPostTest ? 'Lanjutkan ke Kuis Kategori SOP' : 'Selesaikan SOP'}
                </button>
              </div>
            </div>
          )}

          {/* STEP: POST-TEST */}
          {step === 'post-test' && (
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>📝 POST-TEST EVALUASI</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>
                    Standard Kelulusan Kuis: <strong style={{ color: 'var(--green)' }}>{passingScore}%</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {regularPostQuizzes.map((q, idx) => (
                    <div key={q.id} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text1)', marginBottom: '12px' }}>
                        {idx + 1}. {q.question}
                      </h4>
                      {q.isEssay ? (
                        <textarea
                          className="form-input"
                          style={{ height: '80px', resize: 'none', background: '#fff', fontSize: '14px' }}
                          placeholder="Ketik jawaban esai lengkap Anda di sini..."
                          value={postAnswers[q.id] || ''}
                          onChange={e => setPostAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        />
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {q.options.map((option, optIdx) => {
                            const optionChar = String.fromCharCode(65 + optIdx);
                            const isSelected = postAnswers[q.id] === optionChar || postAnswers[q.id] === option;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => setPostAnswers(prev => ({ ...prev, [q.id]: optionChar }))}
                                style={{
                                  padding: '10px 14px',
                                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                                  background: isSelected ? '#eff6ff' : '#ffffff',
                                  color: isSelected ? 'var(--accent)' : 'var(--text1)',
                                  borderRadius: '8px',
                                  textAlign: 'left',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  fontWeight: isSelected ? '600' : 'normal',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <strong>{optionChar}.</strong> {option}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button
                  className="btn-primary"
                  disabled={Object.keys(postAnswers).length < regularPostQuizzes.length}
                  onClick={handlePostSubmit}
                  style={{
                    background: Object.keys(postAnswers).length < regularPostQuizzes.length ? 'var(--text3)' : '#002D72',
                    borderColor: Object.keys(postAnswers).length < regularPostQuizzes.length ? 'var(--text3)' : '#002D72',
                    cursor: Object.keys(postAnswers).length < regularPostQuizzes.length ? 'not-allowed' : 'pointer'
                  }}
                >
                  Kirim Jawaban Kuis
                </button>
              </div>
            </div>
          )}

          {/* STEP: RESULT SCREEN */}
          {step === 'result' && (
            <div style={{ flex: 1, padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              {postScore === null ? (
                <>
                  <div style={{ fontSize: '64px', marginBottom: '14px' }}>⏳</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text1)', marginBottom: '8px' }}>
                    Jawaban Esai Berhasil Dikirim!
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text3)', maxWidth: '440px', lineHeight: '1.6', marginBottom: '24px' }}>
                    Jawaban Anda telah didistribusikan ke antrean penilaian HRD/Supervisor di <strong>LMS Admin</strong>. Sertifikat kelulusan akan diterbitkan secara otomatis setelah HRD memvalidasi dan memberi nilai di atas <strong>{passingScore}%</strong>.
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '64px', marginBottom: '14px' }}>
                    {postScore >= passingScore ? '🏆' : '⚠️'}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text1)', marginBottom: '8px' }}>
                    {postScore >= passingScore ? 'Luar Biasa, Anda Lulus!' : 'Nilai Belum Mencapai Standar'}
                  </h3>
                  <div style={{ 
                    display: 'inline-block',
                    padding: '8px 24px',
                    borderRadius: '50px',
                    fontSize: '18px',
                    fontWeight: '800',
                    background: postScore >= passingScore ? '#e6f4ea' : '#fce8e6',
                    color: postScore >= passingScore ? '#137333' : '#c5221f',
                    marginBottom: '16px'
                  }}>
                    Skor: {postScore}%
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text3)', maxWidth: '440px', lineHeight: '1.6', marginBottom: '24px' }}>
                    {postScore >= passingScore 
                      ? 'Selamat! Sertifikat kompetensi digital Anda telah terbit dan dapat diunduh di tab sertifikat.'
                      : `Minimal nilai kelulusan adalah ${passingScore}%. Silakan tonton ulang video SOP dan coba kuis kembali.`}
                  </p>
                </>
              )}

              <button className="btn-primary" onClick={onClose} style={{ padding: '10px 32px', background: '#002D72' }}>
                Kembali ke Beranda
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
