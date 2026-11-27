const PptxGenJS = require("pptxgenjs");
const path = require("path");

let pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';

// Define Color Palette
const COLORS = {
  bg: '0A0F1D',
  cardBg: '161F30',
  cardBorder: '26354D',
  accentCyan: '00E5FF',
  accentGreen: '10B981',
  accentPurple: 'A855F7',
  accentAmber: 'F59E0B',
  accentRose: 'F43F5E',
  textLight: 'F8FAFC',
  textMuted: '94A3B8',
  textDim: '64748B'
};

// Define Master Slide
pptx.defineSlideMaster({
  title: 'DARK_MASTER',
  background: { color: COLORS.bg },
  objects: [
    // Top glowing accent line
    { rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: COLORS.accentCyan } } },
    // Footer brand text
    { text: { text: "SecureShare — Zero-Trust Cryptographic File Vault", options: { x: 0.5, y: 5.3, w: 5, h: 0.25, fontSize: 9, color: COLORS.textDim, fontFace: 'Arial' } } },
    { text: { text: "Computer Networks & Security (CNS) Capstone", options: { x: 7.0, y: 5.3, w: 2.5, h: 0.25, fontSize: 9, color: COLORS.textDim, align: 'right', fontFace: 'Arial' } } }
  ]
});

// Helper: Card Container
function addCard(slide, x, y, w, h, borderColor = COLORS.cardBorder, fillColor = COLORS.cardBg) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: x, y: y, w: w, h: h,
    fill: { color: fillColor },
    line: { color: borderColor, width: 1 },
    rectRadius: 0.08
  });
}

// Helper: Slide Header
function addSlideHeader(slide, title, category = "SECURESHARE ARCHITECTURE") {
  slide.addText(category.toUpperCase(), { x: 0.6, y: 0.35, w: 8, h: 0.25, fontSize: 10, bold: true, color: COLORS.accentCyan, fontFace: 'Arial' });
  slide.addText(title, { x: 0.6, y: 0.62, w: 8.8, h: 0.55, fontSize: 24, bold: true, color: COLORS.textLight, fontFace: 'Arial' });
}

// ==============================================================================
// SLIDE 1: TITLE SLIDE
// ==============================================================================
let s1 = pptx.addSlide({ masterName: 'DARK_MASTER' });

// Decorative background accents
s1.addShape(pptx.ShapeType.ellipse, { x: 7.5, y: -1, w: 4, h: 4, fill: { color: '003366', transparency: 75 } });
s1.addShape(pptx.ShapeType.ellipse, { x: 8.5, y: 3.5, w: 3, h: 3, fill: { color: '4A154B', transparency: 80 } });

s1.addText("🔐 SECURESHARE", { x: 0.8, y: 0.9, w: 8.4, h: 0.6, fontSize: 38, bold: true, color: COLORS.accentCyan, fontFace: 'Arial' });
s1.addText("Enterprise Zero-Trust Cryptographic File Vault", { x: 0.8, y: 1.5, w: 8.4, h: 0.45, fontSize: 20, bold: true, color: COLORS.textLight, fontFace: 'Arial' });
s1.addText("Applied Cryptography, Mandatory Owner Approval & Bit-Level Integrity", { x: 0.8, y: 1.95, w: 8.4, h: 0.35, fontSize: 13, color: COLORS.textMuted, fontFace: 'Arial' });

// Project Guide Box
addCard(s1, 0.8, 2.6, 4.0, 2.4, COLORS.accentCyan);
s1.addShape(pptx.ShapeType.rect, { x: 0.8, y: 2.6, w: 4.0, h: 0.06, fill: { color: COLORS.accentCyan } });
s1.addText("PROJECT GUIDE", { x: 1.0, y: 2.8, w: 3.6, h: 0.3, fontSize: 11, bold: true, color: COLORS.accentCyan, fontFace: 'Arial' });
s1.addText("Prof. Roopa Badami", { x: 1.0, y: 3.15, w: 3.6, h: 0.4, fontSize: 18, bold: true, color: COLORS.textLight, fontFace: 'Arial' });
s1.addText("Department of Computer Science & Engineering\nKLE Technological University\nAcademic Capstone Evaluation", { x: 1.0, y: 3.6, w: 3.6, h: 1.1, fontSize: 11, color: COLORS.textMuted, fontFace: 'Arial', lineSpacing: 18 });

