import confetti from 'canvas-confetti';
import { 
  saveResume, 
  getResume, 
  getAllResumes, 
  deleteResume, 
  recordScan, 
  getSavedSettings, 
  saveSettings 
} from './db.js';
import { DEMO_RESUMES } from './sampleData.js';
import { 
  renderQRToCanvas, 
  downloadQRCodePNG, 
  renderBadgeCardQR 
} from './qrManager.js';
import { downloadCandidateVCard } from './vcard.js';
import { 
  startCameraScanner, 
  stopCameraScanner, 
  scanQRFromFile 
} from './scanner.js';

// ============================================================================
// APPLICATION STATE
// ============================================================================
let currentResume = null;
let currentSkills = [];
let currentExperiences = [];
let currentEducations = [];
let currentProjects = [];
let uploadedFileData = null;
let uploadedAvatarData = null;
let appSettings = getSavedSettings();

// DOM References container
let DOM = {};

/**
 * Generate a brand-new, unique Candidate ID
 */
function generateUniqueCandidateId() {
  return 'cv_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

/**
 * Convert Base64 / Data URL to a native Blob for reliable iframe embedding
 */
function dataUrlToBlob(dataUrl) {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error('Blob conversion error:', e);
    return null;
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================
async function initApp() {
  cacheDOMElements();

  // Query server for local network IP address
  try {
    const ipRes = await fetch('/api/network-ip');
    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data && data.host) {
        if (!localStorage.getItem('resume_qr_settings') && window.location.hostname === 'localhost') {
          appSettings.customHost = data.host;
          saveSettings(appSettings);
        }
      }
    }
  } catch (e) {}

  updateHostLabel();
  setupEventListeners();

  // Seed demo resumes into IndexedDB if vault is empty
  await seedDemoResumesIfEmpty();

  // Check URL query parameters (e.g. ?id=xyz or ?view=xyz)
  const urlParams = new URLSearchParams(window.location.search);
  const scanId = urlParams.get('id') || urlParams.get('view');

  if (scanId) {
    // Direct scan / view link visited!
    await handleScannedResumeId(scanId);
  } else {
    // Initial visit: start with a fresh unique candidate
    startFreshCandidate();
    await updateVaultDisplay();
  }
}

function cacheDOMElements() {
  DOM = {
    // Navigation Tabs
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    vaultCounter: document.getElementById('vaultCounter'),
    networkBtn: document.getElementById('networkBtn'),
    currentHostLabel: document.getElementById('currentHostLabel'),
    btnQuickDemo: document.getElementById('btnQuickDemo'),
    brandLogo: document.getElementById('brandLogo'),

    // Candidate Indicator
    activeCandidateIndicator: document.getElementById('activeCandidateIndicator'),
    activeCandidateName: document.getElementById('activeCandidateName'),
    activeCandidateId: document.getElementById('activeCandidateId'),
    btnStartFreshCandidate: document.getElementById('btnStartFreshCandidate'),

    // Creator Dropzone & File Input
    fileDropzone: document.getElementById('fileDropzone'),
    resumeFileInput: document.getElementById('resumeFileInput'),
    btnBrowseFile: document.getElementById('btnBrowseFile'),
    uploadedFileBanner: document.getElementById('uploadedFileBanner'),
    fileNameText: document.getElementById('fileNameText'),
    fileSizeText: document.getElementById('fileSizeText'),
    fileTypeIcon: document.getElementById('fileTypeIcon'),
    btnPreviewUploadedDoc: document.getElementById('btnPreviewUploadedDoc'),
    btnRemoveUploadedDoc: document.getElementById('btnRemoveUploadedDoc'),
    instantCandidateName: document.getElementById('instantCandidateName'),
    btnConvertFileToQR: document.getElementById('btnConvertFileToQR'),
    convertSuccessAlert: document.getElementById('convertSuccessAlert'),
    convertSuccessSub: document.getElementById('convertSuccessSub'),
    btnTestScannedDoc: document.getElementById('btnTestScannedDoc'),

    // Avatar
    avatarFileInput: document.getElementById('avatarFileInput'),
    btnUploadAvatar: document.getElementById('btnUploadAvatar'),
    avatarPreviewCircle: document.getElementById('avatarPreviewCircle'),
    avatarImage: document.getElementById('avatarImage'),
    avatarPlaceholder: document.getElementById('avatarPlaceholder'),

    // Form Fields
    resumeForm: document.getElementById('resumeForm'),
    fullNameInput: document.getElementById('fullNameInput'),
    headlineInput: document.getElementById('headlineInput'),
    emailInput: document.getElementById('emailInput'),
    phoneInput: document.getElementById('phoneInput'),
    locationInput: document.getElementById('locationInput'),
    linkedinInput: document.getElementById('linkedinInput'),
    githubInput: document.getElementById('githubInput'),
    websiteInput: document.getElementById('websiteInput'),
    summaryInput: document.getElementById('summaryInput'),

    // Skills
    skillsInputWrapper: document.getElementById('skillsInputWrapper'),
    skillTagsContainer: document.getElementById('skillTagsContainer'),
    skillInputField: document.getElementById('skillInputField'),
    skillSuggestions: document.getElementById('skillSuggestions'),

    // Experience
    experienceList: document.getElementById('experienceList'),
    btnAddExperience: document.getElementById('btnAddExperience'),
    expCountLabel: document.getElementById('expCountLabel'),

    // Education
    educationList: document.getElementById('educationList'),
    btnAddEducation: document.getElementById('btnAddEducation'),
    eduCountLabel: document.getElementById('eduCountLabel'),

    // Projects
    projectList: document.getElementById('projectList'),
    btnAddProject: document.getElementById('btnAddProject'),
    projCountLabel: document.getElementById('projCountLabel'),

    btnResetForm: document.getElementById('btnResetForm'),
    btnGenerateQR: document.getElementById('btnGenerateQR'),

    // QR Studio (Right Column)
    qrStudioCard: document.getElementById('qrStudioCard'),
    qrCanvas: document.getElementById('qrCanvas'),
    qrFrameBadge: document.getElementById('qrFrameBadge'),
    qrTargetUrlInput: document.getElementById('qrTargetUrlInput'),
    btnCopyUrl: document.getElementById('btnCopyUrl'),
    btnSimulateScan: document.getElementById('btnSimulateScan'),
    btnDownloadQRPNG: document.getElementById('btnDownloadQRPNG'),
    btnPrintBadge: document.getElementById('btnPrintBadge'),
    qrFrameSelect: document.getElementById('qrFrameSelect'),
    colorPresetButtons: document.querySelectorAll('.color-preset-circle'),
    currentScanCount: document.getElementById('currentScanCount'),
    qrStatusText: document.getElementById('qrStatusText'),
    qrLinkedFileTag: document.getElementById('qrLinkedFileTag'),
    qrLinkedFileName: document.getElementById('qrLinkedFileName'),

    // Scanner View
    btnModeCamera: document.getElementById('btnModeCamera'),
    btnModeImage: document.getElementById('btnModeImage'),
    btnModeManual: document.getElementById('btnModeManual'),
    scannerCameraView: document.getElementById('scannerCameraView'),
    scannerImageView: document.getElementById('scannerImageView'),
    scannerManualView: document.getElementById('scannerManualView'),
    btnStartCamera: document.getElementById('btnStartCamera'),
    btnStopCamera: document.getElementById('btnStopCamera'),
    qrImageDropzone: document.getElementById('qrImageDropzone'),
    qrImageFileInput: document.getElementById('qrImageFileInput'),
    manualScanInput: document.getElementById('manualScanInput'),
    btnSubmitManualScan: document.getElementById('btnSubmitManualScan'),
    scanStatusAlert: document.getElementById('scanStatusAlert'),
    scanAlertTitle: document.getElementById('scanAlertTitle'),
    scanAlertDesc: document.getElementById('scanAlertDesc'),

    // Vault View
    vaultGrid: document.getElementById('vaultGrid'),
    vaultEmptyState: document.getElementById('vaultEmptyState'),
    vaultSearchInput: document.getElementById('vaultSearchInput'),
    vaultTotalCount: document.getElementById('vaultTotalCount'),
    vaultTotalScans: document.getElementById('vaultTotalScans'),
    btnVaultNewResume: document.getElementById('btnVaultNewResume'),
    btnEmptyCreate: document.getElementById('btnEmptyCreate'),
    btnEmptyDemo: document.getElementById('btnEmptyDemo'),
    btnImportJSON: document.getElementById('btnImportJSON'),
    importJsonInput: document.getElementById('importJsonInput'),

    // Showcase View
    showcaseContainer: document.getElementById('showcaseContainer'),
    scanVerifiedBanner: document.getElementById('scanVerifiedBanner'),
    scannedResumeFileBanner: document.getElementById('scannedResumeFileBanner'),
    scannedDocTitle: document.getElementById('scannedDocTitle'),
    scannedDocSub: document.getElementById('scannedDocSub'),
    btnBannerDownloadDoc: document.getElementById('btnBannerDownloadDoc'),
    bannerFileIconBadge: document.getElementById('bannerFileIconBadge'),
    btnShowcaseBack: document.getElementById('btnShowcaseBack'),
    btnDownloadVCard: document.getElementById('btnDownloadVCard'),
    btnPrintResume: document.getElementById('btnPrintResume'),
    btnShowcaseQRModal: document.getElementById('btnShowcaseQRModal'),
    btnShareShowcase: document.getElementById('btnShareShowcase'),
    showcaseTimestamp: document.getElementById('showcaseTimestamp'),
    showcaseScanBadge: document.getElementById('showcaseScanBadge'),

    btnViewInteractive: document.getElementById('btnViewInteractive'),
    btnViewOriginalDoc: document.getElementById('btnViewOriginalDoc'),
    showcaseDocName: document.getElementById('showcaseDocName'),
    showcaseInteractiveBody: document.getElementById('showcaseInteractiveBody'),
    showcaseDocBody: document.getElementById('showcaseDocBody'),

    showcaseAvatar: document.getElementById('showcaseAvatar'),
    showcaseName: document.getElementById('showcaseName'),
    showcaseHeadline: document.getElementById('showcaseHeadline'),
    showcaseContactPills: document.getElementById('showcaseContactPills'),
    miniQrCanvas: document.getElementById('miniQrCanvas'),
    showcaseSummaryText: document.getElementById('showcaseSummaryText'),
    showcaseSkillsGrid: document.getElementById('showcaseSkillsGrid'),
    showcaseTimeline: document.getElementById('showcaseTimeline'),
    showcaseEduGrid: document.getElementById('showcaseEduGrid'),
    showcaseProjectsGrid: document.getElementById('showcaseProjectsGrid'),

    docViewerTitle: document.getElementById('docViewerTitle'),
    docViewerIframe: document.getElementById('docViewerIframe'),
    docViewerImage: document.getElementById('docViewerImage'),
    docViewerFallback: document.getElementById('docViewerFallback'),
    btnDownloadOriginalDoc: document.getElementById('btnDownloadOriginalDoc'),
    btnFallbackDownload: document.getElementById('btnFallbackDownload'),
    btnToggleFullScreenDoc: document.getElementById('btnToggleFullScreenDoc'),

    // Modals & Toasts
    networkModal: document.getElementById('networkModal'),
    customHostInput: document.getElementById('customHostInput'),
    btnDetectHost: document.getElementById('btnDetectHost'),
    btnCloseNetworkModal: document.getElementById('btnCloseNetworkModal'),
    btnCancelNetworkModal: document.getElementById('btnCancelNetworkModal'),
    btnSaveNetworkHost: document.getElementById('btnSaveNetworkHost'),

    badgeModal: document.getElementById('badgeModal'),
    btnCloseBadgeModal: document.getElementById('btnCloseBadgeModal'),
    btnDoneBadgeModal: document.getElementById('btnDoneBadgeModal'),
    btnPrintBadgeSheet: document.getElementById('btnPrintBadgeSheet'),
    badgeAvatarImg: document.getElementById('badgeAvatarImg'),
    badgeName: document.getElementById('badgeName'),
    badgeTitle: document.getElementById('badgeTitle'),
    badgeSkills: document.getElementById('badgeSkills'),
    badgeContactEmail: document.getElementById('badgeContactEmail'),
    badgeQrCanvas: document.getElementById('badgeQrCanvas'),

    toastContainer: document.getElementById('toastContainer')
  };
}

