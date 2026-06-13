import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDB, saveDB } from '../utils/db';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const [db, setDb] = useState(() => getDB());
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'sop' | 'sertifikasi' | 'peringkat'

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

  const addSubmission = (submission) => {
    setDb(prev => {
      // Check if submission already exists for this employee and video
      const exists = prev.quizSubmissions.some(
        sub => sub.employeeName === submission.employeeName && sub.videoTitle === submission.videoTitle
      );
      
      let updatedSubmissions;
      if (exists) {
        updatedSubmissions = prev.quizSubmissions.map(sub => {
          if (sub.employeeName === submission.employeeName && sub.videoTitle === submission.videoTitle) {
            return { ...sub, ...submission, id: sub.id }; // Update scores
          }
          return sub;
        });
      } else {
        updatedSubmissions = [submission, ...prev.quizSubmissions];
      }

      // Add activity
      const isPassed = submission.status === 'Lulus';
      const newAct = {
        id: Date.now(),
        text: `<strong>${submission.employeeName}</strong> menyelesaikan ${submission.videoTitle} dengan skor <strong>${submission.postScore}%</strong> (${submission.status})`,
        time: 'Baru saja',
        type: isPassed ? 'green' : 'amber'
      };

      return {
        ...prev,
        quizSubmissions: updatedSubmissions,
        activities: [newAct, ...prev.activities]
      };
    });
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
      quizSubmissions: db.quizSubmissions,
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
      tenant
    }}>
      {children}
    </TenantContext.Provider>
  );
};