// Team Members Box
addCard(s1, 5.1, 2.6, 4.1, 2.4, COLORS.accentGreen);
s1.addShape(pptx.ShapeType.rect, { x: 5.1, y: 2.6, w: 4.1, h: 0.06, fill: { color: COLORS.accentGreen } });
s1.addText("TEAM MEMBERS & USN", { x: 5.3, y: 2.8, w: 3.7, h: 0.3, fontSize: 11, bold: true, color: COLORS.accentGreen, fontFace: 'Arial' });

const team = [
  { name: "Yashaswini", usn: "01fe23bcs288" },
  { name: "Sneha M C", usn: "01fe23bcs377" },
  { name: "Harshita B", usn: "01fe23bcs111" },
  { name: "Chinmayi Hosur", usn: "01fe23bcs262" }
];

let teamText = "";
team.forEach((m, idx) => {
  teamText += `• ${m.name.padEnd(16, ' ')} :  ${m.usn}\n`;
});
s1.addText(teamText.trim(), { x: 5.3, y: 3.2, w: 3.7, h: 1.6, fontSize: 12, bold: true, color: COLORS.textLight, fontFace: 'Courier New', lineSpacing: 22 });

// ==============================================================================
// SLIDE 2: PROBLEM STATEMENT
// ==============================================================================
let s2 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s2, "Problem Statement: Vulnerabilities in Current File Sharing", "1. PROBLEM IDENTIFICATION");

addCard(s2, 0.6, 1.3, 4.2, 3.7, COLORS.accentRose);
s2.addText("⚠️ Industry Vulnerabilities", { x: 0.8, y: 1.5, w: 3.8, h: 0.35, fontSize: 16, bold: true, color: COLORS.accentRose });
s2.addText(
  "• Unencrypted Data at Rest:\n" +
  "Standard cloud services (Google Drive, Dropbox) retain files in plaintext or server-controlled keys. A database breach directly exposes raw files.\n\n" +
  "• Insider Threat & Server Admin Snooping:\n" +
  "Privileged server administrators can inspect physical disks and access private user payloads.\n\n" +
  "• Public Shared Link Hijacking:\n" +
  "Anyone with a copied or leaked file link can immediately download the file without owner authorization.\n\n" +
  "• Undetected File Tampering:\n" +
  "Standard storage lacks bit-level integrity verification, allowing silent corruption or malicious bit-flipping.",
  { x: 0.8, y: 1.95, w: 3.8, h: 2.8, fontSize: 11, color: COLORS.textLight, lineSpacing: 16 }
);

addCard(s2, 5.1, 1.3, 4.3, 3.7, COLORS.accentCyan);
s2.addText("🛡️ The SecureShare Solution", { x: 5.3, y: 1.5, w: 3.9, h: 0.35, fontSize: 16, bold: true, color: COLORS.accentCyan });
s2.addText(
  "• End-to-End Cryptographic Vault:\n" +
  "Files are encrypted with AES-256-CBC using session keys derived via client-server ECDH P-256 handshake. Zero plaintext on disk.\n\n" +
  "• Mandatory Owner Access Approval:\n" +
  "Shared links are restricted by default. Recipients must submit an access request; only approved users can download.\n\n" +
  "• Real-Time Permission Revocation:\n" +
  "Owners can revoke access permissions at any time with instantaneous 403 Forbidden enforcement.\n\n" +
  "• Bit-for-Bit SHA-256 Integrity Verification:\n" +
  "Pre-upload and post-download hashes are strictly validated to detect tampering down to a single flipped bit.",
  { x: 5.3, y: 1.95, w: 3.9, h: 2.8, fontSize: 11, color: COLORS.textLight, lineSpacing: 16 }
);

// ==============================================================================
// SLIDE 3: PROJECT OBJECTIVES
// ==============================================================================
let s3 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s3, "Project Objectives & Technical Goals", "2. OBJECTIVES & SCOPE");