// ============================================================================
// TAB ROUTING & NAVIGATION
// ============================================================================
function switchTab(tabName) {
  if (tabName !== 'scan') {
    stopCameraScanner();
    DOM.btnStartCamera.classList.remove('hidden');
    DOM.btnStopCamera.classList.add('hidden');
  }

  DOM.navTabs.forEach(tab => {
    const isTarget = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isTarget);
    tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  DOM.tabPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel${capitalize(tabName)}`);
  });

  if (tabName === 'vault') {
    updateVaultDisplay();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================================
// CANDIDATE PROFILE MANAGEMENT & UNIQUE QR CREATION
// ============================================================================

/**
 * Start a brand-new candidate with a unique ID and fresh QR code
 */
function startFreshCandidate() {
  const newId = generateUniqueCandidateId();

  currentResume = {
    id: newId,
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
    summary: '',
    skills: [],
    experience: [{ role: '', company: '', period: '', description: '' }],
    education: [{ degree: '', school: '', year: '' }],
    projects: [],
    fileName: null,
    fileType: null,
    fileSize: null,
    fileData: null,
    scans: 0
  };

  DOM.resumeForm.reset();
  currentSkills = [];
  renderSkillTags();
  currentExperiences = [...currentResume.experience];
  renderExperienceList();
  currentEducations = [...currentResume.education];
  renderEducationList();
  currentProjects = [];
  renderProjectList();
  clearUploadedFile();

  uploadedAvatarData = null;
  DOM.avatarImage.classList.add('hidden');
  DOM.avatarPlaceholder.classList.remove('hidden');

  updateCandidateIndicator('New Candidate', newId);
  refreshActiveQR();
}

function updateCandidateIndicator(name, id) {
  if (DOM.activeCandidateName) DOM.activeCandidateName.textContent = name || 'New Candidate';
  if (DOM.activeCandidateId) DOM.activeCandidateId.textContent = `ID: ${id || '---'}`;
}

/**
 * Load an existing candidate profile into the builder
 */
function loadProfileIntoForm(profile) {
  currentResume = { ...profile };

  updateCandidateIndicator(profile.fullName, profile.id);

  DOM.fullNameInput.value = profile.fullName || '';
  DOM.headlineInput.value = profile.headline || '';
  DOM.emailInput.value = profile.email || '';
  DOM.phoneInput.value = profile.phone || '';
  DOM.locationInput.value = profile.location || '';
  DOM.linkedinInput.value = profile.linkedin || '';
  DOM.githubInput.value = profile.github || '';
  DOM.websiteInput.value = profile.website || '';
  DOM.summaryInput.value = profile.summary || '';

  // Avatar
  uploadedAvatarData = profile.avatar || null;
  if (uploadedAvatarData) {
    DOM.avatarImage.src = uploadedAvatarData;
    DOM.avatarImage.classList.remove('hidden');
    DOM.avatarPlaceholder.classList.add('hidden');
  } else {
    DOM.avatarImage.classList.add('hidden');
    DOM.avatarPlaceholder.classList.remove('hidden');
  }

  // Uploaded Document File
  if (profile.fileData) {
    uploadedFileData = {
      name: profile.fileName || 'resume.pdf',
      type: profile.fileType || 'application/pdf',
      size: profile.fileSize || '1.2 MB',
      data: profile.fileData
    };
    displayUploadedFileBanner(uploadedFileData);
  } else {
    clearUploadedFile();
  }

  // Skills
  currentSkills = [...(profile.skills || [])];
  renderSkillTags();

  // Experience
  currentExperiences = (profile.experience && profile.experience.length > 0)
    ? profile.experience.map(e => ({ ...e }))
    : [{ role: '', company: '', period: '', description: '' }];
  renderExperienceList();

  // Education
  currentEducations = (profile.education && profile.education.length > 0)
    ? profile.education.map(e => ({ ...e }))
    : [{ degree: '', school: '', year: '' }];
  renderEducationList();

  // Projects
  currentProjects = (profile.projects || []).map(p => ({ ...p }));
  renderProjectList();

  // Refresh QR Code for this specific candidate
  refreshActiveQR();
}

function displayUploadedFileBanner(file) {
  DOM.fileNameText.textContent = file.name;
  DOM.fileSizeText.textContent = file.size;

  const ext = file.name.split('.').pop().toUpperCase();
  DOM.fileTypeIcon.textContent = ext.slice(0, 4);

  const dropContent = DOM.fileDropzone.querySelector('.dropzone-content');
  if (dropContent) dropContent.classList.add('hidden');
  DOM.uploadedFileBanner.classList.remove('hidden');
}

function clearUploadedFile() {
  uploadedFileData = null;
  DOM.resumeFileInput.value = '';
  DOM.uploadedFileBanner.classList.add('hidden');
  if (DOM.convertSuccessAlert) DOM.convertSuccessAlert.classList.add('hidden');
  if (DOM.qrLinkedFileTag) DOM.qrLinkedFileTag.classList.add('hidden');
  const dropContent = DOM.fileDropzone.querySelector('.dropzone-content');
  if (dropContent) dropContent.classList.remove('hidden');
}

// ============================================================================
// SKILLS TAGS MANAGER
// ============================================================================
function renderSkillTags() {
  DOM.skillTagsContainer.innerHTML = '';
  currentSkills.forEach((skill, index) => {
    const badge = document.createElement('span');
    badge.className = 'skill-badge';
    badge.innerHTML = `
      <span>${escapeHtml(skill)}</span>
      <button type="button" class="skill-remove-btn" data-index="${index}" title="Remove skill">&times;</button>
    `;
    DOM.skillTagsContainer.appendChild(badge);
  });
}

function addSkill(skillText) {
  const clean = skillText.trim();
  if (clean && !currentSkills.includes(clean)) {
    currentSkills.push(clean);
    renderSkillTags();
  }
  DOM.skillInputField.value = '';
}

// ============================================================================
// DYNAMIC EXPERIENCE, EDUCATION & PROJECTS
// ============================================================================
function renderExperienceList() {
  DOM.experienceList.innerHTML = '';
  DOM.expCountLabel.textContent = currentExperiences.length;

  currentExperiences.forEach((exp, idx) => {
    const card = document.createElement('div');
    card.className = 'dynamic-item-card';
    card.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Position #${idx + 1}</span>
        <button type="button" class="btn-icon btn-danger btn-xs btn-remove-exp" data-index="${idx}" title="Remove position">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Job Title / Role</label>
          <input type="text" class="form-input exp-role" data-index="${idx}" value="${escapeAttr(exp.role || '')}" placeholder="e.g. Senior Software Engineer" />
        </div>
        <div class="form-group">
          <label>Company / Organization</label>
          <input type="text" class="form-input exp-company" data-index="${idx}" value="${escapeAttr(exp.company || '')}" placeholder="e.g. Acme Corp" />
        </div>
      </div>
      <div class="form-group">
        <label>Time Period</label>
        <input type="text" class="form-input exp-period" data-index="${idx}" value="${escapeAttr(exp.period || '')}" placeholder="e.g. 2021 - Present" />
      </div>
      <div class="form-group">
        <label>Responsibilities & Achievements</label>
        <textarea rows="2" class="form-textarea exp-desc" data-index="${idx}" placeholder="Key contributions, metrics, tools...">${escapeHtml(exp.description || '')}</textarea>
      </div>
    `;
    DOM.experienceList.appendChild(card);
  });
}

