// Simulated Local Database using LocalStorage for LMS integration
const DB_KEY = 'axara_lms_db_v2';

// Data lokal minimal — semua data training diambil dari Supabase per tenant.
// Key v2 membuang cache lama yang masih berisi data contoh (Rini Wulandari, dll.)
const defaultDatabase = {
  passingScore: 80,
  validityMonths: 12,
  currentUser: null,
  employees: [],
  pendingEssays: [],
  activities: [],
};

export const getDB = () => {
  const db = localStorage.getItem(DB_KEY);
  if (!db) {
    localStorage.removeItem('axara_lms_db');
    return { ...defaultDatabase };
  }
  try {
    return JSON.parse(db);
  } catch {
    return { ...defaultDatabase };
  }
};

export const saveDB = (data) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};