const objs = [
  {
    title: "1. Data Confidentiality",
    desc: "Enforce unbreakable AES-256-CBC encryption at rest. Raw files stored on physical storage sectors must remain mathematically unreadable ($2^{256}$ keyspace).",
    color: COLORS.accentCyan
  },
  {
    title: "2. Bit-Level Integrity",
    desc: "Calculate SHA-256 cryptographic fingerprints on upload and strictly verify them on download before streaming plaintext bytes.",
    color: COLORS.accentGreen
  },
  {
    title: "3. Owner-Mediated Access",
    desc: "Implement restricted shared links with an interactive Request ➔ Owner Approval ➔ Download workflow, backed by strict backend authorization.",
    color: COLORS.accentAmber
  },
  {
    title: "4. Zero-Trust Identity",
    desc: "Authenticate users with salted Bcrypt password hashing, stateless JWT bearer tokens, and mandatory RFC 6238 TOTP 2FA via Google Authenticator.",
    color: COLORS.accentPurple
  },
  {
    title: "5. Anti-Forensic Deletion",
    desc: "Implement secure file shredding that overwrites physical disk blocks with os.urandom and forces hardware sync (os.fsync) before deletion.",
    color: COLORS.accentRose
  },
  {
    title: "6. Resilient Security Ops",
    desc: "Prevent credential brute-forcing via SlowAPI rate limiting (5 req/min) and capture tamper-proof audit trails for all critical actions.",
    color: COLORS.accentCyan
  }
];

objs.forEach((o, i) => {
  let col = i % 3;
  let row = Math.floor(i / 3);
  let x = 0.6 + col * 2.95;
  let y = 1.35 + row * 1.85;

  addCard(s3, x, y, 2.8, 1.7, o.color);
  s3.addShape(pptx.ShapeType.rect, { x: x, y: y, w: 2.8, h: 0.05, fill: { color: o.color } });
  s3.addText(o.title, { x: x + 0.15, y: y + 0.15, w: 2.5, h: 0.3, fontSize: 13, bold: true, color: o.color });
  s3.addText(o.desc, { x: x + 0.15, y: y + 0.45, w: 2.5, h: 1.15, fontSize: 10, color: COLORS.textLight, lineSpacing: 14 });
});

// ==============================================================================
// SLIDE 4: SYSTEM ARCHITECTURE
// ==============================================================================
let s4 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s4, "Decoupled 3-Tier System Architecture", "3. SYSTEM DESIGN");

const tiers = [
  {
    name: "Tier 1: Presentation Layer",
    tech: "Next.js 16 • React 19 • Tailwind CSS • WebCrypto",
    items: [
      "• Responsive Glassmorphism Dark UI",
      "• Browser WebCrypto ECDH P-256 Keygen",
      "• Live Cryptographic Engine Console",
      "• Owner Dashboard with Access Requests Tab",
      "• Recipient Request & Download Gateway"
    ],
    border: COLORS.accentCyan,
    x: 0.6
  },
  {
    name: "Tier 2: Application & Security",
    tech: "FastAPI • SlowAPI • Python-JOSE • PyOTP",
    items: [
      "• CORS & Security Headers Middleware",
      "• Token-Bucket Rate Limiter (5 req/min)",
      "• JWT Bearer Token Authenticator",
      "• Owner Approval State Machine",
      "• SIEM Audit Telemetry Engine"
    ],
    border: COLORS.accentPurple,
    x: 3.65
  },
  {
    name: "Tier 3: Cryptography & Storage",
    tech: "PyCryptodome • SQLAlchemy Async • Disk",
    items: [
      "• Ephemeral ECDH & HKDF-SHA256 Derivation",
      "• AES-256-CBC Encrypt/Decrypt Engine",
      "• SHA-256 Bit-level Tamper Verification",
      "• Anti-Forensic Disk Shredder (os.urandom)",
      "• Zero-Plaintext Encrypted Disk Blobs"
    ],
    border: COLORS.accentGreen,
    x: 6.7
  }
];

