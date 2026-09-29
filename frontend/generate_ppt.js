const PptxGenJS = require("pptxgenjs");

let pptx = new PptxGenJS();

pptx.layout = 'LAYOUT_16x9';

// Slide 1: Title
let slide1 = pptx.addSlide();
slide1.addText("SecureShare: Encrypted File Sharing Platform", { x: 0.5, y: 1.5, w: 9, fontSize: 44, bold: true, align: 'center', color: '363636' });
slide1.addText("Cryptography and Network Security Project Review 1", { x: 0.5, y: 3.0, w: 9, fontSize: 24, align: 'center', color: '666666' });
slide1.addText(
    "Team Details:\n" +
    "Yashaswini M - 01fe23bcs288 - 163\n" +
    "Sneha MC - 01fe23bcs377 - 377\n" +
    "Chinmayi H - 01fe23bcs262 - 152\n" +
    "Harshita B - 01fe23bcs193 - 138", 
    { x: 0.5, y: 4.5, w: 9, fontSize: 18, align: 'center', color: '363636', lineSpacing: 28 }
);

// Slide 2: Problem Identification
let slide2 = pptx.addSlide();
slide2.addText("Problem Identification", { x: 0.5, y: 0.5, w: 9, fontSize: 36, bold: true, color: '003366' });
slide2.addText(
    "The Digital Dilemma:\n" +
    "• Users constantly share sensitive files over the internet.\n" +
    "• Standard platforms often lack robust, built-in cryptographic protections.\n" +
    "• Data at rest is vulnerable to server-side breaches and tampering.\n\n" +
    "The Solution:\n" +
    "• A highly secure, localized file-sharing platform.\n" +
    "• Guarantees data confidentiality, integrity, and access control.",
    { x: 0.5, y: 1.5, w: 9, fontSize: 22, bullet: true, color: '363636', lineSpacing: 32 }
);

// Slide 3: Objectives
let slide3 = pptx.addSlide();
slide3.addText("Project Objectives", { x: 0.5, y: 0.5, w: 9, fontSize: 36, bold: true, color: '003366' });
slide3.addText(
    "• Confidentiality: Encrypt files at rest so they remain unreadable even if the server is compromised.\n" +
    "• Integrity: Guarantee files are not altered or corrupted while stored.\n" +
    "• Authentication & Access Control: Restrict access and provide secure sharing mechanisms (e.g., one-time links).\n" +
    "• Usability: Abstract complex cryptography behind a modern, user-friendly interface.",
    { x: 0.5, y: 1.5, w: 9, fontSize: 22, bullet: true, color: '363636', lineSpacing: 32 }
);

// Slide 4: Requirement Analysis
let slide4 = pptx.addSlide();
slide4.addText("Requirement Analysis", { x: 0.5, y: 0.5, w: 9, fontSize: 36, bold: true, color: '003366' });
slide4.addText(
    "Functional Requirements:\n" +
    "• User Registration, Login, and secure file upload/download.\n" +
    "• Dashboard for file management and access control.\n\n" +
    "Security Requirements (CNS Focus):\n" +
    "• Secure Password Storage: Bcrypt prevents dictionary/brute-force attacks.\n" +
    "• Data at Rest Encryption: AES-256-CBC guarantees confidentiality.\n" +
    "• Data Integrity Verification: SHA-256 hash prevents and detects tampering.",
    { x: 0.5, y: 1.5, w: 9, fontSize: 20, bullet: true, color: '363636', lineSpacing: 28 }
);

// Slide 5: System Architecture
let slide5 = pptx.addSlide();
slide5.addText("System Architecture", { x: 0.5, y: 0.5, w: 9, fontSize: 36, bold: true, color: '003366' });
slide5.addText(
    "Modern Client-Server Architecture:\n\n" +
    "1. Frontend (Client): Built with Next.js (React) and Tailwind CSS.\n" +
    "   Handles UI, file selection, and API communication.\n\n" +
    "2. Backend (Server): Built with FastAPI (Python).\n" +
    "   Handles cryptographic operations (AES, SHA), business logic, and JWT auth.\n\n" +
    "3. Database: PostgreSQL.\n" +
    "   Stores hashed user credentials, file metadata, and cryptographic keys.",
    { x: 0.5, y: 1.5, w: 9, fontSize: 22, color: '363636', lineSpacing: 32 }
);

// Slide 6: Security Mechanisms
let slide6 = pptx.addSlide();
slide6.addText("Core Security Mechanisms", { x: 0.5, y: 0.5, w: 9, fontSize: 36, bold: true, color: '003366' });
slide6.addText(
    "• Authentication: JSON Web Tokens (JWT) for stateless sessions.\n" +
    "• Password Hashing: Bcrypt algorithm.\n" +
    "• Symmetric Encryption: AES-256-CBC (Advanced Encryption Standard).\n" +
    "  - 256-bit key and unique Initialization Vector (IV) generated per file.\n" +
    "• Cryptographic Hashing: SHA-256 used for rigorous file integrity checks.",
    { x: 0.5, y: 1.5, w: 9, fontSize: 22, bullet: true, color: '363636', lineSpacing: 32 }
);

// Slide 7: Cryptographic Workflow
let slide7 = pptx.addSlide();
slide7.addText("Cryptographic Workflow", { x: 0.5, y: 0.5, w: 9, fontSize: 36, bold: true, color: '003366' });
slide7.addText(
    "Upload Process:\n" +
    "1. Backend generates a unique AES-256 Key & IV.\n" +
    "2. Calculates SHA-256 Hash of original file.\n" +
    "3. Encrypts file data and saves to disk.\n" +
    "4. Saves metadata (Hash, Key, IV) to PostgreSQL.\n\n" +
    "Download Process:\n" +
    "1. Fetches metadata (Hash, Key, IV).\n" +
    "2. Decrypts file from disk using Key & IV.\n" +
    "3. Verifies SHA-256 hash matches the database record.\n" +
    "4. Returns original file to user.",
    { x: 0.5, y: 1.5, w: 9, fontSize: 18, color: '363636', lineSpacing: 24 }
);

// Slide 8: Task Allocation
let slide8 = pptx.addSlide();
slide8.addText("Task Allocation & Planning", { x: 0.5, y: 0.5, w: 9, fontSize: 36, bold: true, color: '003366' });
slide8.addText(
    "• Yashaswini M & Sneha MC: Frontend & UI/UX\n" +
    "  (Next.js setup, Dashboard, Upload/Download interfaces, API integration)\n\n" +
    "• Chinmayi H: Backend Security & Cryptography\n" +
    "  (FastAPI setup, AES-256-CBC encryption logic, SHA-256 hashing)\n\n" +
    "• Harshita B: Database & Infrastructure\n" +
    "  (PostgreSQL schema design, Docker setup, JWT Authentication)",
    { x: 0.5, y: 1.5, w: 9, fontSize: 20, bullet: true, color: '363636', lineSpacing: 28 }
);

pptx.writeFile({ fileName: "../docs/SecureShare_Review_1_Presentation.pptx" }).then(fileName => {
    console.log(`Created file: ${fileName}`);
});
