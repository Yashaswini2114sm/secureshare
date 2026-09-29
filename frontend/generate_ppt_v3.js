const PptxGenJS = require("pptxgenjs");
let pptx = new PptxGenJS();

pptx.layout = 'LAYOUT_16x9';
pptx.defineSlideMaster({
  title: 'DARK_MASTER',
  background: { color: '0A0F1C' }, 
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: '00F0FF' } } }, 
    { text: { text: "SecureShare V1", options: { x: 0.5, y: 5.3, w: 3, h: 0.2, fontSize: 10, color: '4B5B76', fontFace: 'Arial' } } },
    { text: { text: "© 2026 CNS Project", options: { x: 7.5, y: 5.3, w: 2, h: 0.2, fontSize: 10, color: '4B5B76', align: 'right', fontFace: 'Arial' } } }
  ]
});

// Helper for glassmorphism-ish card
function addCard(slide, x, y, w, h) {
    slide.addShape(pptx.ShapeType.rect, { 
        x: x, y: y, w: w, h: h, 
        fill: { color: '1A2235' }, 
        line: { color: '2D3C5A', width: 1 }, 
        rectRadius: 0.1
    });
}

// ── Slide 1: Title ────────────────────────────────────────────────────────────
let slide1 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide1.addShape(pptx.ShapeType.rtTriangle, { x: 6, y: -2, w: 8, h: 8, fill: { color: '003366', transparency: 70 }, rotate: 45 });
slide1.addText("SecureShare", { x: 1, y: 1.5, w: 8, h: 1, fontSize: 60, bold: true, color: 'FFFFFF', fontFace: 'Arial' });
slide1.addText("Production-Grade Encrypted File Sharing", { x: 1, y: 2.5, w: 8, h: 0.5, fontSize: 24, color: '00F0FF', fontFace: 'Arial' });

addCard(slide1, 1, 3.5, 4.5, 1.5);
slide1.addText(
    "Team Members:\n" +
    "Yashaswini M  (01fe23bcs288) - 163\n" +
    "Sneha MC       (01fe23bcs377) - 377\n" +
    "Chinmayi H     (01fe23bcs262) - 152\n" +
    "Harshita B     (01fe23bcs193) - 138", 
    { x: 1.2, y: 3.6, w: 4.1, h: 1.3, fontSize: 12, color: 'A0B2D0', lineSpacing: 20, fontFace: 'Courier New' }
);

// ── Slide 2: Problem Identification ─────────────────────────────────
let slide2 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide2.addText("Problem Identification", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });
addCard(slide2, 0.5, 1.3, 9, 3.5);
slide2.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.3, w: 9, h: 0.1, fill: { color: 'FF3366' }, rectRadius: 0.1 }); 
slide2.addText(
    "In today's digital landscape, users constantly share highly sensitive files—such as personal records, corporate documents, and academic data—over the internet.\n\n" +
    "The inherent problem is that standard file-sharing platforms often lack robust, built-in cryptographic protections. This leaves data at rest extremely vulnerable to:\n" +
    "   • Server-side breaches and hacking attempts\n" +
    "   • Unauthorized access by server administrators\n" +
    "   • Silent data tampering and corruption\n\n" +
    "There is a critical need for a localized, highly secure file-sharing platform that guarantees data confidentiality, integrity, and controlled access out-of-the-box.",
    { x: 0.7, y: 1.6, w: 8.6, h: 3, fontSize: 18, color: 'FFFFFF', lineSpacing: 26 }
);

// ── Slide 3: Objectives ─────────────────────────────────
let slide3 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide3.addText("Project Objectives", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });
addCard(slide3, 0.5, 1.3, 9, 3.6);
slide3.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.3, w: 9, h: 0.1, fill: { color: '00F0FF' }, rectRadius: 0.1 }); 
slide3.addText(
    "1. Confidentiality\n" +
    "Ensure that all uploaded files are securely encrypted at rest. Even if the server storage is fully compromised, the raw files must remain mathematically unreadable.\n\n" +
    "2. Integrity\n" +
    "Guarantee that files are not altered or corrupted while stored on the server. The system must detect even a single-byte change.\n\n" +
    "3. Authentication & Access Control\n" +
    "Restrict file access to authorized users and provide mechanisms for secure, temporary sharing (e.g., password-protected links, one-time downloads).\n\n" +
    "4. Usability\n" +
    "Provide a modern, user-friendly web interface that abstracts the complex cryptographic operations away from the end-user.",
    { x: 0.7, y: 1.5, w: 8.6, h: 3.2, fontSize: 16, color: 'FFFFFF', lineSpacing: 24 }
);