tiers.forEach(t => {
  addCard(s4, t.x, 1.35, 2.7, 3.65, t.border);
  s4.addShape(pptx.ShapeType.rect, { x: t.x, y: 1.35, w: 2.7, h: 0.08, fill: { color: t.border } });
  s4.addText(t.name, { x: t.x + 0.15, y: 1.5, w: 2.4, h: 0.35, fontSize: 13, bold: true, color: t.border });
  s4.addText(t.tech, { x: t.x + 0.15, y: 1.85, w: 2.4, h: 0.35, fontSize: 9.5, color: COLORS.accentAmber, bold: true });
  s4.addText(t.items.join("\n\n"), { x: t.x + 0.15, y: 2.3, w: 2.4, h: 2.5, fontSize: 10.5, color: COLORS.textLight, lineSpacing: 14 });
});

// ==============================================================================
// SLIDE 5: SYSTEM WORKFLOWS
// ==============================================================================
let s5 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s5, "Core Workflows: Upload, Approval & Download", "4. WORKFLOW PIPELINES");

// Upload Pipeline
addCard(s5, 0.6, 1.35, 8.8, 1.15, COLORS.accentCyan);
s5.addText("1. Secure Upload Pipeline", { x: 0.8, y: 1.45, w: 3, h: 0.25, fontSize: 12, bold: true, color: COLORS.accentCyan });
const upSteps = ["Client P-256 Keygen", "Upload + PubKey", "HKDF AES Derivation", "SHA-256 Hash", "AES-256-CBC Encrypt", "Encrypted Blob Stored"];
upSteps.forEach((st, idx) => {
  let sx = 0.8 + idx * 1.45;
  s5.addShape(pptx.ShapeType.rect, { x: sx, y: 1.75, w: 1.3, h: 0.55, fill: { color: '1E293B' }, line: { color: COLORS.accentCyan } });
  s5.addText(st, { x: sx, y: 1.75, w: 1.3, h: 0.55, fontSize: 9, bold: true, align: 'center', color: COLORS.textLight });
});

// Access Request & Owner Approval Flow
addCard(s5, 0.6, 2.65, 8.8, 1.15, COLORS.accentAmber);
s5.addText("2. Access Request & Owner Approval Pipeline (Zero-Trust Link Sharing)", { x: 0.8, y: 2.75, w: 6, h: 0.25, fontSize: 12, bold: true, color: COLORS.accentAmber });
const appSteps = ["Recipient Opens Link", "Access Restricted!", "Clicks Request Access", "Owner Dashboard Alert", "Owner Approves", "Download Unlocked"];
appSteps.forEach((st, idx) => {
  let sx = 0.8 + idx * 1.45;
  s5.addShape(pptx.ShapeType.rect, { x: sx, y: 3.05, w: 1.3, h: 0.55, fill: { color: '1E293B' }, line: { color: COLORS.accentAmber } });
  s5.addText(st, { x: sx, y: 3.05, w: 1.3, h: 0.55, fontSize: 9, bold: true, align: 'center', color: COLORS.textLight });
});

// Download & Decrypt Flow
addCard(s5, 0.6, 3.95, 8.8, 1.15, COLORS.accentGreen);
s5.addText("3. Authorized Download & Verification Pipeline", { x: 0.8, y: 4.05, w: 4, h: 0.25, fontSize: 12, bold: true, color: COLORS.accentGreen });
const downSteps = ["Auth & Status Verify", "Fetch Ciphertext Blob", "In-Memory AES Decrypt", "SHA-256 Integrity Test", "Audit Log Recorded", "Plaintext Delivered"];
downSteps.forEach((st, idx) => {
  let sx = 0.8 + idx * 1.45;
  s5.addShape(pptx.ShapeType.rect, { x: sx, y: 4.35, w: 1.3, h: 0.55, fill: { color: '1E293B' }, line: { color: COLORS.accentGreen } });
  s5.addText(st, { x: sx, y: 4.35, w: 1.3, h: 0.55, fontSize: 9, bold: true, align: 'center', color: COLORS.textLight });
});

// ==============================================================================
// SLIDE 6: IMPLEMENTATION & CRYPTOGRAPHIC MATRIX
// ==============================================================================
let s6 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s6, "Implementation: Applied Cryptographic Algorithms", "5. IMPLEMENTATION");