function renderEducationList() {
  DOM.educationList.innerHTML = '';
  DOM.eduCountLabel.textContent = currentEducations.length;

  currentEducations.forEach((edu, idx) => {
    const card = document.createElement('div');
    card.className = 'dynamic-item-card';
    card.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Education / Cert #${idx + 1}</span>
        <button type="button" class="btn-icon btn-danger btn-xs btn-remove-edu" data-index="${idx}" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Degree / Certificate Title</label>
          <input type="text" class="form-input edu-degree" data-index="${idx}" value="${escapeAttr(edu.degree || '')}" placeholder="e.g. B.S. in Computer Science" />
        </div>
        <div class="form-group">
          <label>School / University / Issuer</label>
          <input type="text" class="form-input edu-school" data-index="${idx}" value="${escapeAttr(edu.school || '')}" placeholder="e.g. Stanford University" />
        </div>
      </div>
      <div class="form-group">
        <label>Graduation Year / ID</label>
        <input type="text" class="form-input edu-year" data-index="${idx}" value="${escapeAttr(edu.year || '')}" placeholder="e.g. 2020 or Credential #12345" />
      </div>
    `;
    DOM.educationList.appendChild(card);
  });
}

function renderProjectList() {
  DOM.projectList.innerHTML = '';
  DOM.projCountLabel.textContent = currentProjects.length;

  currentProjects.forEach((proj, idx) => {
    const card = document.createElement('div');
    card.className = 'dynamic-item-card';
    card.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">Project #${idx + 1}</span>
        <button type="button" class="btn-icon btn-danger btn-xs btn-remove-proj" data-index="${idx}" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Project Name</label>
          <input type="text" class="form-input proj-name" data-index="${idx}" value="${escapeAttr(proj.name || '')}" placeholder="e.g. CloudScale AI" />
        </div>
        <div class="form-group">
          <label>Technologies Used</label>
          <input type="text" class="form-input proj-tech" data-index="${idx}" value="${escapeAttr(proj.tech || '')}" placeholder="e.g. React, Python, AWS" />
        </div>
      </div>
      <div class="form-group">
        <label>Project Overview</label>
        <textarea rows="2" class="form-textarea proj-desc" data-index="${idx}" placeholder="Summary of what the project does...">${escapeHtml(proj.description || '')}</textarea>
      </div>
    `;
    DOM.projectList.appendChild(card);
  });
}

// ============================================================================
// QR CODE GENERATION & LIVE STUDIO
// ============================================================================
function getCandidateTargetUrl(resumeId) {
  const base = (appSettings.customHost || window.location.origin).replace(/\/$/, '');
  const pathname = window.location.pathname.replace(/\/$/, '') + '/';
  return `${base}${pathname}?id=${encodeURIComponent(resumeId)}`;
}