// ── Slide 4: Functional & Non-Functional Requirements ─────────────────────────────────
let slide4 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide4.addText("Requirements Analysis", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

addCard(slide4, 0.5, 1.3, 4.3, 3.5);
slide4.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.3, w: 4.3, h: 0.1, fill: { color: '4CAF50' }, rectRadius: 0.1 }); 
slide4.addText("Functional Requirements", { x: 0.7, y: 1.5, w: 3.9, h: 0.4, fontSize: 20, bold: true, color: '4CAF50' });
slide4.addText(
    "• Secure User Registration & Login.\n\n" +
    "• Secure file upload and download endpoints.\n\n" +
    "• A comprehensive Dashboard for users to manage, share, and track their files.\n\n" +
    "• Granular file access controls, including password protection and expiring links.",
    { x: 0.7, y: 2.0, w: 3.9, h: 2.5, fontSize: 16, color: 'FFFFFF', lineSpacing: 24 }
);

addCard(slide4, 5.2, 1.3, 4.3, 3.5);
slide4.addShape(pptx.ShapeType.rect, { x: 5.2, y: 1.3, w: 4.3, h: 0.1, fill: { color: 'FF9800' }, rectRadius: 0.1 }); 
slide4.addText("Non-Functional Requirements", { x: 5.4, y: 1.5, w: 3.9, h: 0.4, fontSize: 20, bold: true, color: 'FF9800' });
slide4.addText(
    "• Performance:\n" +
    "The system must encrypt and decrypt large files efficiently without significant lag, utilizing optimized symmetric algorithms.\n\n" +
    "• Scalability:\n" +
    "The backend architecture (FastAPI) and database (PostgreSQL) are fully containerized using Docker, allowing for rapid deployment and scaling.",
    { x: 5.4, y: 2.0, w: 3.9, h: 2.5, fontSize: 16, color: 'FFFFFF', lineSpacing: 24 }
);

// ── Slide 5: Security Requirements (CNS Focus) ─────────────────────────────────
let slide5 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide5.addText("Security Requirements & Justifications", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });
addCard(slide5, 0.5, 1.3, 9, 3.6);
slide5.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.3, w: 9, h: 0.1, fill: { color: 'E040FB' }, rectRadius: 0.1 }); 
slide5.addText(
    "1. Secure Password Storage\n" +
    "Requirement: Passwords must never be stored in plain text.\n" +
    "Justification: We utilize Bcrypt because its built-in salt generation and computational cost prevent dictionary and brute-force attacks effectively.\n\n" +
    "2. Data at Rest Encryption\n" +
    "Requirement: Total confidentiality for stored files.\n" +
    "Justification: All files are encrypted before saving to disk using AES-256-CBC, an industry-standard symmetric encryption algorithm known for its high security.\n\n" +
    "3. Data Integrity Verification\n" +
    "Requirement: Detect any tampering of files.\n" +
    "Justification: A SHA-256 cryptographic hash is generated upon upload. During download, the hash is re-calculated and verified, ensuring bit-for-bit accuracy.",
    { x: 0.7, y: 1.5, w: 8.6, h: 3.2, fontSize: 15, color: 'FFFFFF', lineSpacing: 22 }
);

// ── Slide 6: System Architecture Diagram ────────────────────────────────────
let slide6 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide6.addText("System Architecture Diagram", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

slide6.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.5, w: 2, h: 1.5, fill: { color: '2B3B5A' }, line: { color: '00F0FF' } });
slide6.addText("User / Browser\n(Next.js & Tailwind)", { x: 0.5, y: 2.5, w: 2, h: 1.5, fontSize: 14, align: 'center', color: 'FFFFFF', bold: true });

slide6.addShape(pptx.ShapeType.rightArrow, { x: 2.6, y: 3.0, w: 0.8, h: 0.4, fill: { color: '00F0FF' } });
slide6.addText("HTTP/REST", { x: 2.6, y: 2.7, w: 0.8, h: 0.3, fontSize: 10, align: 'center', color: 'A0B2D0' });

slide6.addShape(pptx.ShapeType.rect, { x: 3.5, y: 2.0, w: 3, h: 2.5, fill: { color: '1A2235' }, line: { color: '00F0FF', width: 2 } });
slide6.addText("FastAPI Security Core", { x: 3.5, y: 2.2, w: 3, h: 0.4, fontSize: 16, align: 'center', color: '00F0FF', bold: true });
slide6.addText("• Auth (JWT, Bcrypt)\n• Crypto (AES-256-CBC)\n• Hashing (SHA-256)", { x: 3.6, y: 2.8, w: 2.8, h: 1, fontSize: 12, color: 'FFFFFF' });

slide6.addShape(pptx.ShapeType.rightArrow, { x: 6.6, y: 2.5, w: 0.8, h: 0.4, fill: { color: '00F0FF' } });
slide6.addText("SQL", { x: 6.6, y: 2.2, w: 0.8, h: 0.3, fontSize: 10, align: 'center', color: 'A0B2D0' });

