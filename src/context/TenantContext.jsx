import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDB, saveDB } from '../utils/db';
import { supabase } from '../utils/supabase';
import larisiLogo from '../assets/logo-larisi.svg';

const fromDbRow = (row) => ({
  id: row.id,
  title: row.title,
  dept: row.dept,
  duration: row.duration,
  deadline: row.deadline || null,
  progress: row.progress || 0,
  views: row.views || 0,
  color: row.color || '#1e3a5f',
  tagClass: row.tag_class || 'dt-sales',
  type: row.type || 'video',
  videoUrl: row.video_url || null,
  filePath: row.file_path || null,
  slideImages: row.slide_images || null,
  slideCount: row.slide_count || null,
  preQuizzes: row.pre_quizzes || [],
  postQuizzes: row.post_quizzes || [],
  triggerQuizzes: row.trigger_quizzes || null,
  narasiMode: row.narasi_mode || null,
  slideNarasi: row.slide_narasi || null,
  archived: row.archived || false,
});

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
  approvalNote: row.approval_note || '',
  rejectionNote: row.rejection_note || '',
  essayScore: row.essay_score ?? null,
  essayGradedBy: row.essay_graded_by || '',
  essayGradedDate: row.essay_graded_date || '',
  acknowledged: row.acknowledged ?? false,
});