async function refreshActiveQR() {
  if (!currentResume) return;

  const targetUrl = getCandidateTargetUrl(currentResume.id);
  DOM.qrTargetUrlInput.value = targetUrl;
  DOM.currentScanCount.textContent = currentResume.scans || 0;

  // Frame Text
  const frameText = appSettings.qrFrameText || 'SCAN TO VIEW RESUME';
  if (frameText === 'NONE') {
    DOM.qrFrameBadge.classList.add('hidden');
  } else {
    DOM.qrFrameBadge.classList.remove('hidden');
    DOM.qrFrameBadge.textContent = frameText;
  }

  // Linked File Indicator on QR Card
  const linkedFileName = currentResume.fileName || (uploadedFileData && uploadedFileData.name);
  if (linkedFileName && DOM.qrLinkedFileTag && DOM.qrLinkedFileName) {
    const sizeStr = currentResume.fileSize || uploadedFileData?.size || '';
    DOM.qrLinkedFileName.textContent = sizeStr ? `${linkedFileName} (${sizeStr})` : linkedFileName;
    DOM.qrLinkedFileTag.classList.remove('hidden');
  } else if (DOM.qrLinkedFileTag) {
    DOM.qrLinkedFileTag.classList.add('hidden');
  }

  // Render QR Canvas
  await renderQRToCanvas(DOM.qrCanvas, targetUrl, {
    color: appSettings.qrColor || '#6366f1',
    bgColor: appSettings.qrBg || '#ffffff',
    width: 280,
    margin: 2
  });

  // Render Mini QR on showcase header
  if (DOM.miniQrCanvas) {
    await renderQRToCanvas(DOM.miniQrCanvas, targetUrl, {
      color: '#0f172a',
      bgColor: '#ffffff',
      width: 96,
      margin: 1
    });
  }
}

// ============================================================================
// CONVERT UPLOADED RESUME FILE INTO UNIQUE QR CODE
// ============================================================================
async function convertUploadedResumeToQR(customCandidateName = '') {
  if (!uploadedFileData || !uploadedFileData.data) {
    showToast('Please choose or drop a resume document first.', 'error');
    return;
  }

  // Generate a distinct, brand-new candidate ID specifically for this upload!
  const newUniqueId = generateUniqueCandidateId();

  // Determine candidate name: custom input or extracted from filename
  let candidateName = (customCandidateName || '').trim();
  if (!candidateName) {
    const cleanFileName = uploadedFileData.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(resume|cv|curriculum|vitae|updated|latest|202[0-9]|203[0-9])\b/gi, '')
      .trim();

    candidateName = cleanFileName.length > 2 
      ? cleanFileName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : (DOM.fullNameInput.value.trim() || 'Uploaded Candidate');
  }

  // Populate form fields
  DOM.fullNameInput.value = candidateName;
  if (DOM.instantCandidateName) {
    DOM.instantCandidateName.value = candidateName;
  }

  if (!DOM.headlineInput.value || DOM.headlineInput.value.includes('Alex Morgan')) {
    DOM.headlineInput.value = 'Applicant / Professional Profile';
  }
  if (!DOM.emailInput.value || DOM.emailInput.value.includes('alex.morgan')) {
    const cleanEmailUser = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '.');
    DOM.emailInput.value = `${cleanEmailUser || 'candidate'}@example.com`;
  }

  // Default summary
  if (!DOM.summaryInput.value || DOM.summaryInput.value.includes('Passionate engineering leader')) {
    DOM.summaryInput.value = `Verified resume document (${uploadedFileData.name}) uploaded to ResumeQR. Scan QR code to view original document or interactive profile.`;
  }

  // Assign new unique candidate record
  currentResume = {
    id: newUniqueId,
    fullName: candidateName,
    headline: DOM.headlineInput.value.trim(),
    email: DOM.emailInput.value.trim(),
    phone: DOM.phoneInput.value.trim(),
    location: DOM.locationInput.value.trim(),
    linkedin: DOM.linkedinInput.value.trim(),
    github: DOM.githubInput.value.trim(),
    website: DOM.websiteInput.value.trim(),
    summary: DOM.summaryInput.value.trim(),
    avatar: uploadedAvatarData || null,
    skills: currentSkills.length > 0 ? [...currentSkills] : ['Uploaded Resume', 'Verified Candidate', 'Document'],
    experience: currentExperiences.filter(e => e.role || e.company),
    education: currentEducations.filter(e => e.degree || e.school),
    projects: currentProjects.filter(p => p.name),
    fileName: uploadedFileData.name,
    fileType: uploadedFileData.type,
    fileSize: uploadedFileData.size,
    fileData: uploadedFileData.data,
    scans: 0,
    createdAt: new Date().toISOString()
  };

  updateCandidateIndicator(candidateName, newUniqueId);

  // Save to IndexedDB and sync to local dev server API
  await saveResume(currentResume);

  // Generate this candidate's distinct new QR code!
  await refreshActiveQR();

  // Show the green success alert in the instant convert box
  if (DOM.convertSuccessAlert) {
    DOM.convertSuccessAlert.classList.remove('hidden');
    if (DOM.convertSuccessSub) {
      DOM.convertSuccessSub.textContent = `Unique QR code linked to "${uploadedFileData.name}". Ready to scan or test!`;
    }
  }

  // Trigger celebration confetti
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#6366f1', '#06b6d4', '#10b981', '#ffffff']
  });

  showToast(`🎉 Unique QR code created for ${candidateName}!`, 'success');
  updateVaultDisplay();
}

// ============================================================================
// FILE UPLOAD PROCESSOR (EVERY UPLOAD GETS A UNIQUE QR CODE!)
// ============================================================================
async function handleUploadedFile(file) {
  if (!file) return;

  if (file.size > 25 * 1024 * 1024) {
    showToast('File size exceeds 25MB limit.', 'error');
    return;
  }

  showToast(`Reading and converting ${file.name}...`, 'info');

  const reader = new FileReader();
  reader.onload = async (e) => {
    const formattedSize = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';

    uploadedFileData = {
      name: file.name,
      type: file.type || 'application/pdf',
      size: formattedSize,
      data: e.target.result
    };

    displayUploadedFileBanner(uploadedFileData);

    // Extract clean name from file name
    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b(resume|cv|curriculum|vitae|updated|latest|202[0-9]|203[0-9])\b/gi, '')
      .trim();

    const candidateName = cleanFileName.length > 2 
      ? cleanFileName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : (DOM.fullNameInput.value.trim() || 'Uploaded Candidate');

    if (DOM.instantCandidateName) {
      DOM.instantCandidateName.value = candidateName;
    }

    // Automatically convert this resume into a QR code immediately upon file drop/selection!
    await convertUploadedResumeToQR(candidateName);
  };

  reader.onerror = () => {
    showToast('Failed to read the uploaded file.', 'error');
  };

}