slide6.addShape(pptx.ShapeType.rightArrow, { x: 6.6, y: 3.5, w: 0.8, h: 0.4, fill: { color: '00F0FF' } });
slide6.addText("I/O", { x: 6.6, y: 3.2, w: 0.8, h: 0.3, fontSize: 10, align: 'center', color: 'A0B2D0' });

slide6.addShape(pptx.ShapeType.rect, { x: 7.5, y: 1.8, w: 2, h: 1.2, fill: { color: '2B3B5A' }, line: { color: '4CAF50' } });
slide6.addText("PostgreSQL DB\n(Keys & Hashes)", { x: 7.5, y: 2.0, w: 2, h: 0.8, fontSize: 12, align: 'center', color: 'FFFFFF' });

slide6.addShape(pptx.ShapeType.rect, { x: 7.5, y: 3.3, w: 2, h: 1.2, fill: { color: '2B3B5A' }, line: { color: 'FF9800' } });
slide6.addText("File System\n(Encrypted Blobs)", { x: 7.5, y: 3.5, w: 2, h: 0.8, fontSize: 12, align: 'center', color: 'FFFFFF' });


// ── Slide 7: System Architecture Details ────────────────────────────────────
let slide7 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide7.addText("Architecture Details", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });
addCard(slide7, 0.5, 1.3, 9, 3.6);
slide7.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.3, w: 9, h: 0.1, fill: { color: '00F0FF' }, rectRadius: 0.1 }); 
slide7.addText(
    "Our project utilizes a modern, decoupled Client-Server architecture to maximize security and separation of concerns:\n\n" +
    "1. Frontend (Client)\n" +
    "Built utilizing Next.js (React) and Tailwind CSS. The frontend strictly handles user interfaces, file selections, and securely transmitting data to the backend via RESTful APIs.\n\n" +
    "2. Backend (Security Core)\n" +
    "Built with FastAPI (Python), representing the brain of the system. This layer handles all heavy cryptographic operations. It receives raw files, generates AES keys, calculates SHA-256 hashes, and issues JWT authentication tokens.\n\n" +
    "3. Storage Layer (PostgreSQL & File System)\n" +
    "The PostgreSQL database acts as a secure vault for hashed user credentials, file metadata, and the AES keys themselves. The physical File System only stores the heavily encrypted, unreadable binary blobs (ciphertexts).",
    { x: 0.7, y: 1.5, w: 8.6, h: 3.2, fontSize: 15, color: 'FFFFFF', lineSpacing: 22 }
);

// ── Slide 8: Cryptographic Workflow Diagram ─────────────────────────────────
let slide8 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide8.addText("Cryptographic Workflow Diagram", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

let yStart = 1.8;
slide8.addText("Upload Pipeline:", { x: 0.5, y: 1.4, w: 3, h: 0.4, fontSize: 18, color: '00F0FF', bold: true });

let steps = [
    { text: "1. Raw File", x: 0.5, c: '2B3B5A' },
    { text: "2. Generate\nKey & IV", x: 2.5, c: '2B3B5A' },
    { text: "3. SHA-256\nHash", x: 4.5, c: '1A2235', b: 'FF9800' },
    { text: "4. AES-256\nEncrypt", x: 6.5, c: '1A2235', b: '00F0FF' },
    { text: "5. Secure\nStorage", x: 8.5, c: '2B3B5A', b: '4CAF50' }
];

for(let i=0; i<steps.length; i++) {
    let s = steps[i];
    slide8.addShape(pptx.ShapeType.rect, { x: s.x, y: yStart, w: 1.2, h: 1, fill: { color: s.c }, line: { color: s.b || '4B5B76' } });
    slide8.addText(s.text, { x: s.x, y: yStart, w: 1.2, h: 1, fontSize: 10, align: 'center', color: 'FFFFFF', bold: true });
    if(i < steps.length - 1) {
        slide8.addShape(pptx.ShapeType.rightArrow, { x: s.x + 1.3, y: yStart + 0.4, w: 0.6, h: 0.2, fill: { color: '4B5B76' } });
    }
}

let yDown = 3.5;
slide8.addText("Download Pipeline:", { x: 0.5, y: 3.1, w: 3, h: 0.4, fontSize: 18, color: 'FF3366', bold: true });

let downSteps = [
    { text: "1. Encrypted\nBlob", x: 0.5, c: '2B3B5A' },
    { text: "2. Fetch DB\nKey & IV", x: 2.5, c: '2B3B5A' },
    { text: "3. AES-256\nDecrypt", x: 4.5, c: '1A2235', b: '00F0FF' },
    { text: "4. Verify\nSHA-256", x: 6.5, c: '1A2235', b: 'FF9800' },
    { text: "5. Return\nFile", x: 8.5, c: '2B3B5A', b: '4CAF50' }
];

for(let i=0; i<downSteps.length; i++) {
    let s = downSteps[i];
    slide8.addShape(pptx.ShapeType.rect, { x: s.x, y: yDown, w: 1.2, h: 1, fill: { color: s.c }, line: { color: s.b || '4B5B76' } });
    slide8.addText(s.text, { x: s.x, y: yDown, w: 1.2, h: 1, fontSize: 10, align: 'center', color: 'FFFFFF', bold: true });
    if(i < downSteps.length - 1) {
        slide8.addShape(pptx.ShapeType.rightArrow, { x: s.x + 1.3, y: yDown + 0.4, w: 0.6, h: 0.2, fill: { color: '4B5B76' } });
    }
}


// ── Slide 9: Cryptographic Workflow Details ─────────────────────────────────
let slide9 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide9.addText("Workflow Details", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });
addCard(slide9, 0.5, 1.3, 9, 3.6);
slide9.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.3, w: 9, h: 0.1, fill: { color: 'FF9800' }, rectRadius: 0.1 }); 
slide9.addText(
    "Upload Execution Flow:\n" +
    "1. The user transmits the raw file to the backend.\n" +
    "2. The backend generates a cryptographically secure random AES-256 Key and Initialization Vector (IV).\n" +
    "3. The backend calculates the SHA-256 hash of the raw file to capture its exact state.\n" +
    "4. The file is encrypted using AES-256-CBC, converting it into ciphertext.\n" +
    "5. The ciphertext is saved to the disk, while the Key, IV, and Hash are stored securely in PostgreSQL.\n\n" +
    "Download Execution Flow:\n" +
    "1. The backend retrieves the Key, IV, and expected Hash from the database.\n" +
    "2. The ciphertext is read from the disk and decrypted in memory.\n" +
    "3. A new SHA-256 hash is calculated on the decrypted file and compared to the expected hash. If they match, integrity is proven. The file is delivered.",
    { x: 0.7, y: 1.5, w: 8.6, h: 3.2, fontSize: 15, color: 'FFFFFF', lineSpacing: 22 }
);

