import { get, set, del, keys } from 'idb-keyval';

const RESUME_PREFIX = 'resume_qr_';
const SETTINGS_KEY = 'resume_qr_settings';

/**
 * Save or update a resume in IndexedDB (and sync to local dev server API if available)
 */
export async function saveResume(resume) {
  if (!resume.id) {
    resume.id = 'cv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  }
  resume.updatedAt = new Date().toISOString();

  // Save to IndexedDB
  await set(RESUME_PREFIX + resume.id, resume);

  // Backup key metadata to localStorage index
  try {
    const list = getLocalIndex();
    const existingIndex = list.findIndex(item => item.id === resume.id);
    const summary = {
      id: resume.id,
      fullName: resume.fullName,
      headline: resume.headline,
      email: resume.email,
      avatar: resume.avatar ? (resume.avatar.length < 5000 ? resume.avatar : '') : '',
      skills: (resume.skills || []).slice(0, 5),
      hasDoc: !!resume.fileData,
      fileName: resume.fileName || '',
      updatedAt: resume.updatedAt,
      scans: resume.scans || 0
    };

    if (existingIndex >= 0) {
      list[existingIndex] = summary;
    } else {
      list.unshift(summary);
    }
    localStorage.setItem('resume_index', JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage index sync skipped:', e);
  }

  // Cross-device sync: sync to local server API so scanning phones on Wi-Fi can fetch it!
  try {
    fetch('/api/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resume)
    }).catch(() => {});
  } catch (e) {}

  return resume;
}

/**
 * Fetch a single resume by ID (checks IndexedDB -> LocalStorage -> Server API)
 */
export async function getResume(id) {
  if (!id) return null;

  // 1. Check IndexedDB
  try {
    const res = await get(RESUME_PREFIX + id);
    if (res) return res;
  } catch (e) {}

  // 2. Fallback check in localStorage
  try {
    const backup = localStorage.getItem(RESUME_PREFIX + id);
    if (backup) return JSON.parse(backup);
  } catch (e) {}

  // 3. Fallback check local dev server API (cross-device support)
  try {
    const resp = await fetch(`/api/resume/${id}`);
    if (resp.ok) {
      const serverData = await resp.json();
      if (serverData && serverData.id) {
        await set(RESUME_PREFIX + serverData.id, serverData);
        return serverData;
      }
    }
  } catch (e) {}

  return null;
}

/**
 * Fetch all resumes from IndexedDB
 */
export async function getAllResumes() {
  try {
    const allKeys = await keys();
    const resumeKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith(RESUME_PREFIX));
    const resumes = [];

    for (const k of resumeKeys) {
      const item = await get(k);
      if (item) resumes.push(item);
    }

    // Sort by updatedAt descending
    resumes.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return resumes;
  } catch (err) {
    console.error('Error reading IndexedDB resumes:', err);
    return getLocalIndex();
  }
}

/**
 * Delete a resume by ID
 */
export async function deleteResume(id) {
  await del(RESUME_PREFIX + id);
  try {
    const list = getLocalIndex().filter(item => item.id !== id);
    localStorage.setItem('resume_index', JSON.stringify(list));
    localStorage.removeItem(RESUME_PREFIX + id);
  } catch (e) {}
}

/**
 * Increment and record a QR scan for a resume
 */
export async function recordScan(id) {
  const resume = await getResume(id);
  if (resume) {
    resume.scans = (resume.scans || 0) + 1;
    resume.lastScannedAt = new Date().toISOString();
    await saveResume(resume);
    return resume.scans;
  }
  return 1;
}

/**
 * Settings storage (Target host, QR styling presets, etc.)
 */
export function getSavedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    customHost: window.location.origin,
    qrColor: '#6366f1',
    qrBg: '#ffffff',
    qrFrameText: 'SCAN TO VIEW RESUME'
  };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

function getLocalIndex() {
  try {
    const data = localStorage.getItem('resume_index');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}
