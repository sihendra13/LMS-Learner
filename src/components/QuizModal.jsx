import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../context/TenantContext';

export const QuizModal = ({ video, onClose }) => {
  const { currentUser, addSubmission, submitEssay, passingScore, updateProgress } = useTenant();

  // Learning wizard steps: 'pre-test' | 'video' | 'presentation' | 'post-test' | 'result'
  const isPpt = video.type === 'ppt';

  // Use Number() to handle both numeric 0 and string "0" from older saved data
  const isMidTrigger = (q) => { const t = Number(q.triggerTime); return !isNaN(t) && t > 0; };
  const midVideoTriggers = isPpt ? [] : [...(video.preQuizzes || []), ...(video.postQuizzes || [])].filter(isMidTrigger);
  const regularPreQuizzes = (video.preQuizzes || []).filter(q => !isMidTrigger(q));
  const regularPostQuizzes = (video.postQuizzes || []).filter(q => !isMidTrigger(q));
  const hasPreTest = regularPreQuizzes.length > 0;
  const hasPostTest = regularPostQuizzes.length > 0;

  const mediaStep = isPpt ? 'presentation' : 'video';
  const [step, setStep] = useState(() => hasPreTest ? 'pre-test' : mediaStep);
  
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
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight < 500));
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9);

  const touchStartX = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (document.fullscreenElement || window.isFullscreenActive) return;
      setIsMobile(window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight < 500));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force layout recalculation saat masuk presentation step
  // (flex container belum settle width-nya saat pertama render)
  useEffect(() => {
    if (step === 'presentation') {
      const t = setTimeout(() => {
        setIsMobile(window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight < 500));
      }, 80);
      return () => clearTimeout(t);
    }
  }, [step]);

  // Post-test state
  const [postAnswers, setPostAnswers] = useState({}); // { qId: answerValue (MCQ option or essay string) }
  const [postSubmitted, setPostSubmitted] = useState(false);
  const [postScore, setPostScore] = useState(0);

  const [isAckHovered, setIsAckHovered] = useState(false);
  const [isResultHovered, setIsResultHovered] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const [videoError, setVideoError] = useState(false);
  const [triggerToast, setTriggerToast] = useState(false);

  // Slideshow state untuk PPT custom player
  const [currentSlide, setCurrentSlide] = useState(0);
  const [maxSlideReached, setMaxSlideReached] = useState(0);

  // Kuis pemicu slide — muncul ketika user sampai di slide tertentu
  const slideTriggers = video.triggerQuizzes || [];
  const [answeredTriggerIds, setAnsweredTriggerIds] = useState([]);
  const [activeSlideTrigger, setActiveSlideTrigger] = useState(null);
  const [slideTriggerAnswer, setSlideTriggerAnswer] = useState('');

  // Auto-play & fullscreen untuk PPT
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(5);
  const presentationRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Narasi audio per slide
  const audioNarasiRef = useRef(null);

  const handleSlideTriggerSubmit = () => {
    setAnsweredTriggerIds(prev => [...prev, activeSlideTrigger.id]);
    setActiveSlideTrigger(null);
    setSlideTriggerAnswer('');
  };

  // Stop audio narasi saat slide berubah (playback dikontrol via <audio autoPlay>)
  useEffect(() => {
    return () => {
      if (audioNarasiRef.current) {
        audioNarasiRef.current.pause();
        audioNarasiRef.current = null;
      }
    };
  }, [currentSlide, step]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        window.isFullscreenActive = false;
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePresentationFullscreen = async () => {
    if (!isFullscreen) {
      try {
        window.isFullscreenActive = true;
        await presentationRef.current?.requestFullscreen?.();
        setIsFullscreen(true);
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (err) {}
    } else {
      document.exitFullscreen?.();
      window.isFullscreenActive = false;
      setIsFullscreen(false);
      if (screen.orientation && screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch (err) {}
      }
    }
  };

  const toggleVideoFullscreen = async () => {
    if (!isFullscreen) {
      try {
        window.isFullscreenActive = true;
        await videoContainerRef.current?.requestFullscreen?.();
        setIsFullscreen(true);
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (err) {}
    } else {
      document.exitFullscreen?.();
      window.isFullscreenActive = false;
      setIsFullscreen(false);
      if (screen.orientation && screen.orientation.unlock) {
        try { screen.orientation.unlock(); } catch (err) {}
      }
    }
  };

  // Auto-play timer untuk PPT (useEffect, bukan di dalam IIFE karena Rules of Hooks)
  useEffect(() => {
    if (!autoPlay || step !== 'presentation' || activeSlideTrigger) return;
    const slides = video.slideImages;
    const totalSlides = slides?.length || 0;
    if (currentSlide >= totalSlides - 1) { setAutoPlay(false); return; }
    const timer = setTimeout(() => {
      const next = currentSlide + 1;
      setCurrentSlide(next);
      setMaxSlideReached(prev => Math.max(prev, next));
      const trigger = slideTriggers.find(t => t.triggerSlide === next + 1 && !answeredTriggerIds.includes(t.id));
      if (trigger) {
        setActiveSlideTrigger(trigger);
        setSlideTriggerAnswer('');
        setAutoPlay(false);
      }
    }, autoPlaySpeed * 1000);
    return () => clearTimeout(timer);
  }, [autoPlay, autoPlaySpeed, step, currentSlide, activeSlideTrigger, answeredTriggerIds]);

  // Auto-play video when entering video step (after pre-test submission)
  useEffect(() => {
    if (step === 'video' && videoRef.current && video.videoUrl) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setVideoPlaying(true)).catch(() => {});
      }
    }
  }, [step]);

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
    setTriggerToast(true);
    setTimeout(() => {
      setTriggerToast(false);
      if (videoRef.current) videoRef.current.play();
      setVideoPlaying(true);
    }, 1500);
  };

  const handlePreSubmit = () => {
    let correct = 0;
    regularPreQuizzes.forEach((q, idx) => {
      if (preAnswers[idx] === q.answer) correct++;
    });
    const calculatedScore = regularPreQuizzes.length > 0 ? Math.round((correct / regularPreQuizzes.length) * 100) : 100;
    setPreScore(calculatedScore);
    setPreSubmitted(true);
    setTimeout(() => { setStep(mediaStep); }, 2000);
  };

  const handlePostSubmit = () => {
    const isEssayQuiz = regularPostQuizzes.some(q => q.isEssay || q.type === 'essay');

    if (isEssayQuiz) {
      const essayQuestions = regularPostQuizzes.map((q, idx) => ({
        id: q.id,
        question: q.question,
        answer: postAnswers[idx] || '',
        score: null
      }));

      const essaySubmission = {
        id: Date.now(),
        employeeName: currentUser.name,
        dept: currentUser.dept,
        videoTitle: video.title,
        date: new Date().toISOString(),
        questions: essayQuestions
      };

      submitEssay(essaySubmission);
      setPostSubmitted(true);
      setPostScore(null);
      setStep('result');
    } else {
      let correct = 0;
      regularPostQuizzes.forEach((q, idx) => {
        if (postAnswers[idx] === q.answer) correct++;
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
        date: new Date().toISOString(),
        acknowledged: true,
        status: isPassed ? 'Lulus' : 'Remedi (Butuh Ujian Ulang)'
      };

      addSubmission(newSubmission);
      setStep('result');
    }
  };

  const isInActiveQuiz = (step === 'pre-test' && !preSubmitted) || (step === 'post-test' && !postSubmitted);

  const handleClose = () => {
    if (isInActiveQuiz) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="wizard-modal" onClick={handleClose}>
      <div className="wizard-card" onClick={e => e.stopPropagation()}>
        {/* Wizard Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text1)' }}>
              {isPpt ? '📊' : '🎥'} SOP: {video.title}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
              Divisi {video.dept} · {isPpt ? `${video.slideCount || '?'} slide` : `Durasi ${video.duration}`}
            </span>
          </div>
          <button style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text3)' }} onClick={handleClose}>✕</button>
        </div>

        {/* Wizard Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* STEP: PRE-TEST */}
          {step === 'pre-test' && (
            <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>📝 PRE-TEST KUIS</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>{isPpt ? 'Selesaikan sebelum melihat presentasi' : 'Selesaikan sebelum menonton video'}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {regularPreQuizzes.map((q, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text1)', marginBottom: '12px' }}>
                        {idx + 1}. {q.question}
                      </h4>
                      {q.type === 'essay' ? (
                        <textarea
                          className="form-input"
                          style={{ height: '80px', resize: 'none', background: '#fff', fontSize: '14px' }}
                          placeholder="Ketik jawaban esai Anda di sini..."
                          value={preAnswers[idx] || ''}
                          onChange={e => setPreAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                        />
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {q.options.map((option, optIdx) => {
                            const optionChar = String.fromCharCode(65 + optIdx);
                            const isSelected = preAnswers[idx] === optionChar;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => setPreAnswers(prev => ({ ...prev, [idx]: optionChar }))}
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

              <div style={{ 
                flexShrink: 0,
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                justifyContent: isMobile ? 'center' : 'flex-end', 
                alignItems: isMobile ? 'stretch' : 'center', 
                borderTop: '1px solid var(--border)', 
                padding: isMobile ? '16px' : '16px 24px',
                background: '#fff',
                gap: isMobile ? '12px' : '0',
                zIndex: 10
              }}>
                {preSubmitted ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontWeight: '600', fontSize: '13px', textAlign: 'center', justifyContent: 'center', width: '100%' }}>
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
                      cursor: Object.keys(preAnswers).length < regularPreQuizzes.length ? 'not-allowed' : 'pointer',
                      width: isMobile ? '100%' : 'auto',
                      padding: '10px 16px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {isPpt ? 'Kirim Pre-Test & Buka Presentasi' : 'Kirim Pre-Test & Lanjutkan'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP: VIDEO PLAYER */}
          {step === 'video' && (
            <div style={{ flex: 1, padding: isMobile ? (window.innerHeight < 500 ? '8px 16px 4px' : '16px') : '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
              <div 
                ref={videoContainerRef} 
                className="video-player-container"
                style={{ 
                  width: '100%',
                  height: isFullscreen ? '100%' : 'auto',
                  maxWidth: isFullscreen ? 'none' : '100%',
                  aspectRatio: isFullscreen ? 'auto' : videoAspectRatio,
                  maxHeight: isFullscreen ? 'none' : (isMobile ? (window.innerHeight < 500 ? 'calc(100vh - 110px)' : '50vh') : 'none'),
                  background: '#090f1d', 
                  borderRadius: isFullscreen ? '0px' : '12px', 
                  position: 'relative', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  overflow: 'hidden',
                  flex: isFullscreen ? 1 : (isMobile ? (window.innerHeight < 500 ? 1 : 'none') : 1),
                  margin: '0 auto'
                }}
              >
 
                {video.videoUrl && !videoError ? (
                  /* Real video player */
                  <video
                    ref={videoRef}
                    src={video.videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onSeeking={handleSeeking}
                    onEnded={handleVideoEnded}
                    onPlay={() => setVideoPlaying(true)}
                    onPause={() => setVideoPlaying(false)}
                    onError={() => setVideoError(true)}
                    onLoadedMetadata={(e) => {
                      if (e.target.videoWidth && e.target.videoHeight) {
                        setVideoAspectRatio(e.target.videoWidth / e.target.videoHeight);
                      }
                    }}
                    controls={!activeTrigger}
                    controlsList="nodownload nofullscreen"
                    style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'contain', pointerEvents: activeTrigger ? 'none' : 'auto', display: activeTrigger ? 'none' : 'block' }}
                  />
                ) : video.videoUrl && videoError ? (
                  /* Video URL exists but file not found */
                  <div style={{ textAlign: 'center', color: '#fff', zIndex: 2, padding: '24px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>Video Tidak Dapat Dimuat</h4>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', maxWidth: '280px' }}>
                      File video belum tersedia di server. Silakan hubungi Admin untuk mengunggah ulang video ini.
                    </p>
                  </div>
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

                {(!isMobile || isFullscreen) && activeTrigger && (
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

                {triggerToast && (
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#002D72',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 20,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                  }}>
                    ✓ Jawaban tersimpan! Video dilanjutkan...
                  </div>
                )}

                {/* Tombol fullscreen video */}
                {!activeTrigger && (
                  <button
                    onClick={toggleVideoFullscreen}
                    title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 5, backdropFilter: 'blur(4px)' }}
                  >
                    {isFullscreen ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row', 
                justifyContent: 'space-between', 
                alignItems: isMobile ? 'stretch' : 'center', 
                marginTop: '16px', 
                borderTop: '1px solid var(--border)', 
                paddingTop: '16px',
                gap: isMobile ? '12px' : '0',
                textAlign: isMobile ? 'center' : 'left'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  *Anda wajib menonton hingga 100% sebelum kuis pasca-materi terbuka.
                </span>
                <button
                  className="btn-primary"
                  disabled={playProgress < 100}
                  onClick={() => setStep('acknowledge')}
                  style={{
                    background: playProgress < 100 ? 'var(--text3)' : '#002D72',
                    borderColor: playProgress < 100 ? 'var(--text3)' : '#002D72',
                    cursor: playProgress < 100 ? 'not-allowed' : 'pointer',
                    width: isMobile ? '100%' : 'auto',
                    padding: '10px 16px',
                    boxSizing: 'border-box'
                  }}
                >
                  {hasPostTest ? 'Lanjutkan ke Kuis Kategori SOP' : 'Selesaikan SOP'}
                </button>
              </div>

              {isMobile && !isFullscreen && activeTrigger && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(9,15,29,0.96)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '16px',
                  zIndex: 20
                }}>
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 16px', maxWidth: '480px', width: '100%', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
                      📋 Kuis — Video Dijeda Sementara
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px', lineHeight: '1.4' }}>
                      {activeTrigger.question}
                    </h4>
                    {activeTrigger.options && activeTrigger.options.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '20px' }}>
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
          )}

          {/* STEP: PPT PRESENTATION PLAYER (Custom slideshow dari slideImages array) */}
          {step === 'presentation' && (
            (() => {
              const slides = video.slideImages;
            const totalSlides = slides ? slides.length : 0;

            const goToSlide = (idx) => {
              if (activeSlideTrigger) return;
              // Blokir loncat ke slide yang belum pernah dijangkau (sequential, sama seperti video)
              if (idx > maxSlideReached + 1) return;
              const clamped = Math.max(0, Math.min(idx, totalSlides - 1));
              setCurrentSlide(clamped);
              if (clamped > maxSlideReached) setMaxSlideReached(clamped);
              // Cek apakah slide tujuan punya kuis pemicu yang belum dijawab
              const trigger = slideTriggers.find(
                t => t.triggerSlide === clamped + 1 && !answeredTriggerIds.includes(t.id)
              );
              if (trigger) {
                setActiveSlideTrigger(trigger);
                setSlideTriggerAnswer('');
              }
            };

            const handleTouchStart = (e) => {
              touchStartX.current = e.touches[0].clientX;
            };

            const handleTouchEnd = (e) => {
              if (touchStartX.current === null) return;
              const diffX = touchStartX.current - e.changedTouches[0].clientX;
              const minSwipeDistance = 50;

              if (diffX > minSwipeDistance) {
                if (currentSlide < totalSlides - 1) {
                  goToSlide(currentSlide + 1);
                  setAutoPlay(false);
                }
              } else if (diffX < -minSwipeDistance) {
                if (currentSlide > 0) {
                  goToSlide(currentSlide - 1);
                  setAutoPlay(false);
                }
              }
              touchStartX.current = null;
            };

            const hasSeenAll = totalSlides === 0 || (maxSlideReached >= totalSlides - 1 && !activeSlideTrigger);

            if (!slides || slides.length === 0) {
              return (
                <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, borderRadius: '12px', border: '1px solid var(--border)', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#1e1b4b' }}>{video.title}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '280px', textAlign: 'center', lineHeight: '1.6' }}>
                      Slide belum diproses. Hubungi Admin untuk mengunggah ulang file PPTX.
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <button className="btn-primary" onClick={() => setStep('acknowledge')} style={{ background: '#002D72', cursor: 'pointer' }}>
                      {hasPostTest ? 'Selesai → Kuis Post-Test' : 'Selesaikan Materi'}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div ref={presentationRef} className="presentation-player-container" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: isFullscreen ? '0px' : '16px 0px 0px', background: isFullscreen ? '#0f172a' : 'transparent', position: 'relative' }}>
                {/* Scrollable content: slide + thumbnail + narasi. Toolbar is OUTSIDE this div so it's always visible */}
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', WebkitOverflowScrolling: 'touch', padding: 0 }}>
                {/* Slide viewer — wrapper div tanpa overflow:hidden agar fullscreen button tidak ter-clip */}
                <div style={{ flex: 1, position: 'relative', minHeight: isFullscreen ? 'none' : (isMobile ? (window.innerHeight < 500 ? '160px' : '220px') : '360px'), marginLeft: isFullscreen ? '0px' : (isMobile ? '16px' : '24px'), marginRight: isFullscreen ? '0px' : (isMobile ? '16px' : '24px') }}>
                  {/* Inner div dengan overflow:hidden untuk border-radius & image clipping */}
                  <div 
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    style={{ position: 'absolute', inset: 0, background: '#1e1b4b', borderRadius: isFullscreen ? '0px' : '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img
                      key={currentSlide}
                      src={slides[currentSlide]}
                      alt={`Slide ${currentSlide + 1}`}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', userSelect: 'none' }}>
                      {currentSlide + 1} / {totalSlides}
                    </div>

                    {/* OVERLAY KUIS PEMICU SLIDE */}
                    {(!isMobile || isFullscreen) && activeSlideTrigger && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(9,15,29,0.92)', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px', zIndex: 10, overflowY: 'auto' }}>
                        <div style={{ background: '#ffffff', borderRadius: '12px', padding: isMobile ? '16px 20px' : '24px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', boxSizing: 'border-box', margin: 'auto 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#b45309' }}>
                              ⚡ KUIS SLIDE {currentSlide + 1}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Jawab dulu untuk lanjut ke slide berikutnya</div>
                          </div>
                          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '16px', lineHeight: '1.4' }}>
                            {activeSlideTrigger.question}
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                            {(activeSlideTrigger.options || []).map((opt, oi) => {
                              const letter = String.fromCharCode(65 + oi);
                              const isSelected = slideTriggerAnswer === letter;
                              return (
                                <button
                                  key={oi}
                                  onClick={() => setSlideTriggerAnswer(letter)}
                                  style={{
                                    padding: '10px 14px', border: isSelected ? '2px solid #b45309' : '1px solid #e2e8f0',
                                    background: isSelected ? '#fffbeb' : '#f8fafc', color: isSelected ? '#92400e' : '#0f172a',
                                    borderRadius: '8px', textAlign: 'left', fontSize: '13px',
                                    cursor: 'pointer', fontWeight: isSelected ? '600' : 'normal'
                                  }}
                                >
                                  <strong>{letter}.</strong> {opt}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={handleSlideTriggerSubmit}
                            disabled={!slideTriggerAnswer}
                            style={{
                              width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px',
                              background: slideTriggerAnswer ? '#b45309' : '#94a3b8',
                              color: '#fff', cursor: slideTriggerAnswer ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Jawab & Lanjutkan Presentasi ›
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tombol prev */}
                  {currentSlide > 0 && !activeSlideTrigger && (
                    <button
                      onClick={() => { goToSlide(currentSlide - 1); setAutoPlay(false); }}
                      style={{ 
                        position: 'absolute', 
                        left: isMobile ? '8px' : '24px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        background: isMobile ? 'rgba(15, 23, 42, 0.45)' : 'rgba(0,0,0,0.65)', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: isMobile ? '36px' : '52px', 
                        height: isMobile ? '36px' : '52px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#fff', 
                        backdropFilter: 'blur(2px)', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', 
                        zIndex: 10,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg width={isMobile ? '16' : '24'} height={isMobile ? '16' : '24'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                    </button>
                  )}
                  {/* Tombol next */}
                  {currentSlide < totalSlides - 1 && !activeSlideTrigger && (
                    <button
                      onClick={() => { goToSlide(currentSlide + 1); setAutoPlay(false); }}
                      style={{ 
                        position: 'absolute', 
                        right: isMobile ? '8px' : '24px', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        background: isMobile ? 'rgba(15, 23, 42, 0.45)' : 'rgba(0,0,0,0.65)', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: isMobile ? '36px' : '52px', 
                        height: isMobile ? '36px' : '52px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#fff', 
                        backdropFilter: 'blur(2px)', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)', 
                        zIndex: 10,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <svg width={isMobile ? '16' : '24'} height={isMobile ? '16' : '24'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  )}
                  {/* Tombol fullscreen */}
                  {!activeSlideTrigger && (
                    <button
                      onClick={togglePresentationFullscreen}
                      title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
                      style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', zIndex: 20, backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                    >
                      {isFullscreen ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 0 2-2h3M3 16h3a2 2 0 0 0 2 2v3"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Thumbnail strip */}
                <div style={{ overflowX: 'auto', flexShrink: 0, padding: '10px 0', WebkitOverflowScrolling: 'touch', width: 'auto', marginLeft: isFullscreen ? '0px' : (isMobile ? '16px' : '24px'), marginRight: isFullscreen ? '0px' : (isMobile ? '16px' : '24px') }}>
                  <div style={{ display: 'flex', gap: '6px', width: 'max-content' }}>
                    {slides.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        style={{
                          width: '60px', height: '40px',
                          border: i === currentSlide ? '2px solid #7c3aed' : '2px solid transparent',
                          borderRadius: '4px', overflow: 'hidden', padding: 0,
                          opacity: i > maxSlideReached + 1 ? 0.35 : 1, background: '#e2e8f0',
                          cursor: i > maxSlideReached + 1 ? 'not-allowed' : 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <img src={url} alt={`${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Narasi per slide */}
                {(() => {
                  const narasi = video.slideNarasi?.[currentSlide];
                  const mode = video.narasiMode;
                  if (!narasi || !mode || mode === 'none') return null;
                  const hasTeks = (mode === 'teks' || mode === 'keduanya') && narasi.teks;
                  const hasAudio = (mode === 'audio' || mode === 'keduanya') && narasi.audioUrl;
                  if (!hasTeks && !hasAudio) return null;
                  return (
                    <div style={{ margin: isMobile ? '8px 16px' : '8px 24px', padding: '12px 16px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                        🎙️ NARASI SLIDE {currentSlide + 1}
                      </div>
                      {hasTeks && (
                        <p style={{ fontSize: '13px', color: 'var(--text1)', lineHeight: '1.6', margin: 0, marginBottom: hasAudio ? '10px' : 0, maxHeight: '80px', overflowY: 'auto' }}>
                          {narasi.teks}
                        </p>
                      )}
                      {hasAudio && (
                        <audio
                          key={`audio-${currentSlide}`}
                          controls
                          src={narasi.audioUrl}
                          style={{ width: '100%', height: '36px', display: 'block', marginTop: hasTeks ? '8px' : 0 }}
                          autoPlay
                          onError={() => {}}
                        />
                      )}
                    </div>
                  );
                })()}
                </div>{/* end scrollable content area */}

                <div style={{
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: isMobile ? (window.innerHeight < 500 ? 'row' : 'column') : 'row',
                  alignItems: isMobile ? (window.innerHeight < 500 ? 'center' : 'stretch') : 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderTop: `1px solid ${isFullscreen ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`,
                  paddingTop: '12px',
                  paddingBottom: '16px',
                  paddingLeft: isMobile ? '16px' : '24px',
                  paddingRight: isMobile ? '16px' : '24px'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: isFullscreen ? '#94a3b8' : 'var(--text3)', 
                    textAlign: isMobile ? (window.innerHeight < 500 ? 'left' : 'center') : 'left',
                    flex: isMobile ? (window.innerHeight < 500 ? 1 : 'none') : 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {hasSeenAll ? 'Semua slide selesai.' : 'Tonton hingga slide terakhir.'}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? (window.innerHeight < 500 ? 'row' : 'column') : 'row',
                    alignItems: isMobile ? (window.innerHeight < 500 ? 'center' : 'stretch') : 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end',
                    flexShrink: 0
                  }}>
                    {!activeSlideTrigger && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        justifyContent: isMobile ? (window.innerHeight < 500 ? 'flex-start' : 'space-between') : 'flex-start'
                      }}>
                        <select
                          value={autoPlaySpeed}
                          onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
                          disabled={autoPlay}
                          style={{ 
                            height: '36px', 
                            fontSize: '12px', 
                            padding: '0 32px 0 10px',
                            borderRadius: '6px',
                            border: isFullscreen ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)',
                            backgroundColor: isFullscreen ? 'rgba(255,255,255,0.08)' : '#fff',
                            color: isFullscreen ? '#fff' : 'var(--text2)',
                            cursor: 'pointer',
                            boxSizing: 'border-box',
                            flex: isMobile ? (window.innerHeight < 500 ? 'none' : 1) : 'none'
                          }}
                        >
                          <option value={3} style={{ background: isFullscreen ? '#1e293b' : '#fff', color: isFullscreen ? '#fff' : '#000' }}>Tiap 3 detik</option>
                          <option value={5} style={{ background: isFullscreen ? '#1e293b' : '#fff', color: isFullscreen ? '#fff' : '#000' }}>Tiap 5 detik</option>
                          <option value={8} style={{ background: isFullscreen ? '#1e293b' : '#fff', color: isFullscreen ? '#fff' : '#000' }}>Tiap 8 detik</option>
                          <option value={10} style={{ background: isFullscreen ? '#1e293b' : '#fff', color: isFullscreen ? '#fff' : '#000' }}>Tiap 10 detik</option>
                        </select>
                        <button
                          onClick={() => setAutoPlay(prev => !prev)}
                          style={{ 
                            height: '36px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '5px', 
                            padding: '0 14px', 
                            borderRadius: '8px', 
                            border: isFullscreen ? '1px solid rgba(255,255,255,0.15)' : 'none', 
                            background: autoPlay ? '#7c3aed' : (isFullscreen ? 'rgba(255,255,255,0.08)' : '#f3f0ff'), 
                            color: autoPlay ? '#fff' : (isFullscreen ? '#fff' : '#7c3aed'), 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            cursor: 'pointer', 
                            whiteSpace: 'nowrap', 
                            boxSizing: 'border-box',
                            flex: isMobile ? (window.innerHeight < 500 ? 'none' : 1) : 'none'
                          }}
                        >
                          {autoPlay ? '⏸ Pause' : '▶ Auto Play'}
                        </button>
                      </div>
                    )}
                    <button
                      className="btn-primary"
                      disabled={!hasSeenAll}
                      onClick={() => { setAutoPlay(false); setStep('acknowledge'); }}
                      style={{ 
                        whiteSpace: 'nowrap', 
                        background: hasSeenAll ? (isFullscreen ? '#2563eb' : '#002D72') : (isFullscreen ? 'rgba(255,255,255,0.08)' : '#94a3b8'), 
                        borderColor: hasSeenAll ? (isFullscreen ? '#2563eb' : '#002D72') : (isFullscreen ? 'transparent' : '#94a3b8'), 
                        color: hasSeenAll ? '#fff' : (isFullscreen ? 'rgba(255,255,255,0.3)' : '#fff'),
                        cursor: hasSeenAll ? 'pointer' : 'not-allowed',
                        width: isMobile ? (window.innerHeight < 500 ? 'auto' : '100%') : 'auto',
                        padding: '10px 16px',
                        boxSizing: 'border-box',
                        textAlign: 'center'
                      }}
                    >
                      {hasPostTest ? 'Selesai → Post-Test' : 'Selesaikan Materi'}
                    </button>
                  </div>
                </div>

                {isMobile && !isFullscreen && activeSlideTrigger && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(9,15,29,0.96)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '16px',
                    zIndex: 20,
                    overflowY: 'auto'
                  }}>
                    <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px 16px', maxWidth: '480px', width: '100%', boxSizing: 'border-box', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', margin: 'auto 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', color: '#b45309' }}>
                          ⚡ KUIS SLIDE {currentSlide + 1}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Jawab dulu untuk lanjut</div>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '16px', lineHeight: '1.4' }}>
                        {activeSlideTrigger.question}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '20px' }}>
                        {(activeSlideTrigger.options || []).map((opt, oi) => {
                          const letter = String.fromCharCode(65 + oi);
                          const isSelected = slideTriggerAnswer === letter;
                          return (
                            <button
                              key={oi}
                              onClick={() => setSlideTriggerAnswer(letter)}
                              style={{
                                padding: '10px 14px', border: isSelected ? '2px solid #b45309' : '1px solid #e2e8f0',
                                background: isSelected ? '#fffbeb' : '#f8fafc', color: isSelected ? '#92400e' : '#0f172a',
                                borderRadius: '8px', textAlign: 'left', fontSize: '13px',
                                cursor: 'pointer', fontWeight: isSelected ? '600' : 'normal'
                              }}
                            >
                              <strong>{letter}.</strong> {opt}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={handleSlideTriggerSubmit}
                        disabled={!slideTriggerAnswer}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '13px',
                          background: slideTriggerAnswer ? '#b45309' : '#94a3b8',
                          color: '#fff', cursor: slideTriggerAnswer ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Jawab & Lanjutkan Presentasi ›
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}

          {/* STEP: ACKNOWLEDGE */}
          {step === 'acknowledge' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px 24px', textAlign: 'center' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text1)', marginBottom: '10px' }}>Konfirmasi Pemahaman Materi</div>
              <div style={{ fontSize: '13.5px', color: 'var(--text2)', lineHeight: '1.7', marginBottom: '28px', maxWidth: '380px' }}>
                Dengan melanjutkan, saya menyatakan telah menonton dan memahami materi:<br />
                <div style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginTop: '12px',
                  fontWeight: '600',
                  color: 'var(--text1)',
                  fontSize: '13px'
                }}>
                  "{video.title}"
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={() => setStep(hasPostTest ? 'post-test' : 'result')}
                style={{
                  background: isAckHovered ? 'var(--accent)' : 'var(--navy)',
                  borderColor: isAckHovered ? 'var(--accent)' : 'var(--navy)',
                  padding: '12px 32px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto',
                  borderRadius: '8px',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: isAckHovered ? '0 4px 12px rgba(47, 123, 255, 0.25)' : 'none'
                }}
                onMouseEnter={() => setIsAckHovered(true)}
                onMouseLeave={() => setIsAckHovered(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saya Konfirmasi & Lanjutkan
              </button>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '16px' }}>
                Pernyataan ini dicatat sebagai bukti kehadiran pelatihan Anda.
              </div>
            </div>
          )}

          {/* STEP: POST-TEST */}
          {step === 'post-test' && (
            <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>📝 POST-TEST EVALUASI</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600' }}>
                    Standard Kelulusan Kuis: <strong style={{ color: 'var(--green)' }}>{passingScore}%</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {regularPostQuizzes.map((q, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text1)', marginBottom: '12px' }}>
                        {idx + 1}. {q.question}
                      </h4>
                      {(q.type === 'essay' || q.isEssay) ? (
                        <textarea
                          className="form-input"
                          style={{ height: '80px', resize: 'none', background: '#fff', fontSize: '14px' }}
                          placeholder="Ketik jawaban esai lengkap Anda di sini..."
                          value={postAnswers[idx] || ''}
                          onChange={e => setPostAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                        />
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {q.options.map((option, optIdx) => {
                            const optionChar = String.fromCharCode(65 + optIdx);
                            const isSelected = postAnswers[idx] === optionChar;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => setPostAnswers(prev => ({ ...prev, [idx]: optionChar }))}
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

              <div style={{ 
                flexShrink: 0,
                display: 'flex', 
                justifyContent: isMobile ? 'center' : 'flex-end', 
                borderTop: '1px solid var(--border)', 
                padding: isMobile ? '16px' : '16px 24px',
                background: '#fff',
                zIndex: 10
              }}>
                <button
                  className="btn-primary"
                  disabled={Object.keys(postAnswers).length < regularPostQuizzes.length}
                  onClick={handlePostSubmit}
                  style={{
                    background: Object.keys(postAnswers).length < regularPostQuizzes.length ? 'var(--text3)' : '#002D72',
                    borderColor: Object.keys(postAnswers).length < regularPostQuizzes.length ? 'var(--text3)' : '#002D72',
                    cursor: Object.keys(postAnswers).length < regularPostQuizzes.length ? 'not-allowed' : 'pointer',
                    width: isMobile ? '100%' : 'auto',
                    padding: '10px 16px',
                    boxSizing: 'border-box'
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
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7V2M5 22v-4a7 7 0 0 1 7-7 7 7 0 0 1 7 7v4" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text1)', marginBottom: '8px' }}>
                {postScore === null ? 'Jawaban Berhasil Dikirim!' : `Kuis Selesai — Skor Anda: ${postScore}%`}
              </h3>

              {/* Pending verification notice */}
              <div style={{
                background: 'linear-gradient(to bottom right, #fffdf5, #fffbeb)',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '18px 22px',
                maxWidth: '440px',
                marginBottom: '24px',
                textAlign: 'left',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)'
              }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Menunggu Verifikasi HRD
                </div>
                <p style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.6', margin: 0 }}>
                  {postScore === null
                    ? 'Jawaban esai Anda sedang dalam antrean penilaian oleh HRD/Supervisor.'
                    : 'Hasil kuis Anda sudah tercatat. Sertifikat akan diterbitkan setelah HRD memverifikasi dan menyetujuinya.'
                  }
                  {' '}Anda akan dapat melihat status di halaman <strong>Sertifikat</strong>.
                </p>
              </div>

              {postScore !== null && (
                <div style={{
                  display: 'inline-flex', gap: '24px', padding: '12px 24px',
                  background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px',
                  marginBottom: '24px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>Skor Kuis</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: postScore >= passingScore ? '#16a34a' : '#dc2626' }}>
                      {postScore}%
                    </div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '2px' }}>Standar Lulus</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text2)' }}>{passingScore}%</div>
                  </div>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={onClose}
                style={{
                  padding: '12px 36px',
                  background: isResultHovered ? 'var(--accent)' : 'var(--navy)',
                  borderColor: isResultHovered ? 'var(--accent)' : 'var(--navy)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isResultHovered ? '0 4px 12px rgba(47, 123, 255, 0.25)' : 'none'
                }}
                onMouseEnter={() => setIsResultHovered(true)}
                onMouseLeave={() => setIsResultHovered(false)}
              >
                Kembali ke Beranda
              </button>
            </div>
          )}

        </div>

        {/* Close Confirmation Overlay */}
        {showCloseConfirm && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'inherit', zIndex: 10
          }}>
            <div style={{
              background: 'var(--card)', borderRadius: '14px', padding: '28px 32px',
              maxWidth: '340px', width: '90%', textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.28)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text1)', margin: '0 0 8px' }}>
                Keluar dari kuis?
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text3)', margin: '0 0 24px', lineHeight: '1.5' }}>
                Jawaban yang sudah diisi akan hilang. Kamu harus mengulang dari awal.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px',
                    fontWeight: '600', cursor: 'pointer',
                    background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)'
                  }}
                >
                  Lanjut Kuis
                </button>
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', fontSize: '14px',
                    fontWeight: '700', cursor: 'pointer',
                    background: '#dc2626', border: 'none', color: '#fff'
                  }}
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
