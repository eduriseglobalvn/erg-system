export type InternalDocumentTypeId = "slides" | "textbook" | "program-plan" | "lesson-plan";

export type InternalDocumentType = {
  id: InternalDocumentTypeId;
  label: string;
  shortLabel: string;
  description: string;
};

export type InternalDocument = {
  id: string;
  type: InternalDocumentTypeId;
  title: string;
  description: string;
  programSlug: string;
  programName: string;
  moduleName: string;
  version: string;
  updatedAt: string;
  owner: string;
  format: string;
};

export const INTERNAL_DOCUMENT_TYPES: InternalDocumentType[] = [
  {
    id: "slides",
    label: "BÃ i giáº£ng",
    shortLabel: "Slide",
    description: "Deck trÃ¬nh chiáº¿u vÃ  ghi chÃº nhá»‹p giáº£ng Ä‘á»ƒ giÃ¡o viÃªn má»Ÿ lÃªn lÃ  dáº¡y Ä‘Æ°á»£c ngay.",
  },
  {
    id: "textbook",
    label: "GiÃ¡o trÃ¬nh",
    shortLabel: "GiÃ¡o trÃ¬nh",
    description: "TÃ i liá»‡u há»c, workbook vÃ  pháº§n Ä‘á»c thÃªm theo Ä‘Ãºng chÆ°Æ¡ng trÃ¬nh Ä‘ang triá»ƒn khai.",
  },
  {
    id: "program-plan",
    label: "PhÃ¢n phá»‘i chÆ°Æ¡ng trÃ¬nh",
    shortLabel: "PPCT",
    description: "Khung tuáº§n, sá»‘ buá»•i, má»¥c tiÃªu vÃ  nhá»‹p kiá»ƒm tra cho tá»«ng level hoáº·c module.",
  },
  {
    id: "lesson-plan",
    label: "GiÃ¡o Ã¡n",
    shortLabel: "GiÃ¡o Ã¡n",
    description: "Káº¿ hoáº¡ch dáº¡y theo buá»•i, gá»“m má»¥c tiÃªu, hoáº¡t Ä‘á»™ng lá»›p, kiá»ƒm tra nhanh vÃ  dáº·n dÃ².",
  },
];

