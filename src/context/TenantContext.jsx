import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDB, saveDB } from '../utils/db';
import { supabase } from '../utils/supabase';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

const mapRow = (row) => ({
  id: row.id,
  employeeName: row.employee_name,
  dept: row.dept,
  videoTitle: row.video_title,
  preScore: row.pre_score,
  postScore: row.post_score,
  date: row.submission_date,
  status: row.status,
  certStatus: row.cert_status,
  retakeCount: row.retake_count,
  supervisorNote: row.supervisor_note || '',
  supervisorName: row.supervisor_name,
  supervisorDate: row.supervisor_date,
  approvedBy: row.approved_by,
  approvedDate: row.approved_date,
  rejectionNote: row.rejection_note || '',
});

export const TenantProvider = ({ children }) => {
  const [db, setDb] = useState(() => getDB());
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'sop' | 'sertifikasi' | 'peringkat'
  const [quizSubmissions, setQuizSubmissions] = useState([]);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  // Listener to sync across tabs if hosted on same port/origin
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'axara_lms_db') {
        setDb(getDB());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Supabase: fetch quiz submissions for current user + realtime sync
  useEffect(() => {
    const userName = db.currentUser?.name;
    if (!userName) return;

    const fetchSubmissions = async () => {
      const { data } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('employee_name', userName)
        .order('created_at', { ascending: false });
      if (data) setQuizSubmissions(data.map(mapRow));
    };

    fetchSubmissions();

    const channel = supabase
      .channel('learner_quiz_submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_submissions' }, fetchSubmissions)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [db.currentUser?.name]);

  const updateProgress = (videoId, newProgress) => {
    setDb(prev => {
      const updatedVideos = prev.videos.map(v => {
        if (v.id === videoId) {
          return { ...v, progress: Math.max(v.progress, newProgress) };
        }
        return v;
      });
      return { ...prev, videos: updatedVideos };
    });
  };

  const addSubmission = async (submission) => {
    const existing = quizSubmissions.find(
      sub => sub.employeeName === submission.employeeName && sub.videoTitle === submission.videoTitle
    );

    if (existing) {
      await supabase.from('quiz_submissions').update({
        pre_score: submission.preScore,
        post_score: submission.postScore,
        submission_date: submission.date,
        status: submission.status,
        cert_status: 'pending',
      }).eq('id', existing.id);
    } else {
      await supabase.from('quiz_submissions').insert({
        employee_name: submission.employeeName,
        dept: submission.dept || db.currentUser?.dept,
        video_title: submission.videoTitle,
        pre_score: submission.preScore,
        post_score: submission.postScore,
        submission_date: submission.date,
        status: submission.status,
        cert_status: 'pending',
        retake_count: 0,
      });
    }

    // Add activity to local db
    const isPassed = submission.status === 'Lulus';
    const newAct = {
      id: Date.now(),
      text: `<strong>${submission.employeeName}</strong> menyelesaikan ${submission.videoTitle} dengan skor <strong>${submission.postScore}%</strong> (${submission.status})`,
      time: 'Baru saja',
      type: isPassed ? 'green' : 'amber'
    };
    setDb(prev => ({ ...prev, activities: [newAct, ...prev.activities] }));
  };

  const submitEssay = (essaySubmission) => {
    setDb(prev => {
      // Add or update pendingEssay
      const exists = prev.pendingEssays.some(
        e => e.employeeName === essaySubmission.employeeName && e.videoTitle === essaySubmission.videoTitle
      );

      let updatedPending;
      if (exists) {
        updatedPending = prev.pendingEssays.map(e => {
          if (e.employeeName === essaySubmission.employeeName && e.videoTitle === essaySubmission.videoTitle) {
            return { ...e, ...essaySubmission, id: e.id };
          }
          return e;
        });
      } else {
        updatedPending = [essaySubmission, ...prev.pendingEssays];
      }

      const newAct = {
        id: Date.now(),
        text: `<strong>${essaySubmission.employeeName}</strong> mengumpulkan jawaban esai untuk <strong>${essaySubmission.videoTitle}</strong>`,
        time: 'Baru saja',
        type: 'blue'
      };

      return {
        ...prev,
        pendingEssays: updatedPending,
        activities: [newAct, ...prev.activities]
      };
    });
  };

  const MAX_RETAKES = 3;

  const retakeQuiz = async (videoId, submissionId) => {
    const sub = quizSubmissions.find(s => s.id === submissionId);
    if (!sub) return;
    const newRetakeCount = (sub.retakeCount || 0) + 1;

    await supabase.from('quiz_submissions').update({
      cert_status: 'pending',
      retake_count: newRetakeCount,
    }).eq('id', submissionId);

    // Reset video progress in localStorage
    setDb(prev => ({
      ...prev,
      videos: prev.videos.map(v => v.id === videoId ? { ...v, progress: 0 } : v),
    }));

    // Optimistic update (realtime will also sync)
    setQuizSubmissions(prev => prev.map(s =>
      s.id === submissionId ? { ...s, certStatus: 'pending', retakeCount: newRetakeCount } : s
    ));
  };

  // Sync state between Admin and Learner
  const exportDBString = () => {
    return JSON.stringify(db, null, 2);
  };

  const importDBString = (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && parsed.quizSubmissions && parsed.pendingEssays) {
        setDb(parsed);
        saveDB(parsed);
        return { success: true };
      }
      return { success: false, error: 'Format JSON database tidak valid.' };
    } catch (e) {
      return { success: false, error: 'Gagal parse JSON: ' + e.message };
    }
  };

  const [tenant, setTenant] = useState(() => {
    return db.tenant || {
      name: 'PT Maju Bersama',
      plan: 'business',
      status: 'Aktif',
      avatar: 'MB',
      logo: null
    };
  });

  // Keep tenant state synced when db changes
  useEffect(() => {
    if (db.tenant) {
      setTenant(db.tenant);
    }
  }, [db]);

  return (
    <TenantContext.Provider value={{
      currentUser: db.currentUser,
      employees: db.employees,
      videos: db.videos,
      quizSubmissions,
      pendingEssays: db.pendingEssays,
      activities: db.activities,
      passingScore: db.passingScore,
      validityMonths: db.validityMonths,
      activePage,
      setActivePage,
      updateProgress,
      addSubmission,
      submitEssay,
      exportDBString,
      importDBString,
      setDb,
      tenant,
      retakeQuiz,
      MAX_RETAKES
    }}>
      {children}
    </TenantContext.Provider>
  );
};