// ── Slide 10: Task Allocation ───────────────────────────────────────────────────
let slide10 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide10.addText("Project Execution & Task Allocation", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

addCard(slide10, 0.5, 1.5, 2.8, 3);
slide10.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 2.8, h: 0.1, fill: { color: 'E040FB' } });
slide10.addText("Frontend & UI/UX", { x: 0.6, y: 1.7, w: 2.6, h: 0.4, fontSize: 16, bold: true, color: 'E040FB' });
slide10.addText("Yashaswini M\nSneha MC", { x: 0.6, y: 2.2, w: 2.6, h: 0.6, fontSize: 14, color: 'FFFFFF', bold: true });
slide10.addText("• Next.js Architecture\n• Tailwind Styling\n• API Integration", { x: 0.6, y: 2.9, w: 2.6, h: 1, fontSize: 12, color: 'A0B2D0' });

addCard(slide10, 3.6, 1.5, 2.8, 3);
slide10.addShape(pptx.ShapeType.rect, { x: 3.6, y: 1.5, w: 2.8, h: 0.1, fill: { color: '00F0FF' } });
slide10.addText("Backend Security", { x: 3.7, y: 1.7, w: 2.6, h: 0.4, fontSize: 16, bold: true, color: '00F0FF' });
slide10.addText("Chinmayi H", { x: 3.7, y: 2.2, w: 2.6, h: 0.4, fontSize: 14, color: 'FFFFFF', bold: true });
slide10.addText("• FastAPI Logic\n• AES-256 Encryption\n• SHA-256 Hashing", { x: 3.7, y: 2.7, w: 2.6, h: 1, fontSize: 12, color: 'A0B2D0' });

addCard(slide10, 6.7, 1.5, 2.8, 3);
slide10.addShape(pptx.ShapeType.rect, { x: 6.7, y: 1.5, w: 2.8, h: 0.1, fill: { color: '4CAF50' } });
slide10.addText("Database & Infra", { x: 6.8, y: 1.7, w: 2.6, h: 0.4, fontSize: 16, bold: true, color: '4CAF50' });
slide10.addText("Harshita B", { x: 6.8, y: 2.2, w: 2.6, h: 0.4, fontSize: 14, color: 'FFFFFF', bold: true });
slide10.addText("• PostgreSQL Schema\n• JWT Auth\n• Docker Setup", { x: 6.8, y: 2.7, w: 2.6, h: 1, fontSize: 12, color: 'A0B2D0' });


pptx.writeFile({ fileName: "../docs/SecureShare_Review_1_Presentation.pptx" }).then(fileName => {
    console.log(`Created file: ${fileName}`);
});