// ============================================================================
// RESUME SAVE & FORM SUBMIT
// ============================================================================
async function handleResumeFormSubmit(e) {
  e.preventDefault();

  const fullName = DOM.fullNameInput.value.trim();
  const headline = DOM.headlineInput.value.trim();
  const email = DOM.emailInput.value.trim();

  if (!fullName || !headline || !email) {
    showToast('Please fill in required fields (Name, Title, Email)', 'error');
    return;
  }

  // Ensure current candidate has a unique ID
  const candidateId = currentResume?.id || generateUniqueCandidateId();

  // Gather experiences
  const expItems = [];
  document.querySelectorAll('.exp-role').forEach((el, idx) => {
    const role = el.value.trim();
    const company = document.querySelectorAll('.exp-company')[idx]?.value.trim() || '';
    if (role || company) {
      expItems.push({
        role,
        company,
        period: document.querySelectorAll('.exp-period')[idx]?.value.trim() || '',
        description: document.querySelectorAll('.exp-desc')[idx]?.value.trim() || ''
      });
    }
  });

  // Gather educations
  const eduItems = [];
  document.querySelectorAll('.edu-degree').forEach((el, idx) => {
    const degree = el.value.trim();
    const school = document.querySelectorAll('.edu-school')[idx]?.value.trim() || '';
    if (degree || school) {
      eduItems.push({
        degree,
        school,
        year: document.querySelectorAll('.edu-year')[idx]?.value.trim() || ''
      });
    }
  });

  // Gather projects
  const projItems = [];
  document.querySelectorAll('.proj-name').forEach((el, idx) => {
    const name = el.value.trim();
    if (name) {
      projItems.push({
        name,
        tech: document.querySelectorAll('.proj-tech')[idx]?.value.trim() || '',
        description: document.querySelectorAll('.proj-desc')[idx]?.value.trim() || ''
      });
    }
  });

  const resumePayload = {
    id: candidateId,
    fullName,
    headline,
    email,
    phone: DOM.phoneInput.value.trim(),
    location: DOM.locationInput.value.trim(),
    linkedin: DOM.linkedinInput.value.trim(),
    github: DOM.githubInput.value.trim(),
    website: DOM.websiteInput.value.trim(),
    summary: DOM.summaryInput.value.trim(),
    avatar: uploadedAvatarData || currentResume?.avatar || null,
    skills: [...currentSkills],
    experience: expItems,
    education: eduItems,
    projects: projItems,
    fileName: uploadedFileData?.name || currentResume?.fileName || null,
    fileType: uploadedFileData?.type || currentResume?.fileType || null,
    fileSize: uploadedFileData?.size || currentResume?.fileSize || null,
    fileData: uploadedFileData?.data || currentResume?.fileData || null,
    scans: currentResume?.scans || 0
  };

  // Save to IndexedDB and sync to dev server
  const saved = await saveResume(resumePayload);
  currentResume = saved;

  updateCandidateIndicator(fullName, candidateId);

  // Refresh QR & Trigger celebratory confetti
  await refreshActiveQR();
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.75 },
    colors: ['#6366f1', '#06b6d4', '#10b981', '#ffffff']
  });

  showToast(`Resume saved! Distinct QR code active for ${fullName}.`, 'success');
  updateVaultDisplay();
}

// ============================================================================
// CANDIDATE RESUME SHOWCASE (THE SCANNED VIEW)
// ============================================================================
export async function handleScannedResumeId(id) {
  let resume = await getResume(id);

  // Fallback: check demo resumes
  if (!resume) {
    resume = DEMO_RESUMES.find(d => d.id === id);
    if (resume) {
      await saveResume(resume);
    }
  }

  if (!resume) {
    showToast(`Resume with ID "${id}" was not found in this database.`, 'error');
    switchTab('create');
    return;
  }

  // Increment scan counter
  const newScanCount = await recordScan(resume.id);
  resume.scans = newScanCount;
  currentResume = resume;

  renderShowcaseView(resume);
  switchTab('showcase');
}

function renderShowcaseView(resume) {
  DOM.showcaseName.textContent = resume.fullName || 'Candidate';
  DOM.showcaseHeadline.textContent = resume.headline || 'Professional Profile';
  DOM.showcaseSummaryText.textContent = resume.summary || 'No summary provided.';
  DOM.showcaseTimestamp.textContent = `Updated: ${new Date(resume.updatedAt || Date.now()).toLocaleDateString()}`;
  DOM.showcaseScanBadge.textContent = `⚡ Scanned ${resume.scans || 1} time${(resume.scans || 1) === 1 ? '' : 's'}`;

  // Avatar
  if (resume.avatar) {
    DOM.showcaseAvatar.src = resume.avatar;
    DOM.showcaseAvatar.classList.remove('hidden');
  } else {
    DOM.showcaseAvatar.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%236366f1"><circle cx="50" cy="50" r="50"/></svg>`;
  }

  // Contact Pills
  DOM.showcaseContactPills.innerHTML = '';
  if (resume.email) {
    DOM.showcaseContactPills.appendChild(createContactPill('Mail', resume.email, `mailto:${resume.email}`));
  }
  if (resume.phone) {
    DOM.showcaseContactPills.appendChild(createContactPill('Phone', resume.phone, `tel:${resume.phone}`));
  }
  if (resume.location) {
    DOM.showcaseContactPills.appendChild(createContactPill('Location', resume.location));
  }
  if (resume.linkedin) {
    DOM.showcaseContactPills.appendChild(createContactPill('LinkedIn', 'Profile', resume.linkedin, true));
  }
  if (resume.github) {
    DOM.showcaseContactPills.appendChild(createContactPill('GitHub', 'Repositories', resume.github, true));
  }
  if (resume.website) {
    DOM.showcaseContactPills.appendChild(createContactPill('Portfolio', 'Website', resume.website, true));
  }

  // Skills
  DOM.showcaseSkillsGrid.innerHTML = '';
  (resume.skills || []).forEach(skill => {
    const chip = document.createElement('span');
    chip.className = 'showcase-skill-chip';
    chip.textContent = skill;
    DOM.showcaseSkillsGrid.appendChild(chip);
  });

  // Timeline (Experience)
  DOM.showcaseTimeline.innerHTML = '';
  (resume.experience || []).forEach(exp => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-header">
        <span class="timeline-role">${escapeHtml(exp.role || '')}</span>
        <span class="timeline-period">${escapeHtml(exp.period || '')}</span>
      </div>
      <div class="timeline-company">${escapeHtml(exp.company || '')}</div>
      <p class="timeline-desc">${escapeHtml(exp.description || '')}</p>
    `;
    DOM.showcaseTimeline.appendChild(item);
  });

  // Education
  DOM.showcaseEduGrid.innerHTML = '';
  (resume.education || []).forEach(edu => {
    const card = document.createElement('div');
    card.className = 'edu-card';
    card.innerHTML = `
      <div class="edu-degree">${escapeHtml(edu.degree || '')}</div>
      <div class="edu-school">${escapeHtml(edu.school || '')}</div>
      <div class="edu-year">${escapeHtml(edu.year || '')}</div>
    `;
    DOM.showcaseEduGrid.appendChild(card);
  });

  // Projects
  DOM.showcaseProjectsGrid.innerHTML = '';
  (resume.projects || []).forEach(proj => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <div class="project-name">${escapeHtml(proj.name || '')}</div>
      <div class="project-tech">${escapeHtml(proj.tech || '')}</div>
      <p class="project-desc">${escapeHtml(proj.description || '')}</p>
    `;
    DOM.showcaseProjectsGrid.appendChild(card);
  });

  // Original Document Viewer & Scanned Highlight Banner setup
  if (resume.fileData) {
    if (DOM.scannedResumeFileBanner) {
      DOM.scannedResumeFileBanner.classList.remove('hidden');
      if (DOM.scannedDocTitle) {
        DOM.scannedDocTitle.textContent = resume.fileName || 'Candidate_Resume.pdf';
      }
      if (DOM.scannedDocSub) {
        DOM.scannedDocSub.textContent = `Original uploaded document (${resume.fileSize || 'Document'}) converted from QR Code (ID: ${resume.id})`;
      }
      if (DOM.btnBannerDownloadDoc) {
        DOM.btnBannerDownloadDoc.href = resume.fileData;
        DOM.btnBannerDownloadDoc.download = resume.fileName || 'resume_document.pdf';
      }
    }

    DOM.btnViewOriginalDoc.classList.remove('hidden');
    DOM.showcaseDocName.textContent = (resume.fileName || 'PDF').split('.').pop().toUpperCase();
    DOM.docViewerTitle.textContent = `${resume.fileName || 'Resume Document'} (${resume.fileSize || ''})`;

    const ext = (resume.fileName || '').split('.').pop().toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext) || (resume.fileType && resume.fileType.startsWith('image/'));
    const isPdf = ext === 'pdf' || (resume.fileType && resume.fileType.includes('pdf'));

    if (isImage) {
      if (DOM.docViewerImage) {
        DOM.docViewerImage.src = resume.fileData;
        DOM.docViewerImage.classList.remove('hidden');
      }
      DOM.docViewerIframe.classList.add('hidden');
      DOM.docViewerFallback.classList.add('hidden');
    } else if (isPdf) {
      if (DOM.docViewerImage) DOM.docViewerImage.classList.add('hidden');
      const blob = dataUrlToBlob(resume.fileData);
      let blobUrl = resume.fileData;
      if (blob) {
        blobUrl = URL.createObjectURL(blob);
      }
      DOM.docViewerIframe.src = blobUrl;
      DOM.docViewerIframe.classList.remove('hidden');
      DOM.docViewerFallback.classList.add('hidden');
    } else {
      // Docx or text or other documents
      if (DOM.docViewerImage) DOM.docViewerImage.classList.add('hidden');
      DOM.docViewerIframe.classList.add('hidden');
      DOM.docViewerFallback.classList.remove('hidden');
    }

    DOM.btnDownloadOriginalDoc.href = resume.fileData;
    DOM.btnDownloadOriginalDoc.download = resume.fileName || 'resume_document.pdf';
    DOM.btnFallbackDownload.href = resume.fileData;
    DOM.btnFallbackDownload.download = resume.fileName || 'resume_document.pdf';

    // CRITICAL: Default to Original Document view when resume file was uploaded!
    DOM.btnViewOriginalDoc.classList.add('active');
    DOM.btnViewInteractive.classList.remove('active');
    DOM.showcaseDocBody.classList.remove('hidden');
    DOM.showcaseInteractiveBody.classList.add('hidden');
  } else {
    if (DOM.scannedResumeFileBanner) {
      DOM.scannedResumeFileBanner.classList.add('hidden');
    }
    DOM.btnViewOriginalDoc.classList.add('hidden');

    // Default to interactive view if no uploaded file attached
    DOM.btnViewInteractive.classList.add('active');
    DOM.btnViewOriginalDoc.classList.remove('active');
    DOM.showcaseInteractiveBody.classList.remove('hidden');
    DOM.showcaseDocBody.classList.add('hidden');
  }

  // Render Mini QR on showcase top-right
  const targetUrl = getCandidateTargetUrl(resume.id);
  renderQRToCanvas(DOM.miniQrCanvas, targetUrl, {
    color: '#0f172a',
    bgColor: '#ffffff',
    width: 96,
    margin: 1
  });
}