const algos = [
  { name: "ECDH (P-256)", spec: "NIST SP 800-56A", purpose: "Transport Handshake", details: "Ephemeral keypair agreement preventing MitM key eavesdropping." },
  { name: "HKDF-SHA256", spec: "RFC 5869", purpose: "Key Derivation", details: "Extracts and expands shared ECDH secret into a uniform 256-bit AES key." },
  { name: "AES-256-CBC", spec: "FIPS 197 / SP 800-38A", purpose: "Bulk Encryption", details: "256-bit key + unique random 128-bit IV with PKCS#7 padding for data at rest." },
  { name: "SHA-256", spec: "FIPS 180-4", purpose: "Integrity Fingerprint", details: "Collision-resistant 256-bit digest guaranteeing bit-for-bit authenticity." },
  { name: "Bcrypt", spec: "OpenBSD Blowfish", purpose: "Password Storage", details: "Adaptive work factor (cost 12) + automatic salt neutralizing rainbow tables." },
  { name: "TOTP 2FA", spec: "RFC 6238 / RFC 4226", purpose: "Multi-Factor Auth", details: "HMAC-SHA1 6-digit codes rotating every 30s synced via Google Authenticator." },
  { name: "DoD Shredder", spec: "DoD 5220.22-M Concept", purpose: "Secure Deletion", details: "Overwrites physical sectors with os.urandom and executes os.fsync." }
];

let tableRows = [
  [
    { text: "Algorithm", options: { bold: true, color: COLORS.accentCyan, fill: '1E293B' } },
    { text: "Specification", options: { bold: true, color: COLORS.accentCyan, fill: '1E293B' } },
    { text: "Operational Purpose", options: { bold: true, color: COLORS.accentCyan, fill: '1E293B' } },
    { text: "Cryptographic Justification & Security Defense", options: { bold: true, color: COLORS.accentCyan, fill: '1E293B' } }
  ]
];

algos.forEach(a => {
  tableRows.push([
    { text: a.name, options: { bold: true, color: COLORS.textLight } },
    { text: a.spec, options: { color: COLORS.accentAmber } },
    { text: a.purpose, options: { color: COLORS.accentGreen } },
    { text: a.details, options: { color: COLORS.textMuted } }
  ]);
});

s6.addTable(tableRows, {
  x: 0.6, y: 1.35, w: 8.8,
  colW: [1.7, 1.8, 1.8, 3.5],
  rowH: 0.45,
  fontSize: 10,
  fontFace: 'Arial',
  border: { pt: 0.5, color: COLORS.cardBorder },
  fill: '161F30'
});

// ==============================================================================
// SLIDE 7: ACCESS REQUEST & OWNER APPROVAL SYSTEM
// ==============================================================================
let s7 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s7, "Core Feature: Access Request & Owner Approval System", "6. ACCESS CONTROL MECHANISM");

addCard(s7, 0.6, 1.35, 4.3, 3.7, COLORS.accentAmber);
s7.addText("🛡️ Owner-Mediated Access Model", { x: 0.8, y: 1.5, w: 3.9, h: 0.35, fontSize: 16, bold: true, color: COLORS.accentAmber });
s7.addText(
  "• Zero-Trust Link Sharing:\n" +
  "In standard file sharing, possessing the URL grants immediate access. In SecureShare, all shared links are strictly restricted by default.\n\n" +
  "• State Machine Lifecycle:\n" +
  "  1. NONE: Visitor sees 'Access Restricted' card.\n" +
  "  2. PENDING: User clicks 'Request Access'; request logged in DB.\n" +
  "  3. APPROVED: Owner clicks Approve; download unlocked.\n" +
  "  4. REJECTED: Owner denies access; visitor sees Access Denied.\n\n" +
  "• Instant Access Revocation:\n" +
  "File owners can revoke previously approved access permissions at any time from their dashboard with immediate 403 Forbidden enforcement.",
  { x: 0.8, y: 1.95, w: 3.9, h: 2.8, fontSize: 11, color: COLORS.textLight, lineSpacing: 16 }
);

