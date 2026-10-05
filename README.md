# ResumeQR 🚀
### Upload Resumes, Generate Custom QR Codes & Instant Candidate Showcase

Transform any resume into an interactive digital portfolio accessible via a scannable QR code. When recruiters, clients, or hiring managers scan your QR code with their smartphone camera (or via the site's built-in camera scanner), your complete, verified resume appears instantly on their screen with rich portfolio features, document previews, and one-tap contact saving.

---

## ✨ Features

- **📄 Universal Resume Uploader & Builder**:
  - Drag & drop or browse resume documents: **PDF, DOCX, TXT, Images, or JSON**.
  - Built-in live document viewer for original PDF files.
  - Candidate profile editor with avatar photo, contact info, executive bio, dynamic skills tags, chronological work experience timeline, education, and portfolio projects.
  - **1-Click Demo Profiles**: Pre-loaded with 3 executive candidates (*Alex Morgan - Staff Engineer*, *Sophia Chen - Principal Designer*, *Dr. David Miller - AI Director*).

- **⚡ Instant QR Code Generator Studio**:
  - High-resolution real-time QR code rendering with customizable color schemes (*Cyber Violet, Emerald, Navy Ice, Crimson, Dark Mode*).
  - Customizable frame badges (*"SCAN TO VIEW RESUME"*, *"VIEW CANDIDATE CV"*, *"HIRE ME"*).
  - **Download High-Res PNG (1024x1024)** or copy direct share link.
  - **Printable Executive Lanyard Badge**: Generate and print conference / job fair ID badges with applicant photo, headline, and scannable QR code.

- **📱 Seamless Smartphone Scanning (Cross-Device LAN Sync)**:
  - Automatically detects your computer's local Wi-Fi IP address (e.g. `http://192.168.31.191:5173`).
  - Generated QR codes point directly to your accessible LAN IP so any phone on the same Wi-Fi can scan and open the resume immediately!
  - Cross-device sync middleware ensures resumes created on your laptop are instantly readable on any phone or tablet.

- **📷 Built-in Web Scanner**:
  - Live webcam / device camera scanner with targeting reticle and synthesizer audio chime.
  - Drag & drop QR screenshot / photo image decoder.
  - Direct ID / URL lookup.

- **🌟 Executive Candidate Showcase (Scanned View)**:
  - Ultra-sleek dark glassmorphism aesthetic with responsive typography.
  - Verified candidate badge and status indicator (*"Available for Hire"*).
  - Quick contact pills: One-click email, phone call, LinkedIn, GitHub, and portfolio links.
  - Interactive portfolio view + embedded PDF document viewer tab with full-screen mode.
  - **📇 One-Click vCard Contact Download (`.vcf`)**: Recruiters can save candidate info straight into their phone contacts.
  - **🖨️ Print & PDF Ready**: Dedicated print stylesheet formatted for paper and PDF export.

- **📁 Local Resume Vault (IndexedDB)**:
  - Stores all created and scanned resumes locally in IndexedDB without 5MB storage limits.
  - Live scan counter tracks how many times each QR code was scanned.
  - Search and filter candidates by name, role, or skills.

---

## 🛠️ Technology Stack

- **Core**: Vanilla JavaScript (ES Modules), HTML5, CSS3.
- **Styling**: Modern Vanilla CSS Design System with dark glassmorphism, fluid responsive grid, and print media stylesheet (`@media print`).
- **Dev Server & Bundler**: Vite (configured for host exposure with cross-device sync).
- **Libraries**:
  - `qrcode`: Industry-standard QR Code generator.
  - `html5-qrcode`: Camera scanner and image QR decoder.
  - `idb-keyval`: High-performance IndexedDB key-value storage.
  - `canvas-confetti`: Celebratory animations on QR generation.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

The dev server will output:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/  (Accessible from your mobile phone)
```

### 3. Open in Browser
- Open `http://localhost:5173/` in your browser.
- Point your phone camera at the QR code on screen to see the candidate's resume appear on your phone!
- Or click **"Test Scan / Open Resume"** to simulate the scan right in your desktop browser.