function createContactPill(type, label, link, isExternal = false) {
  const container = document.createElement(link ? 'a' : 'div');
  container.className = 'contact-pill-item';
  if (link) {
    container.href = link;
    if (isExternal) {
      container.target = '_blank';
      container.rel = 'noopener noreferrer';
    }
  }

  let iconSvg = '';
  if (type === 'Mail') {
    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
  } else if (type === 'Phone') {
    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  } else if (type === 'Location') {
    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  } else {
    iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
  }

  container.innerHTML = `${iconSvg}<span>${escapeHtml(label)}</span>`;
  return container;
}

// ============================================================================
// RESUME VAULT (SAVED PROFILES & INDIVIDUAL QR CODES)
// ============================================================================
async function updateVaultDisplay() {
  const allResumes = await getAllResumes();
  const searchFilter = (DOM.vaultSearchInput.value || '').toLowerCase().trim();

  const filtered = allResumes.filter(r => {
    if (!searchFilter) return true;
    const nameMatch = (r.fullName || '').toLowerCase().includes(searchFilter);
    const titleMatch = (r.headline || '').toLowerCase().includes(searchFilter);
    const skillsMatch = (r.skills || []).some(s => s.toLowerCase().includes(searchFilter));
    return nameMatch || titleMatch || skillsMatch;
  });

  DOM.vaultCounter.textContent = allResumes.length;
  DOM.vaultTotalCount.textContent = allResumes.length;

  const totalScans = allResumes.reduce((acc, r) => acc + (r.scans || 0), 0);
  DOM.vaultTotalScans.textContent = totalScans;

  if (filtered.length === 0) {
    DOM.vaultGrid.innerHTML = '';
    DOM.vaultEmptyState.classList.remove('hidden');
    return;
  }

  DOM.vaultEmptyState.classList.add('hidden');
  DOM.vaultGrid.innerHTML = '';

  filtered.forEach(res => {
    const card = document.createElement('div');
    card.className = 'candidate-vault-card glass-card';
    card.innerHTML = `
      <div class="vault-card-top">
        <img class="vault-card-avatar" src="${res.avatar || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%236366f1"/></svg>'}" alt="${escapeAttr(res.fullName)}" />
        <div class="vault-card-info">
          <h4>${escapeHtml(res.fullName || 'Candidate')}</h4>
          <p>${escapeHtml(res.headline || 'Profile')}</p>
          <span style="font-size:0.7rem; color: #a5b4fc; font-family: monospace;">ID: ${escapeHtml(res.id)}</span>
        </div>
      </div>
      <div class="vault-card-skills">
        ${(res.skills || []).slice(0, 4).map(s => `<span class="vault-skill-tag">${escapeHtml(s)}</span>`).join('')}
      </div>
      <div class="vault-card-footer">
        <span class="vault-scan-pill">⚡ ${res.scans || 0} scans</span>
        <div class="vault-card-btn-group">
          <button class="btn btn-xs btn-outline btn-vault-edit" data-id="${res.id}">Edit / QR</button>
          <button class="btn btn-xs btn-primary btn-vault-view" data-id="${res.id}">View CV</button>
          <button class="btn-icon btn-xs btn-danger btn-vault-delete" data-id="${res.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;
    DOM.vaultGrid.appendChild(card);
  });
}

async function seedDemoResumesIfEmpty() {
  const existing = await getAllResumes();
  if (existing.length === 0) {
    for (const demo of DEMO_RESUMES) {
      await saveResume(demo);
    }
  }
}

// ============================================================================
// SCANNER EVENTS & HANDLING
// ============================================================================
function onQRCodeScanned(rawText) {
  let targetId = null;

  try {
    if (rawText.startsWith('http://') || rawText.startsWith('https://')) {
      const url = new URL(rawText);
      targetId = url.searchParams.get('id') || url.searchParams.get('view');
    }
  } catch (e) {}

  if (!targetId) {
    targetId = rawText.trim();
  }

  DOM.scanAlertTitle.textContent = 'QR Code Successfully Scanned!';
  DOM.scanAlertDesc.textContent = `Found resume ID: ${targetId}. Opening profile...`;
  DOM.scanStatusAlert.classList.remove('hidden');

  stopCameraScanner();

  setTimeout(() => {
    DOM.scanStatusAlert.classList.add('hidden');
    handleScannedResumeId(targetId);
  }, 900);
}

// ============================================================================
// MODAL DIALOGS
// ============================================================================
function openNetworkModal() {
  DOM.customHostInput.value = appSettings.customHost || window.location.origin;
  DOM.networkModal.showModal();
}

function updateHostLabel() {
  try {
    const url = new URL(appSettings.customHost || window.location.origin);
    DOM.currentHostLabel.textContent = url.host || 'localhost:5173';
  } catch (e) {
    DOM.currentHostLabel.textContent = 'Custom Host';
  }
}

async function openPrintBadgeModal() {
  if (!currentResume) return;

  DOM.badgeName.textContent = currentResume.fullName || 'Candidate';
  DOM.badgeTitle.textContent = currentResume.headline || 'Professional';
  DOM.badgeContactEmail.textContent = currentResume.email || '';

  if (currentResume.avatar) {
    DOM.badgeAvatarImg.src = currentResume.avatar;
  }

  DOM.badgeSkills.innerHTML = (currentResume.skills || []).slice(0, 3).map(s => `<span>${escapeHtml(s)}</span>`).join('');

  const targetUrl = getCandidateTargetUrl(currentResume.id);
  await renderBadgeCardQR(DOM.badgeQrCanvas, targetUrl, currentResume);

  DOM.badgeModal.showModal();
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// EVENT LISTENERS REGISTRATION
// ============================================================================
function setupEventListeners() {
  // Navigation Tabs
  DOM.navTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  DOM.brandLogo.addEventListener('click', () => switchTab('create'));

  // Quick Demo Button
  DOM.btnQuickDemo.addEventListener('click', () => {
    const demo = DEMO_RESUMES[Math.floor(Math.random() * DEMO_RESUMES.length)];
    loadProfileIntoForm(demo);
    switchTab('create');
    showToast(`Loaded demo candidate: ${demo.fullName} with distinct QR Code!`, 'success');
  });

  // Start fresh candidate button
  if (DOM.btnStartFreshCandidate) {
    DOM.btnStartFreshCandidate.addEventListener('click', () => {
      startFreshCandidate();
      showToast('Started new candidate with fresh unique QR code!', 'info');
    });
  }

  // Network Host Configuration
  DOM.networkBtn.addEventListener('click', openNetworkModal);
  DOM.btnCloseNetworkModal.addEventListener('click', () => DOM.networkModal.close());
  DOM.btnCancelNetworkModal.addEventListener('click', () => DOM.networkModal.close());

  DOM.btnDetectHost.addEventListener('click', () => {
    DOM.customHostInput.value = window.location.origin;
  });

  DOM.btnSaveNetworkHost.addEventListener('click', async () => {
    const val = DOM.customHostInput.value.trim();
    if (val) {
      appSettings.customHost = val;
      saveSettings(appSettings);
      updateHostLabel();
      await refreshActiveQR();
      DOM.networkModal.close();
      showToast('QR Code host updated successfully!', 'success');
    }
  });

  // FILE DROPZONE & PICKER LOGIC (RELIABLE & BULLETPROOF)
  if (DOM.btnBrowseFile) {
    DOM.btnBrowseFile.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.resumeFileInput.click();
    });
  }

  DOM.fileDropzone.addEventListener('click', (e) => {
    // Avoid triggering file picker when clicking remove or preview
    if (e.target.closest('#btnPreviewUploadedDoc') || e.target.closest('#btnRemoveUploadedDoc')) {
      return;
    }
    // Avoid recursion if target is the input itself
    if (e.target === DOM.resumeFileInput) {
      return;
    }
    DOM.resumeFileInput.click();
  });

  ['dragenter', 'dragover'].forEach(name => {
    DOM.fileDropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      DOM.fileDropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    DOM.fileDropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      DOM.fileDropzone.classList.remove('dragover');
    });
  });

  DOM.fileDropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadedFile(files[0]);
    }
  });

  DOM.resumeFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadedFile(e.target.files[0]);
      DOM.resumeFileInput.value = ''; // Reset so uploading same file again triggers change
    }
  });

  DOM.btnRemoveUploadedDoc.addEventListener('click', (e) => {
    e.stopPropagation();
    clearUploadedFile();
    showToast('Uploaded document removed.', 'info');
  });

  DOM.btnPreviewUploadedDoc.addEventListener('click', (e) => {
    e.stopPropagation();
    if (uploadedFileData && uploadedFileData.data) {
      const blob = dataUrlToBlob(uploadedFileData.data);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        const w = window.open('');
        w.document.write(`<iframe src="${uploadedFileData.data}" style="border:none;width:100%;height:100vh;"></iframe>`);
      }
    }
  });

  // Instant Convert Button & Actions
  if (DOM.btnConvertFileToQR) {
    DOM.btnConvertFileToQR.addEventListener('click', async (e) => {
      e.stopPropagation();
      const customName = DOM.instantCandidateName ? DOM.instantCandidateName.value.trim() : '';
      await convertUploadedResumeToQR(customName);
    });
  }

  if (DOM.btnTestScannedDoc) {
    DOM.btnTestScannedDoc.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentResume && currentResume.id) {
        handleScannedResumeId(currentResume.id);
      }
    });
  }

  if (DOM.instantCandidateName) {
    DOM.instantCandidateName.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await convertUploadedResumeToQR(DOM.instantCandidateName.value.trim());
      }
    });
  }

  // Avatar Upload
  DOM.btnUploadAvatar.addEventListener('click', () => DOM.avatarFileInput.click());
  DOM.avatarPreviewCircle.addEventListener('click', () => DOM.avatarFileInput.click());

  DOM.avatarFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedAvatarData = ev.target.result;
        DOM.avatarImage.src = uploadedAvatarData;
        DOM.avatarImage.classList.remove('hidden');
        DOM.avatarPlaceholder.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  // Skills input
  DOM.skillInputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(DOM.skillInputField.value);
    }
  });

  DOM.skillTagsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.skill-remove-btn');
    if (btn) {
      const idx = parseInt(btn.dataset.index, 10);
      currentSkills.splice(idx, 1);
      renderSkillTags();
    }
  });

  DOM.skillSuggestions.addEventListener('click', (e) => {
    const chip = e.target.closest('.suggestion-chip');
    if (chip) {
      addSkill(chip.dataset.skill);
    }
  });

  // Dynamic lists add buttons
  DOM.btnAddExperience.addEventListener('click', () => {
    currentExperiences.push({ role: '', company: '', period: '', description: '' });
    renderExperienceList();
  });

  DOM.experienceList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-exp');
    if (btn) {
      currentExperiences.splice(parseInt(btn.dataset.index, 10), 1);
      renderExperienceList();
    }
  });

  DOM.btnAddEducation.addEventListener('click', () => {
    currentEducations.push({ degree: '', school: '', year: '' });
    renderEducationList();
  });

  DOM.educationList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-edu');
    if (btn) {
      currentEducations.splice(parseInt(btn.dataset.index, 10), 1);
      renderEducationList();
    }
  });

  DOM.btnAddProject.addEventListener('click', () => {
    currentProjects.push({ name: '', tech: '', description: '' });
    renderProjectList();
  });

  DOM.projectList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remove-proj');
    if (btn) {
      currentProjects.splice(parseInt(btn.dataset.index, 10), 1);
      renderProjectList();
    }
  });

  // Form submit & reset
  DOM.resumeForm.addEventListener('submit', handleResumeFormSubmit);
  DOM.btnResetForm.addEventListener('click', () => {
    if (confirm('Clear form fields and start a fresh candidate profile?')) {
      startFreshCandidate();
    }
  });

  // QR Studio Actions
  DOM.btnCopyUrl.addEventListener('click', () => {
    navigator.clipboard.writeText(DOM.qrTargetUrlInput.value);
    showToast('Resume link copied to clipboard!', 'success');
  });

  DOM.btnSimulateScan.addEventListener('click', () => {
    if (currentResume && currentResume.id) {
      handleScannedResumeId(currentResume.id);
    }
  });

  DOM.btnDownloadQRPNG.addEventListener('click', () => {
    if (currentResume) {
      downloadQRCodePNG(
        DOM.qrTargetUrlInput.value,
        currentResume.fullName || 'candidate',
        {
          color: appSettings.qrColor || '#6366f1',
          bgColor: appSettings.qrBg || '#ffffff'
        }
      );
    }
  });

  DOM.btnPrintBadge.addEventListener('click', openPrintBadgeModal);

  // QR Customizer
  DOM.colorPresetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.colorPresetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appSettings.qrColor = btn.dataset.color;
      appSettings.qrBg = btn.dataset.bg;
      saveSettings(appSettings);
      refreshActiveQR();
    });
  });

  DOM.qrFrameSelect.addEventListener('change', (e) => {
    appSettings.qrFrameText = e.target.value;
    saveSettings(appSettings);
    refreshActiveQR();
  });

  // Scanner Mode Switch
  DOM.btnModeCamera.addEventListener('click', () => {
    DOM.btnModeCamera.classList.add('active');
    DOM.btnModeImage.classList.remove('active');
    DOM.btnModeManual.classList.remove('active');
    DOM.scannerCameraView.classList.remove('hidden');
    DOM.scannerImageView.classList.add('hidden');
    DOM.scannerManualView.classList.add('hidden');
  });

  DOM.btnModeImage.addEventListener('click', () => {
    stopCameraScanner();
    DOM.btnModeCamera.classList.remove('active');
    DOM.btnModeImage.classList.add('active');
    DOM.btnModeManual.classList.remove('active');
    DOM.scannerCameraView.classList.add('hidden');
    DOM.scannerImageView.classList.remove('hidden');
    DOM.scannerManualView.classList.add('hidden');
  });

  DOM.btnModeManual.addEventListener('click', () => {
    stopCameraScanner();
    DOM.btnModeCamera.classList.remove('active');
    DOM.btnModeImage.classList.remove('active');
    DOM.btnModeManual.classList.add('active');
    DOM.scannerCameraView.classList.add('hidden');
    DOM.scannerImageView.classList.add('hidden');
    DOM.scannerManualView.classList.remove('hidden');
  });

  // Camera scanner start/stop
  DOM.btnStartCamera.addEventListener('click', async () => {
    try {
      DOM.btnStartCamera.classList.add('hidden');
      DOM.btnStopCamera.classList.remove('hidden');
      await startCameraScanner('qrReader', onQRCodeScanned, (err) => {});
    } catch (e) {
      DOM.btnStartCamera.classList.remove('hidden');
      DOM.btnStopCamera.classList.add('hidden');
      showToast('Camera access denied or unavailable: ' + e.message, 'error');
    }
  });

  DOM.btnStopCamera.addEventListener('click', () => {
    stopCameraScanner();
    DOM.btnStartCamera.classList.remove('hidden');
    DOM.btnStopCamera.classList.add('hidden');
  });

  // Image QR Dropzone
  DOM.qrImageDropzone.addEventListener('click', () => DOM.qrImageFileInput.click());
  DOM.qrImageFileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      try {
        await scanQRFromFile(e.target.files[0], onQRCodeScanned);
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });

  // Manual Scan Input
  DOM.btnSubmitManualScan.addEventListener('click', () => {
    const val = DOM.manualScanInput.value.trim();
    if (val) onQRCodeScanned(val);
  });

  // Showcase Toolbar Actions
  DOM.btnShowcaseBack.addEventListener('click', () => switchTab('create'));
  DOM.btnPrintResume.addEventListener('click', () => window.print());
  DOM.btnDownloadVCard.addEventListener('click', () => {
    if (currentResume) downloadCandidateVCard(currentResume);
  });

  DOM.btnShowcaseQRModal.addEventListener('click', openPrintBadgeModal);

  DOM.btnShareShowcase.addEventListener('click', () => {
    if (navigator.share && currentResume) {
      navigator.share({
        title: `${currentResume.fullName} — Resume & Portfolio`,
        text: currentResume.headline,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Profile share link copied!', 'success');
    }
  });

  // Showcase View Switcher (Interactive vs Original PDF)
  DOM.btnViewInteractive.addEventListener('click', () => {
    DOM.btnViewInteractive.classList.add('active');
    DOM.btnViewOriginalDoc.classList.remove('active');
    DOM.showcaseInteractiveBody.classList.remove('hidden');
    DOM.showcaseDocBody.classList.add('hidden');
  });

  DOM.btnViewOriginalDoc.addEventListener('click', () => {
    DOM.btnViewInteractive.classList.remove('active');
    DOM.btnViewOriginalDoc.classList.add('active');
    DOM.showcaseInteractiveBody.classList.add('hidden');
    DOM.showcaseDocBody.classList.remove('hidden');
  });

  DOM.btnToggleFullScreenDoc.addEventListener('click', () => {
    const el = DOM.docViewerIframe;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    }
  });

  // Vault Actions & Event Delegation
  DOM.vaultSearchInput.addEventListener('input', updateVaultDisplay);
  DOM.btnVaultNewResume.addEventListener('click', () => {
    startFreshCandidate();
    switchTab('create');
  });
  DOM.btnEmptyCreate.addEventListener('click', () => {
    startFreshCandidate();
    switchTab('create');
  });
  DOM.btnEmptyDemo.addEventListener('click', async () => {
    await seedDemoResumesIfEmpty();
    await updateVaultDisplay();
    showToast('Loaded demo candidates!', 'success');
  });

  DOM.vaultGrid.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.btn-vault-edit');
    const viewBtn = e.target.closest('.btn-vault-view');
    const deleteBtn = e.target.closest('.btn-vault-delete');

    if (editBtn) {
      const resume = await getResume(editBtn.dataset.id);
      if (resume) {
        loadProfileIntoForm(resume);
        switchTab('create');
        showToast(`Loaded ${resume.fullName} (QR: ${resume.id})`, 'info');
      }
    } else if (viewBtn) {
      handleScannedResumeId(viewBtn.dataset.id);
    } else if (deleteBtn) {
      if (confirm('Delete this resume from your local vault?')) {
        await deleteResume(deleteBtn.dataset.id);
        updateVaultDisplay();
        showToast('Resume removed from vault.', 'info');
      }
    }
  });

  // Badge Modal
  DOM.btnCloseBadgeModal.addEventListener('click', () => DOM.badgeModal.close());
  DOM.btnDoneBadgeModal.addEventListener('click', () => DOM.badgeModal.close());
  DOM.btnPrintBadgeSheet.addEventListener('click', () => {
    window.print();
  });
}

// Utility Helpers
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

// Launch on DOM ready (safe for deferred ESM execution)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
