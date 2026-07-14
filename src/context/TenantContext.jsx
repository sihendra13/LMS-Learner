import React, { createContext, useState, useContext, useEffect } from 'react';
import { getDB, saveDB } from '../utils/db';
import { supabase } from '../utils/supabase';
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

export const TenantProvider = ({ children, selectedEmployee, authUser }) => {
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
  const [readIds, setReadIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('axara_learner_notif_read') || '[]')); }
    catch { return new Set(); }
  });
  const [toast, setToast] = useState(null);
  const prevNotificationsRef = React.useRef([]);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  // Subscribe to Web Push notifications after login
  useEffect(() => {
    const userEmail = db.currentUser?.email;
    if (!userEmail) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const subscribeToPush = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) return;

        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const urlBase64ToUint8Array = (base64String) => {
          const padding = '='.repeat((4 - base64String.length % 4) % 4);
          const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
          return outputArray;
        };

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const subJson = subscription.toJSON();
        await supabase.from('push_subscriptions').upsert({
          user_email: userEmail,
          endpoint: subJson.endpoint,
          keys_p256dh: subJson.keys.p256dh,
          keys_auth: subJson.keys.auth,
        }, { onConflict: 'endpoint' });
      } catch (err) {
        console.warn('Push subscription failed:', err);
      }
    };

    subscribeToPush();
  }, [db.currentUser?.email]);

  // Sync read status from Supabase for Learner
  useEffect(() => {
    if (!db.currentUser?.email) return;
    supabase
      .from('notification_reads')
      .select('read_keys')
      .eq('user_id', db.currentUser.email)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.read_keys?.length) {
          const keys = new Set(data.read_keys);
          setReadIds(keys);
          localStorage.setItem('axara_learner_notif_read', JSON.stringify([...keys]));
        }
      });
  }, [db.currentUser?.email]);

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
        .eq('is_draft', false)
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

  // Sync passingScore & validityMonths dari Supabase dipindahkan ke dalam efek authUser
  // untuk mencegah race condition.

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
        cert_status: 'pending',
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
        cert_status: 'pending',
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

    // Trigger SPV Notification Email via Backend
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://axara-lms-backend.onrender.com';
      const token = localStorage.getItem('axara_token') || '';
      await fetch(`${BACKEND_URL}/api/v1/notifications/email-spv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dept: submission.dept || db.currentUser?.dept,
          learnerName: submission.employeeName,
          videoTitle: submission.videoTitle
        })
      });
    } catch (err) {
      console.error('Failed to trigger SPV email notification:', err);
    }
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

    // Trigger SPV Notification Email via Backend
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://axara-lms-backend.onrender.com';
      const token = localStorage.getItem('axara_token') || '';
      fetch(`${BACKEND_URL}/api/v1/notifications/email-spv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          dept: essaySubmission.dept || db.currentUser?.dept,
          learnerName: essaySubmission.employeeName,
          videoTitle: essaySubmission.videoTitle
        })
      });
    } catch (err) {
      console.error('Failed to trigger SPV email notification for essay:', err);
    }
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
    const base = db.tenant || { name: 'Perusahaan Anda', plan: 'business', status: 'Aktif', avatar: 'PA' };
    return { ...base, logo: localStorage.getItem('axara_lms_logo') || base.logo || null };
  });

  const [companyLogo, setCompanyLogo] = useState(null);

  // Fetch tenant name + company_logo via authUser → users table → tenants table
  useEffect(() => {
    if (!authUser?.id) return;
    supabase.from('users').select('tenant_id').eq('id', authUser.id).single()
      .then(({ data: user }) => {
        const tenantId = user?.tenant_id;
        
        // Load global settings first, then override with per-tenant settings
        supabase.from('app_settings').select('key, value').in('key', ['passing_score', 'validity_months'])
          .then(({ data: appData }) => {
            const updates = {};
            if (appData) {
              appData.forEach(row => {
                if (row.key === 'passing_score')   updates.passingScore   = Number(row.value);
                if (row.key === 'validity_months') updates.validityMonths = Number(row.value);
              });
            }
            
            // Build query for tenant_settings
            if (tenantId) {
              supabase.from('tenant_settings').select('passing_score, validity_months').eq('tenant_id', tenantId).single()
                .then(({ data: tSettings }) => {
                  if (tSettings) {
                    if (tSettings.passing_score != null) updates.passingScore = tSettings.passing_score;
                    if (tSettings.validity_months != null) updates.validityMonths = tSettings.validity_months;
                  }
                  if (Object.keys(updates).length > 0) setDb(prev => ({ ...prev, ...updates }));
                })
                .catch(() => {
                  if (Object.keys(updates).length > 0) setDb(prev => ({ ...prev, ...updates }));
                });
            } else {
              if (Object.keys(updates).length > 0) setDb(prev => ({ ...prev, ...updates }));
            }
          });

        let tQuery = supabase.from('tenants').select('name, company_logo');
        if (tenantId) {
          tQuery = tQuery.eq('id', tenantId).single();
        } else {
          tQuery = tQuery.order('updated_at', { ascending: false }).limit(1).maybeSingle();
        }
        
        return tQuery;
      })
      .then((res) => {
        if (!res?.data) return;
        if (res.data.company_logo) setCompanyLogo(res.data.company_logo);
        if (res.data.name) setTenant(prev => ({ ...prev, name: res.data.name }));
      })
      .catch(() => {});
  }, [authUser?.id]);

  // Keep tenant state synced when db changes
  useEffect(() => {
    if (db.tenant) {
      setTenant({ ...db.tenant, logo: localStorage.getItem('axara_lms_logo') || db.tenant?.logo || null });
    }
  }, [db]);

  // --- BUILD NOTIFICATIONS DYNAMICALLY ---
  const notifications = [];
  const now = new Date();

  // 1. Sertifikat terbit (certStatus === 'approved')
  const approvedSubs = quizSubmissions.filter(s => s.certStatus === 'approved');
  approvedSubs.forEach(s => {
    notifications.push({
      id: `cert-approved-${s.id}`,
      type: 'approved',
      title: `Sertifikat Terbit! 🎉`,
      message: `Selamat, kuis untuk SOP "${s.videoTitle}" telah disetujui Admin.`,
      date: s.approvedDate || s.date || new Date().toISOString(),
      sub: `Disetujui oleh ${s.approvedBy || 'Admin'}`,
      page: 'sertifikasi',
      color: '#10b981',
      bg: '#ecfdf5',
    });
  });

  // 2. Perlu Remedial atau Tidak Lulus (certStatus === 'remedial')
  const remedialSubs = quizSubmissions.filter(s => s.certStatus === 'remedial');
  remedialSubs.forEach(s => {
    const isTidakLulus = (s.retakeCount || 0) >= MAX_RETAKES;
    notifications.push({
      id: isTidakLulus ? `cert-tidak-lulus-${s.id}` : `cert-remedial-${s.id}`,
      type: isTidakLulus ? 'tidak_lulus' : 'remedial',
      title: isTidakLulus ? `Tidak Lulus ❌` : `Perlu Remedial Kuis ⚠️`,
      message: isTidakLulus
        ? `Anda telah mencapai batas maksimal ${MAX_RETAKES}x remedial untuk SOP "${s.videoTitle}". Silakan hubungi HRD/Supervisor.`
        : `Kuis untuk SOP "${s.videoTitle}" belum lulus. Silakan pelajari kembali.`,
      date: s.supervisorDate || s.date || new Date().toISOString(),
      sub: isTidakLulus
        ? 'Hubungi HRD/Supervisor Anda untuk tindak lanjut.'
        : (s.supervisorNote ? `Catatan: "${s.supervisorNote}"` : `Silakan putar ulang video dan kerjakan kuis kembali.`),
      page: isTidakLulus ? 'sertifikasi' : 'sop',
      color: '#ef4444',
      bg: '#fef2f2',
    });
  });

  // 3. SOP Baru Ditugaskan
  const userDept = db.currentUser?.dept || '';
  videos.forEach(v => {
    if (v.archived) return;
    if (v.dept !== userDept && v.dept !== 'Semua') return;

    const sub = quizSubmissions.find(s => s.videoTitle === v.title);
    const hasPassed = sub && sub.postScore >= (db.passingScore || 80);
    const progress = userProgress[v.id] ?? 0;

    if (progress < 100 && !hasPassed) {
      // New SOP check (created in last 7 days)
      const createdTime = v.created_at ? new Date(v.created_at) : now;
      const isNew = (now - createdTime) / 86400000 <= 7;
      if (isNew) {
        notifications.push({
          id: `new-sop-${v.id}`,
          type: 'new-sop',
          title: `SOP Baru Ditugaskan 📚`,
          message: `SOP baru "${v.title}" wajib Anda pelajari.`,
          date: v.created_at || new Date().toISOString(),
          sub: v.deadline ? `Batas waktu: ${new Date(v.deadline).toLocaleDateString('id-ID')}` : 'Tidak ada tenggat waktu',
          page: 'sop',
          color: '#3b82f6',
          bg: '#eff6ff',
        });
      }

      // Deadline approaching check (within 3 days)
      if (v.deadline) {
        const diffDays = (new Date(v.deadline) - now) / 86400000;
        if (diffDays >= 0 && diffDays <= 3) {
          notifications.push({
            id: `deadline-sop-${v.id}`,
            type: 'deadline',
            title: `Tenggat Waktu Mendekat ⏰`,
            message: `Batas waktu pengerjaan SOP "${v.title}" hampir habis.`,
            date: v.deadline,
            sub: diffDays <= 1 ? 'Segera selesaikan kuis hari ini!' : `${Math.ceil(diffDays)} hari tersisa`,
            page: 'sop',
            color: '#f59e0b',
            bg: '#fffbeb',
          });
        }
      }
    }
  });

  // Trigger push/toast when a new unread notification arrives
  useEffect(() => {
    if (notifications.length === 0) return;
    const currentUnread = notifications.filter(n => !readIds.has(n.id));
    const prevUnreadIds = new Set(prevNotificationsRef.current.filter(n => !readIds.has(n.id)).map(n => n.id));

    currentUnread.forEach(n => {
      // If it's a new notification that wasn't in the previous render cycle as unread
      if (!prevUnreadIds.has(n.id)) {
        // Trigger Toast & Browser Push Notification
        setToast(n);
        setTimeout(() => setToast(null), 5000);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(n.title, {
            body: n.message,
            icon: '/myaxara-logo.svg'
          });
        }
      }
    });

    prevNotificationsRef.current = notifications;
  }, [notifications, readIds]);

  const markNotificationsAsRead = async (idsToMark) => {
    const next = new Set([...readIds, ...idsToMark]);
    setReadIds(next);
    const keys = [...next];
    localStorage.setItem('axara_learner_notif_read', JSON.stringify(keys));
    
    if (db.currentUser?.email) {
      await supabase.from('notification_reads').upsert({
        user_id: db.currentUser.email,
        read_keys: keys,
        updated_at: new Date().toISOString(),
      });
    }

    // Also update acknowledged column for approved/remedial quiz submissions
    const subIdsToAck = [];
    idsToMark.forEach(id => {
      if (id.startsWith('cert-approved-') || id.startsWith('cert-remedial-')) {
        const parts = id.split('-');
        const subId = parts[parts.length - 1];
        subIdsToAck.push(subId);
      }
    });

    if (subIdsToAck.length > 0) {
      await supabase.from('quiz_submissions').update({
        acknowledged: true
      }).in('id', subIdsToAck);
    }
  };

  const videosWithProgress = videos.map(v => ({ ...v, progress: userProgress[v.id] ?? 0 }));

  return (
    <TenantContext.Provider value={{
      currentUser: db.currentUser,
      employees: db.employees,
      videos: videosWithProgress,
      quizSubmissions,
      pendingEssays: db.pendingEssays || [],
      activities: db.activities || [],
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
      companyLogo,
      retakeQuiz,
      MAX_RETAKES,
      notifications,
      readIds,
      markNotificationsAsRead,
      toast,
      setToast
    }}>
      {children}
    </TenantContext.Provider>
  );
};