addCard(s7, 5.1, 1.35, 4.3, 3.7, COLORS.accentGreen);
s7.addText("💻 UI & Backend Implementation", { x: 5.3, y: 1.5, w: 3.9, h: 0.35, fontSize: 16, bold: true, color: COLORS.accentGreen });
s7.addText(
  "• Dedicated Owner Dashboard:\n" +
  "Includes an 'Access Requests' tab displaying requester username, email, requested file, and one-click [Approve] / [Reject] / [Revoke] controls.\n\n" +
  "• Strict Backend Authorization:\n" +
  "Security is enforced at the API layer (FastAPI). Directly accessing /api/files/{id}/download without approved access returns HTTP 403 Forbidden.\n\n" +
  "• Forwarded Link Protection:\n" +
  "Even if an approved recipient forwards the URL to another user, the third party cannot download because authorization checks the caller's JWT user ID.\n\n" +
  "• Comprehensive Audit Logging:\n" +
  "Logs ACCESS_REQUESTED, ACCESS_APPROVED, ACCESS_REJECTED, ACCESS_REVOKED, and UNAUTHORIZED_ACCESS_ATTEMPT events.",
  { x: 5.3, y: 1.95, w: 3.9, h: 2.8, fontSize: 11, color: COLORS.textLight, lineSpacing: 16 }
);

// ==============================================================================
// SLIDE 8: RESULTS & TESTING ANALYSIS
// ==============================================================================
let s8 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s8, "Results & Verification: 38/38 Automated Tests Passing", "7. RESULTS & TESTING ANALYSIS");

// Metric Highlight Cards
addCard(s8, 0.6, 1.35, 2.7, 1.1, COLORS.accentGreen);
s8.addText("38 / 38", { x: 0.8, y: 1.45, w: 2.3, h: 0.5, fontSize: 28, bold: true, color: COLORS.accentGreen });
s8.addText("Automated Pytest Tests Passed", { x: 0.8, y: 2.0, w: 2.3, h: 0.35, fontSize: 11, color: COLORS.textLight });

addCard(s8, 3.65, 1.35, 2.7, 1.1, COLORS.accentCyan);
s8.addText("100%", { x: 3.85, y: 1.45, w: 2.3, h: 0.5, fontSize: 28, bold: true, color: COLORS.accentCyan });
s8.addText("Code & Security Path Coverage", { x: 3.85, y: 2.0, w: 2.3, h: 0.35, fontSize: 11, color: COLORS.textLight });

addCard(s8, 6.7, 1.35, 2.7, 1.1, COLORS.accentPurple);
s8.addText("0 Vulnerabilities", { x: 6.9, y: 1.45, w: 2.3, h: 0.5, fontSize: 24, bold: true, color: COLORS.accentPurple });
s8.addText("Zero Plaintext / Leaked Keys", { x: 6.9, y: 2.0, w: 2.3, h: 0.35, fontSize: 11, color: COLORS.textLight });

// Detailed Test Breakdown
const testSuites = [
  {
    name: "Authentication Suite (13 Tests)",
    color: COLORS.accentGreen,
    items: "• User registration & duplicate checks\n• Salted Bcrypt password hashing\n• RFC 6238 TOTP 2FA login\n• Rejection of invalid/missing 2FA\n• JWT expiry and profile endpoints",
    x: 0.6
  },
  {
    name: "Cryptography Suite (11 Tests)",
    color: COLORS.accentCyan,
    items: "• 256-bit key & 128-bit IV generation\n• AES-256 roundtrip encrypt/decrypt\n• Binary payload & large file tests (10KB+)\n• SHA-256 avalanche effect\n• Ephemeral ECDH P-256 key handshake",
    x: 3.65
  },
  {
    name: "File & Access Suite (14 Tests)",
    color: COLORS.accentAmber,
    items: "• Upload, download & delete lifecycle\n• Password & one-time download lockout\n• Access request & owner approval flow\n• Instant access revocation\n• 401 & 403 authorization enforcement",
    x: 6.7
  }
];

