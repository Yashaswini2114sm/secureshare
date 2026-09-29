const PptxGenJS = require("pptxgenjs");
let pptx = new PptxGenJS();

pptx.layout = 'LAYOUT_16x9';
pptx.defineSlideMaster({
  title: 'DARK_MASTER',
  background: { color: '0A0F1C' }, // Dark navy/black cybersecurity theme
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: '00F0FF' } } }, // Cyan top accent
    { text: { text: "SecureShare V1", options: { x: 0.5, y: 5.3, w: 3, h: 0.2, fontSize: 10, color: '4B5B76', fontFace: 'Arial' } } },
    { text: { text: "© 2026 CNS Project", options: { x: 7.5, y: 5.3, w: 2, h: 0.2, fontSize: 10, color: '4B5B76', align: 'right', fontFace: 'Arial' } } }
  ]
});

// Helper for glassmorphism-ish card
function addCard(slide, x, y, w, h) {
    slide.addShape(pptx.ShapeType.rect, { 
        x: x, y: y, w: w, h: h, 
        fill: { color: '1A2235' }, // Slightly lighter dark blue
        line: { color: '2D3C5A', width: 1 }, // Subtle border
        rectRadius: 0.1
    });
}

// ── Slide 1: Title ────────────────────────────────────────────────────────────
let slide1 = pptx.addSlide({ masterName: 'DARK_MASTER' });
// Big abstract shape accent
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

// ── Slide 2: Problem & Solution (Visual split) ─────────────────────────────────
let slide2 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide2.addText("Problem Identification", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

// Red Problem Card
addCard(slide2, 0.5, 1.5, 4.2, 3);
slide2.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 4.2, h: 0.1, fill: { color: 'FF3366' }, rectRadius: 0.1 }); // Red accent
slide2.addText("The Vulnerability", { x: 0.7, y: 1.7, w: 3.8, h: 0.4, fontSize: 20, bold: true, color: 'FF3366' });
slide2.addText(
    "• Sensitive files shared over untrusted networks.\n\n" +
    "• Standard platforms lack cryptography at rest.\n\n" +
    "• Server breaches result in complete data exposure.\n\n" +
    "• High risk of unauthorized data tampering.",
    { x: 0.7, y: 2.2, w: 3.8, h: 2, fontSize: 14, color: 'FFFFFF', lineSpacing: 20 }
);

// Green/Cyan Solution Card
addCard(slide2, 5.3, 1.5, 4.2, 3);
slide2.addShape(pptx.ShapeType.rect, { x: 5.3, y: 1.5, w: 4.2, h: 0.1, fill: { color: '00F0FF' }, rectRadius: 0.1 });
slide2.addText("The Secure Solution", { x: 5.5, y: 1.7, w: 3.8, h: 0.4, fontSize: 20, bold: true, color: '00F0FF' });
slide2.addText(
    "• Localized, zero-compromise sharing platform.\n\n" +
    "• Files are heavily encrypted BEFORE storage.\n\n" +
    "• Hashes guarantee absolute data integrity.\n\n" +
    "• Granular access controls and expiring links.",
    { x: 5.5, y: 2.2, w: 3.8, h: 2, fontSize: 14, color: 'FFFFFF', lineSpacing: 20 }
);

// ── Slide 3: System Architecture (Diagram) ────────────────────────────────────
let slide3 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide3.addText("System Architecture", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

// Boxes
slide3.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.5, w: 2, h: 1.5, fill: { color: '2B3B5A' }, line: { color: '00F0FF' } });
slide3.addText("User / Browser\n(Next.js & Tailwind)", { x: 0.5, y: 2.5, w: 2, h: 1.5, fontSize: 14, align: 'center', color: 'FFFFFF', bold: true });

slide3.addShape(pptx.ShapeType.rightArrow, { x: 2.6, y: 3.0, w: 0.8, h: 0.4, fill: { color: '00F0FF' } });

slide3.addShape(pptx.ShapeType.rect, { x: 3.5, y: 2.0, w: 3, h: 2.5, fill: { color: '1A2235' }, line: { color: '00F0FF', width: 2 } });
slide3.addText("FastAPI Security Core", { x: 3.5, y: 2.2, w: 3, h: 0.4, fontSize: 16, align: 'center', color: '00F0FF', bold: true });
slide3.addText("• Auth (JWT, Bcrypt)\n• Crypto (AES-256-CBC)\n• Hashing (SHA-256)", { x: 3.6, y: 2.8, w: 2.8, h: 1, fontSize: 12, color: 'FFFFFF' });