export const TenantProvider = ({ children, selectedEmployee }) => {
  const [db, setDb] = useState(() => {
    const stored = getDB();
    // Override currentUser dari selectedEmployee jika tersedia
    if (selectedEmployee) {
      const avatar = selectedEmployee.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      stored.currentUser = {
        id: selectedEmployee.email,
        name: selectedEmployee.name,
        email: selectedEmployee.email,
        dept: selectedEmployee.dept,
        city: selectedEmployee.city || '',
        role: 'employee',
        avatar,
        streak: 7,
      };
    }
    return stored;
  });
  const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' | 'sop' | 'sertifikasi' | 'peringkat'
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [videos, setVideos] = useState([]);
  const [userProgress, setUserProgress] = useState({});

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

  // Supabase: fetch SOP videos (video & PPT) + realtime sync
  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from('sop_videos')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setVideos(data.map(fromDbRow));
    };

    fetchVideos();

    const channel = supabase
      .channel('learner_sop_videos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sop_videos' }, fetchVideos)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Sync employees dari Supabase (supaya Learner selalu lihat data terbaru dari Admin)
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: true });
      if (!data || data.length === 0) return;
      const mapped = data.map((row, i) => ({
        id: i + 1,
        name: row.name,
        email: row.email,
        dept: row.dept,
        city: row.city || '',
        score: 0,
      }));
      setDb(prev => ({ ...prev, employees: mapped }));
    };

    const channel = supabase
      .channel('learner_employees')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchEmployees)
      .subscribe();

    fetchEmployees();
    return () => supabase.removeChannel(channel);
  }, []);

  // Sync passingScore & validityMonths dari Supabase app_settings (sama dengan Admin)
  useEffect(() => {
    supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['passing_score', 'validity_months'])
      .then(({ data }) => {
        if (!data) return;
        const updates = {};
        data.forEach(row => {
          if (row.key === 'passing_score')   updates.passingScore   = Number(row.value);
          if (row.key === 'validity_months') updates.validityMonths = Number(row.value);
        });
        if (Object.keys(updates).length > 0) setDb(prev => ({ ...prev, ...updates }));
      });
  }, []);

  // Supabase: fetch per-user video progress (Bug 1 fix — progress tidak lagi global)
  useEffect(() => {
    const userName = db.currentUser?.name;
    if (!userName) return;
    supabase
      .from('user_video_progress')
      .select('video_id, progress')
      .eq('employee_name', userName)
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach(row => { map[row.video_id] = row.progress; });
        setUserProgress(map);
      });
  }, [db.currentUser?.name]);

  const updateProgress = (videoId, newProgress) => {
    const userName = db.currentUser?.name;
    setUserProgress(prev => {
      const current = prev[videoId] ?? 0;
      const updated = Math.max(current, newProgress);
      if (userName) {
        supabase.from('user_video_progress').upsert({
          employee_name: userName,
          video_id: videoId,
          progress: updated,
          updated_at: new Date().toISOString(),
        });
      }
      return { ...prev, [videoId]: updated };
    });
  };

  const addSubmission = async (submission) => {
    const existing = quizSubmissions.find(
      sub => sub.employeeName === submission.employeeName && sub.videoTitle === submission.videoTitle
    );
    const isPassed = submission.status === 'Lulus';

    if (existing) {
      await supabase.from('quiz_submissions').update({
        pre_score: submission.preScore,
        post_score: submission.postScore,
        submission_date: submission.date,
        status: submission.status,
        cert_status: isPassed ? 'pending' : 'remedial',
        acknowledged: submission.acknowledged ?? true,
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
        cert_status: isPassed ? 'pending' : 'remedial',
        retake_count: 0,
        acknowledged: submission.acknowledged ?? true,
      });
    }

    // Add activity to local db
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
    if ((sub.retakeCount || 0) >= MAX_RETAKES) return;
    const newRetakeCount = (sub.retakeCount || 0) + 1;

    await supabase.from('quiz_submissions').update({
      retake_count: newRetakeCount,
    }).eq('id', submissionId);

    // Reset video progress per-user (Bug 1 fix)
    const userName = db.currentUser?.name;
    setUserProgress(prev => ({ ...prev, [videoId]: 0 }));
    if (userName) {
      supabase.from('user_video_progress').upsert({
        employee_name: userName,
        video_id: videoId,
        progress: 0,
        updated_at: new Date().toISOString(),
      });
    }

    // Optimistic update (realtime will also sync)
    setQuizSubmissions(prev => prev.map(s =>
      s.id === submissionId ? { ...s, retakeCount: newRetakeCount } : s
    ));
  };

  // Sync state between Admin and Learner
  const exportDBString = () => {
    return JSON.stringify(db, null, 2);
  };

  const importDBString = (jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        // Simpan logo ke localStorage terpisah agar tidak bloat DB
        if (parsed.tenant?.logo) {
          try { localStorage.setItem('axara_lms_logo', parsed.tenant.logo); } catch {}
          setTenant(prev => ({ ...prev, ...parsed.tenant }));
        }
        // Selective merge — videos sekarang dari Supabase, tidak perlu di-import
        setDb(prev => ({
          ...prev,
          ...(parsed.tenant && { tenant: { ...parsed.tenant, logo: undefined } }),
          ...(parsed.passingScore !== undefined && { passingScore: parsed.passingScore }),
          ...(parsed.validityMonths !== undefined && { validityMonths: parsed.validityMonths }),
          ...(parsed.employees && { employees: parsed.employees }),
          ...(parsed.pendingEssays && { pendingEssays: parsed.pendingEssays }),
          ...(parsed.activities && { activities: parsed.activities }),
        }));
        return { success: true };
      }
      return { success: false, error: 'Format JSON database tidak valid.' };
    } catch (e) {
      return { success: false, error: 'Gagal parse JSON: ' + e.message };
    }
  };

  const [tenant, setTenant] = useState(() => {
    const base = db.tenant || { name: 'PT Maju Bersama', plan: 'business', status: 'Aktif', avatar: 'MB' };
    return { ...base, logo: localStorage.getItem('axara_lms_logo') || base.logo || larisiLogo };
  });

  // Keep tenant state synced when db changes
  useEffect(() => {
    if (db.tenant) {
      setTenant({ ...db.tenant, logo: localStorage.getItem('axara_lms_logo') || db.tenant?.logo || larisiLogo });
    }
  }, [db]);

  const videosWithProgress = videos.map(v => ({ ...v, progress: userProgress[v.id] ?? 0 }));

  return (
    <TenantContext.Provider value={{
      currentUser: db.currentUser,
      employees: db.employees,
      videos: videosWithProgress,
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