export const INTERNAL_DOCUMENTS: InternalDocument[] = [
  {
    id: "ic3-gs6-l1-slide-01",
    type: "slides",
    title: "Slide buá»•i 01 - Thiáº¿t bá»‹ vÃ  há»‡ Ä‘iá»u hÃ nh",
    description: "Báº£n trÃ¬nh chiáº¿u má»Ÿ Ä‘áº§u Level 1, cÃ³ pháº§n khá»Ÿi Ä‘á»™ng vÃ  demo thao tÃ¡c cÆ¡ báº£n.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v2.1",
    updatedAt: "22/04/2026",
    owner: "Academic Team",
    format: "PPTX",
  },
  {
    id: "ic3-gs6-l1-slide-02",
    type: "slides",
    title: "Slide buá»•i 02 - Quáº£n lÃ½ tá»‡p vÃ  thÆ° má»¥c",
    description: "Deck thá»±c hÃ nh thao tÃ¡c file, folder, Ä‘Æ°á»ng dáº«n vÃ  quy táº¯c Ä‘áº·t tÃªn.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v2.0",
    updatedAt: "20/04/2026",
    owner: "Academic Team",
    format: "PPTX",
  },
  {
    id: "ic3-gs6-textbook-l1",
    type: "textbook",
    title: "GiÃ¡o trÃ¬nh IC3 GS6 Level 1 - Ná»n táº£ng mÃ¡y tÃ­nh",
    description: "Báº£n giÃ¡o trÃ¬nh chuáº©n cho há»c sinh, bÃ¡m sÃ¡t cÃ¡c chá»§ Ä‘á» ná»n táº£ng mÃ¡y tÃ­nh.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v1.8",
    updatedAt: "18/04/2026",
    owner: "Curriculum Team",
    format: "PDF",
  },
  {
    id: "ic3-gs6-workbook-l1",
    type: "textbook",
    title: "Workbook thá»±c hÃ nh IC3 GS6 Level 1",
    description: "BÃ i luyá»‡n theo chá»§ Ä‘á», dÃ¹ng cho hoáº¡t Ä‘á»™ng cÃ¡ nhÃ¢n hoáº·c bÃ i vá» nhÃ .",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v1.4",
    updatedAt: "15/04/2026",
    owner: "Curriculum Team",
    format: "PDF",
  },
  {
    id: "ic3-gs6-ppct-l1",
    type: "program-plan",
    title: "PPCT IC3 GS6 Level 1 - 7 chá»§ Ä‘á» / 14 buá»•i",
    description: "PhÃ¢n bá»• sá»‘ buá»•i, má»¥c tiÃªu tá»«ng chá»§ Ä‘á», bÃ i kiá»ƒm tra vÃ  má»‘c Ã´n táº­p.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v3.0",
    updatedAt: "12/04/2026",
    owner: "Academic Ops",
    format: "XLSX",
  },
  {
    id: "ic3-gs6-ppct-review",
    type: "program-plan",
    title: "PPCT Ã´n táº­p vÃ  kiá»ƒm tra cuá»‘i Level 1",
    description: "Nhá»‹p Ã´n táº­p, mock test, chá»¯a lá»—i vÃ  tiÃªu chÃ­ hoÃ n thÃ nh trÆ°á»›c khi lÃªn level tiáº¿p theo.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v1.2",
    updatedAt: "10/04/2026",
    owner: "Academic Ops",
    format: "XLSX",
  },
  {
    id: "ic3-gs6-lesson-01",
    type: "lesson-plan",
    title: "GiÃ¡o Ã¡n buá»•i 01 - Thiáº¿t bá»‹ vÃ  há»‡ Ä‘iá»u hÃ nh",
    description: "Ká»‹ch báº£n dáº¡y 90 phÃºt, gá»“m warm-up, demo, thá»±c hÃ nh vÃ  exit ticket.",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v2.3",
    updatedAt: "22/04/2026",
    owner: "Mentor Team",
    format: "DOCX",
  },
  {
    id: "ic3-gs6-lesson-02",
    type: "lesson-plan",
    title: "GiÃ¡o Ã¡n buá»•i 02 - Quáº£n lÃ½ tá»‡p",
    description: "Káº¿ hoáº¡ch lá»›p cÃ³ hoáº¡t Ä‘á»™ng nhÃ³m, checkpoint giá»¯a buá»•i vÃ  bÃ i luyá»‡n cuá»‘i giá».",
    programSlug: "ic3-gs6",
    programName: "IC3 GS6",
    moduleName: "Computing Fundamentals",
    version: "v2.1",
    updatedAt: "20/04/2026",
    owner: "Mentor Team",
    format: "DOCX",
  },
  {
    id: "mos-slide-word",
    type: "slides",
    title: "Slide Word Specialist - Styles vÃ  References",
    description: "BÃ i giáº£ng thao tÃ¡c Word theo objective thi MOS.",
    programSlug: "mos",
    programName: "MOS Master",
    moduleName: "Word Specialist",
    version: "v1.6",
    updatedAt: "16/04/2026",
    owner: "MOS Team",
    format: "PPTX",
  },
  {
    id: "tech-lesson-scratch",
    type: "lesson-plan",
    title: "GiÃ¡o Ã¡n Scratch - Mini game Ä‘áº§u tiÃªn",
    description: "Buá»•i há»c theo project nhá», cÃ³ checklist há»— trá»£ nhÃ³m há»c nhanh vÃ  nhÃ³m cáº§n kÃ¨m.",
    programSlug: "tech",
    programName: "AI & Programming",
    moduleName: "Scratch Programming",
    version: "v1.1",
    updatedAt: "09/04/2026",
    owner: "Tech Team",
    format: "DOCX",
  },
];

export function getInternalDocumentsByProgram(programSlug: string) {
  return INTERNAL_DOCUMENTS.filter((document) => document.programSlug === programSlug);
}

export function getInternalDocumentsByType(type: InternalDocumentTypeId, documents = INTERNAL_DOCUMENTS) {
  return documents.filter((document) => document.type === type);
}

export function getInternalDocumentType(type: InternalDocumentTypeId) {
  return INTERNAL_DOCUMENT_TYPES.find((item) => item.id === type);
}