slide3.addShape(pptx.ShapeType.rightArrow, { x: 6.6, y: 2.5, w: 0.8, h: 0.4, fill: { color: '00F0FF' } });
slide3.addShape(pptx.ShapeType.rightArrow, { x: 6.6, y: 3.5, w: 0.8, h: 0.4, fill: { color: '00F0FF' } });

slide3.addShape(pptx.ShapeType.rect, { x: 7.5, y: 1.8, w: 2, h: 1.2, fill: { color: '2B3B5A' }, line: { color: '4CAF50' } });
slide3.addText("PostgreSQL DB\n(Keys & Hashes)", { x: 7.5, y: 2.0, w: 2, h: 0.8, fontSize: 12, align: 'center', color: 'FFFFFF' });

slide3.addShape(pptx.ShapeType.roundRect, { x: 7.5, y: 3.3, w: 2, h: 1.2, fill: { color: '2B3B5A' }, line: { color: 'FF9800' } });
slide3.addText("File System\n(Encrypted Blobs)", { x: 7.5, y: 3.5, w: 2, h: 0.8, fontSize: 12, align: 'center', color: 'FFFFFF' });


// ── Slide 4: Cryptographic Workflow (Diagram) ─────────────────────────────────
let slide4 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide4.addText("Cryptographic Workflow", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

let yStart = 1.8;
// Upload
slide4.addText("Upload Pipeline:", { x: 0.5, y: 1.4, w: 3, h: 0.4, fontSize: 18, color: '00F0FF', bold: true });

let steps = [
    { text: "1. Raw File", x: 0.5, c: '2B3B5A' },
    { text: "2. Generate\nKey & IV", x: 2.5, c: '2B3B5A' },
    { text: "3. SHA-256\nHash", x: 4.5, c: '1A2235', b: 'FF9800' },
    { text: "4. AES-256\nEncrypt", x: 6.5, c: '1A2235', b: '00F0FF' },
    { text: "5. Secure\nStorage", x: 8.5, c: '2B3B5A', b: '4CAF50' }
];

for(let i=0; i<steps.length; i++) {
    let s = steps[i];
    slide4.addShape(pptx.ShapeType.roundRect, { x: s.x, y: yStart, w: 1.2, h: 1, fill: { color: s.c }, line: { color: s.b || '4B5B76' } });
    slide4.addText(s.text, { x: s.x, y: yStart, w: 1.2, h: 1, fontSize: 10, align: 'center', color: 'FFFFFF', bold: true });
    if(i < steps.length - 1) {
        slide4.addShape(pptx.ShapeType.rightArrow, { x: s.x + 1.3, y: yStart + 0.4, w: 0.6, h: 0.2, fill: { color: '4B5B76' } });
    }
}

// Download
let yDown = 3.5;
slide4.addText("Download Pipeline:", { x: 0.5, y: 3.1, w: 3, h: 0.4, fontSize: 18, color: 'FF3366', bold: true });

let downSteps = [
    { text: "1. Encrypted\nBlob", x: 0.5, c: '2B3B5A' },
    { text: "2. Fetch DB\nKey & IV", x: 2.5, c: '2B3B5A' },
    { text: "3. AES-256\nDecrypt", x: 4.5, c: '1A2235', b: '00F0FF' },
    { text: "4. Verify\nSHA-256", x: 6.5, c: '1A2235', b: 'FF9800' },
    { text: "5. Return\nFile", x: 8.5, c: '2B3B5A', b: '4CAF50' }
];

for(let i=0; i<downSteps.length; i++) {
    let s = downSteps[i];
    slide4.addShape(pptx.ShapeType.roundRect, { x: s.x, y: yDown, w: 1.2, h: 1, fill: { color: s.c }, line: { color: s.b || '4B5B76' } });
    slide4.addText(s.text, { x: s.x, y: yDown, w: 1.2, h: 1, fontSize: 10, align: 'center', color: 'FFFFFF', bold: true });
    if(i < downSteps.length - 1) {
        slide4.addShape(pptx.ShapeType.rightArrow, { x: s.x + 1.3, y: yDown + 0.4, w: 0.6, h: 0.2, fill: { color: '4B5B76' } });
    }
}

// ── Slide 5: Security Stack ───────────────────────────────────────────────────
let slide5 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide5.addText("Security Protocol Stack", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

let stack = [
    { title: "Authentication (JWT)", desc: "Stateless, digitally signed bearer tokens.", y: 1.5, c: '4CAF50' },
    { title: "Credential Protection (Bcrypt)", desc: "Computationally expensive password hashing.", y: 2.3, c: 'FF9800' },
    { title: "Data Confidentiality (AES-256-CBC)", desc: "Symmetric-key military-grade encryption.", y: 3.1, c: '00F0FF' },
    { title: "Data Integrity (SHA-256)", desc: "Cryptographic hash functions for tamper detection.", y: 3.9, c: 'E040FB' }
];

for(let s of stack) {
    slide5.addShape(pptx.ShapeType.rect, { x: 1, y: s.y, w: 0.2, h: 0.6, fill: { color: s.c } });
    slide5.addShape(pptx.ShapeType.rect, { x: 1.2, y: s.y, w: 7, h: 0.6, fill: { color: '1A2235' } });
    slide5.addText(s.title, { x: 1.5, y: s.y, w: 3, h: 0.6, fontSize: 16, bold: true, color: 'FFFFFF' });
    slide5.addText(s.desc, { x: 4.5, y: s.y, w: 3.5, h: 0.6, fontSize: 12, color: 'A0B2D0' });
}

// ── Slide 6: Task Allocation ───────────────────────────────────────────────────
let slide6 = pptx.addSlide({ masterName: 'DARK_MASTER' });
slide6.addText("Project Execution & Task Allocation", { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

addCard(slide6, 0.5, 1.5, 2.8, 3);
slide6.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.5, w: 2.8, h: 0.1, fill: { color: 'E040FB' } });
slide6.addText("Frontend & UI/UX", { x: 0.6, y: 1.7, w: 2.6, h: 0.4, fontSize: 16, bold: true, color: 'E040FB' });
slide6.addText("Yashaswini M\nSneha MC", { x: 0.6, y: 2.2, w: 2.6, h: 0.6, fontSize: 14, color: 'FFFFFF', bold: true });
slide6.addText("• Next.js Architecture\n• Tailwind Styling\n• API Integration", { x: 0.6, y: 2.9, w: 2.6, h: 1, fontSize: 12, color: 'A0B2D0' });

addCard(slide6, 3.6, 1.5, 2.8, 3);
slide6.addShape(pptx.ShapeType.rect, { x: 3.6, y: 1.5, w: 2.8, h: 0.1, fill: { color: '00F0FF' } });
slide6.addText("Backend Security", { x: 3.7, y: 1.7, w: 2.6, h: 0.4, fontSize: 16, bold: true, color: '00F0FF' });
slide6.addText("Chinmayi H", { x: 3.7, y: 2.2, w: 2.6, h: 0.4, fontSize: 14, color: 'FFFFFF', bold: true });
slide6.addText("• FastAPI Logic\n• AES-256 Encryption\n• SHA-256 Hashing", { x: 3.7, y: 2.7, w: 2.6, h: 1, fontSize: 12, color: 'A0B2D0' });

addCard(slide6, 6.7, 1.5, 2.8, 3);
slide6.addShape(pptx.ShapeType.rect, { x: 6.7, y: 1.5, w: 2.8, h: 0.1, fill: { color: '4CAF50' } });
slide6.addText("Database & Infra", { x: 6.8, y: 1.7, w: 2.6, h: 0.4, fontSize: 16, bold: true, color: '4CAF50' });
slide6.addText("Harshita B", { x: 6.8, y: 2.2, w: 2.6, h: 0.4, fontSize: 14, color: 'FFFFFF', bold: true });
slide6.addText("• PostgreSQL Schema\n• JWT Auth\n• Docker Setup", { x: 6.8, y: 2.7, w: 2.6, h: 1, fontSize: 12, color: 'A0B2D0' });


pptx.writeFile({ fileName: "../docs/SecureShare_Review_1_Presentation.pptx" }).then(fileName => {
    console.log(`Created file: ${fileName}`);
});