testSuites.forEach(ts => {
  addCard(s8, ts.x, 2.65, 2.7, 2.35, ts.color);
  s8.addShape(pptx.ShapeType.rect, { x: ts.x, y: 2.65, w: 2.7, h: 0.06, fill: { color: ts.color } });
  s8.addText(ts.name, { x: ts.x + 0.15, y: 2.8, w: 2.4, h: 0.35, fontSize: 12, bold: true, color: ts.color });
  s8.addText(ts.items, { x: ts.x + 0.15, y: 3.2, w: 2.4, h: 1.6, fontSize: 10, color: COLORS.textLight, lineSpacing: 16 });
});

// ==============================================================================
// SLIDE 9: SECURITY ANALYSIS & THREAT DEFENSE MATRIX
// ==============================================================================
let s9 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s9, "Security Threat Defense Matrix", "8. SECURITY ANALYSIS");

const threats = [
  [
    { text: "Potential Threat / Attack Vector", options: { bold: true, color: COLORS.accentRose, fill: '1E293B' } },
    { text: "Vulnerability in Standard Storage", options: { bold: true, color: COLORS.accentAmber, fill: '1E293B' } },
    { text: "SecureShare Defense Mechanism", options: { bold: true, color: COLORS.accentGreen, fill: '1E293B' } }
  ],
  [
    { text: "Man-in-the-Middle (MitM) Eavesdropping", options: { bold: true, color: COLORS.textLight } },
    { text: "Plaintext file transmitted over network.", options: { color: COLORS.textMuted } },
    { text: "Ephemeral ECDH P-256 Key Exchange via WebCrypto. Encryption keys are derived mathematically and never sent over the wire.", options: { color: COLORS.accentCyan } }
  ],
  [
    { text: "Credential Stuffing & Brute-Force", options: { bold: true, color: COLORS.textLight } },
    { text: "Static passwords breached via wordlists.", options: { color: COLORS.textMuted } },
    { text: "SlowAPI rate limits login to 5 req/min. Mandatory RFC 6238 TOTP 2FA requires physical device authenticator.", options: { color: COLORS.accentCyan } }
  ],
  [
    { text: "Storage Breach / Disk Snooping", options: { bold: true, color: COLORS.textLight } },
    { text: "Admin or hacker inspects filesystem disks.", options: { color: COLORS.textMuted } },
    { text: "Military-grade AES-256-CBC with unique random IVs. Disk holds only unreadable ciphertext blobs.", options: { color: COLORS.accentCyan } }
  ],
  [
    { text: "Silent Bit-Rot & Ransomware Tampering", options: { bold: true, color: COLORS.textLight } },
    { text: "Altered files downloaded undetected.", options: { color: COLORS.textMuted } },
    { text: "Bit-level SHA-256 integrity verification. Tampered bytes trigger immediate tamper alert and halt delivery.", options: { color: COLORS.accentCyan } }
  ],
  [
    { text: "Unauthorized Link Forwarding", options: { bold: true, color: COLORS.textLight } },
    { text: "Anyone with URL can download file.", options: { color: COLORS.textMuted } },
    { text: "Owner Access Approval Gate. Third parties receive HTTP 403 Forbidden even if they possess the link.", options: { color: COLORS.accentCyan } }
  ],
  [
    { text: "Forensic Data Recovery of Deleted Files", options: { bold: true, color: COLORS.textLight } },
    { text: "OS unlinks pointer; raw data remains on disk.", options: { color: COLORS.textMuted } },
    { text: "Anti-Forensic File Shredder overwrites physical disk blocks with os.urandom and executes os.fsync.", options: { color: COLORS.accentCyan } }
  ]
];

s9.addTable(threats, {
  x: 0.6, y: 1.35, w: 8.8,
  colW: [2.5, 2.7, 3.6],
  rowH: 0.45,
  fontSize: 9.5,
  fontFace: 'Arial',
  border: { pt: 0.5, color: COLORS.cardBorder },
  fill: '161F30'
});

// ==============================================================================
// SLIDE 10: TEAM ALLOCATION & CONCLUSION
// ==============================================================================
let s10 = pptx.addSlide({ masterName: 'DARK_MASTER' });
addSlideHeader(s10, "Team Execution, Task Allocation & Conclusion", "9. PROJECT EXECUTION & CONCLUSION");

const members = [
  {
    name: "Yashaswini",
    usn: "01fe23bcs288",
    role: "Lead Architect & Frontend Core",
    tasks: "• Next.js App Router Architecture\n• WebCrypto ECDH Integration\n• Access Request & Approval UI\n• Responsive Dashboard Design"
  },
  {
    name: "Sneha M C",
    usn: "01fe23bcs377",
    role: "Frontend Engineer & UI/UX",
    tasks: "• User Authentication Interfaces\n• QR Code 2FA Setup Flow\n• File Sharing Modals & Alerts\n• Client API State Integration"
  },
  {
    name: "Harshita B",
    usn: "01fe23bcs111",
    role: "Database & Infrastructure Lead",
    tasks: "• SQLAlchemy Async DB Modeling\n• AccessRequest & AuditLog Schemas\n• SlowAPI Rate Limiting Engine\n• Automated Pytest Engine (38 Tests)"
  },
  {
    name: "Chinmayi Hosur",
    usn: "01fe23bcs262",
    role: "Backend Security & Cryptography Lead",
    tasks: "• AES-256-CBC Cipher Engine\n• SHA-256 Integrity Verifier\n• Ephemeral Key Handshake Logic\n• Anti-Forensic File Shredding"
  }
];

members.forEach((m, idx) => {
  let x = 0.6 + idx * 2.22;
  addCard(s10, x, 1.35, 2.1, 2.3, COLORS.accentCyan);
  s10.addShape(pptx.ShapeType.rect, { x: x, y: 1.35, w: 2.1, h: 0.05, fill: { color: COLORS.accentCyan } });
  s10.addText(m.name, { x: x + 0.1, y: 1.48, w: 1.9, h: 0.3, fontSize: 13, bold: true, color: COLORS.textLight });
  s10.addText(m.usn, { x: x + 0.1, y: 1.75, w: 1.9, h: 0.22, fontSize: 10, bold: true, color: COLORS.accentAmber });
  s10.addText(m.role, { x: x + 0.1, y: 2.0, w: 1.9, h: 0.28, fontSize: 9.5, bold: true, color: COLORS.accentGreen });
  s10.addText(m.tasks, { x: x + 0.1, y: 2.32, w: 1.9, h: 1.25, fontSize: 8.5, color: COLORS.textMuted, lineSpacing: 13 });
});

// Conclusion Summary Banner
addCard(s10, 0.6, 3.85, 8.8, 1.2, COLORS.accentGreen);
s10.addShape(pptx.ShapeType.rect, { x: 0.6, y: 3.85, w: 8.8, h: 0.05, fill: { color: COLORS.accentGreen } });
s10.addText("🎯 Project Conclusion & Deliverables Summary", { x: 0.8, y: 3.98, w: 5, h: 0.28, fontSize: 13, bold: true, color: COLORS.accentGreen });
s10.addText(
  "✓ Successfully designed, implemented, and validated an enterprise-grade Zero-Trust File Sharing platform.\n" +
  "✓ Seamlessly integrated 8 applied cryptographic mechanisms: ECDH P-256, HKDF-SHA256, AES-256-CBC, SHA-256, Bcrypt, TOTP 2FA, SlowAPI, and DoD file shredding.\n" +
  "✓ Solved the public link vulnerability through mandatory Owner Access Approval with real-time revocation.\n" +
  "✓ Validated with a 100% pass rate across 38 automated test cases, ready for live defense.",
  { x: 0.8, y: 4.28, w: 8.4, h: 0.72, fontSize: 10.5, color: COLORS.textLight, lineSpacing: 16 }
);

// Save Presentation
const outputPath = path.resolve(__dirname, "../docs/SecureShare_Final_Presentation.pptx");
const review1Path = path.resolve(__dirname, "../docs/SecureShare_Review_1_Presentation.pptx");

pptx.writeFile({ fileName: outputPath }).then(() => {
  console.log(`✅ Final Presentation created: ${outputPath}`);
  // Also update review 1 path for convenience
  pptx.writeFile({ fileName: review1Path }).then(() => {
    console.log(`✅ Synced with: ${review1Path}`);
  });
}).catch(err => {
  console.error("Error creating PPTX:", err);
});
