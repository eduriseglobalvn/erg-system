import { appFontStack } from "@/config/fonts";
import type { IntroSlideKind, QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type IconProps = {
  className?: string;
};

const line = "#708fb3";
const lineStrong = "#4f83bc";
const fillSoft = "#d9ebff";
const fillAccent = "#79a9db";
const green = "#4aa34b";
const orange = "#e69647";
const gray = "#6f6f6f";

export function OfficeQuestionToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="4" fill={green} />
      <path d="M5 2.7v4.6M2.7 5h4.6" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="8.5" y="4" width="11" height="14" rx="1" stroke={gray} strokeWidth="1.2" />
      <path d="M11 8.4h6.3M11 11.4h6.3M11 14.4h3.8" stroke={line} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OfficeInfoSlideToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M7 4.2h7l3 3v12H7z" stroke={gray} strokeWidth="1.2" />
      <path d="M14 4.2v3h3" stroke={gray} strokeWidth="1.2" />
      <circle cx="5" cy="6" r="3.1" fill={green} />
      <path d="M5 4.4v3.2M3.4 6h3.2" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OfficeQuestionGroupToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4.5" y="5" width="5" height="4" stroke={gray} strokeWidth="1.1" />
      <rect x="4.5" y="10.5" width="5" height="4" stroke={gray} strokeWidth="1.1" />
      <rect x="4.5" y="16" width="5" height="4" stroke={gray} strokeWidth="1.1" />
      <path d="M12.5 7h7M12.5 12.5h7M12.5 18h7" stroke={line} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function OfficeIntroductionToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="6.5" y="3.8" width="11" height="16.4" rx="1.3" stroke={orange} strokeWidth="1.4" />
      <path d="M9.7 8.2h4.6M9.7 11.5h4.6M9.7 14.8h3.2" stroke={orange} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="6.5" r="1.2" fill={orange} />
    </svg>
  );
}

export function OfficeDuplicateToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="8.5" y="7.5" width="10" height="10" stroke={gray} strokeWidth="1.2" />
      <rect x="5.5" y="4.5" width="10" height="10" stroke={gray} strokeWidth="1.2" />
    </svg>
  );
}

export function OfficeLinkToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9.2 13.8l-1.7 1.7a3 3 0 0 1-4.3-4.3l2.5-2.4a3 3 0 0 1 4.2 0" stroke={gray} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14.8 10.2l1.7-1.7a3 3 0 1 1 4.3 4.3l-2.5 2.4a3 3 0 0 1-4.2 0" stroke={gray} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 15l6-6" stroke={line} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function OfficeImportToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M7 4.5h7l3 3v12H7z" stroke={gray} strokeWidth="1.2" />
      <path d="M12 7.5v8.5" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.8 13.2L12 16.5l3.2-3.3" stroke={green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OfficeCopyToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="9" y="7" width="9" height="11" stroke={gray} strokeWidth="1.2" />
      <path d="M6 15V5.8h8.2" stroke={gray} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 10h4.5M11 13h4.5" stroke={line} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OfficePasteToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M8 6h8v12H6V8" stroke={gray} strokeWidth="1.2" />
      <rect x="9" y="4" width="4" height="3" rx="0.8" stroke={gray} strokeWidth="1.1" />
      <path d="M11 10.2h4M11 13.2h4" stroke={line} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OfficeCutToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="7" cy="16.5" r="2.3" stroke={gray} strokeWidth="1.2" />
      <circle cx="15.8" cy="16.5" r="2.3" stroke={gray} strokeWidth="1.2" />
      <path d="M9 14.8l6.8-8.3M14.9 14.8L8 6.5" stroke={gray} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 12l2.1 2.5" stroke={line} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OfficePictureToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4.5" y="5.5" width="15" height="11.5" stroke={gray} strokeWidth="1.2" />
      <circle cx="9" cy="9" r="1.5" fill={fillAccent} />
      <path d="M6.5 14.5l3.8-3.8 2.5 2.2 2.2-1.8 2.5 3.4" stroke={line} strokeWidth="1.1" fill="none" />
    </svg>
  );
}

export function OfficeEquationToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6 8h12M6 16h12" stroke={gray} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 6l6 12" stroke={lineStrong} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M7 12h10" stroke={lineStrong} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function OfficeVideoToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4.5" y="6" width="11.5" height="9.5" stroke={gray} strokeWidth="1.2" />
      <path d="M16 9.3l3.8-2.2v7l-3.8-2.2" stroke={gray} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M9 8.5l3.5 2.2L9 13z" fill={lineStrong} />
    </svg>
  );
}

export function OfficeAudioToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M6 14h3.6l3.4 3V7l-3.4 3H6z" stroke={gray} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M15.8 10.2a3.3 3.3 0 0 1 0 3.6M17.8 8.3a5.8 5.8 0 0 1 0 7.4" stroke={line} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OfficeTranslationToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4.5" y="4.5" width="7" height="9.5" stroke={lineStrong} strokeWidth="1.2" />
      <rect x="12.5" y="10" width="7" height="9.5" stroke={orange} strokeWidth="1.2" />
      <text x="8" y="11.3" textAnchor="middle" fontSize="7" fill={lineStrong} fontFamily={appFontStack}>A</text>
      <text x="16" y="16.9" textAnchor="middle" fontSize="6.5" fill={orange} fontFamily={appFontStack}>文</text>
    </svg>
  );
}

export function OfficePropertiesToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke={gray} strokeWidth="1.2" />
      <path d="M12 6.7v2.1M12 15.2v2.1M17.3 12h-2.1M8.8 12H6.7M15.8 8.2l-1.5 1.5M9.7 14.3l-1.5 1.5M8.2 8.2l1.5 1.5M14.3 14.3l1.5 1.5" stroke={gray} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.4" fill={fillSoft} stroke={lineStrong} strokeWidth="1.1" />
    </svg>
  );
}

export function OfficePlayerToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="4.5" y="5.5" width="15" height="12" stroke={gray} strokeWidth="1.2" />
      <path d="M10 9l5 2.7-5 2.8z" fill={lineStrong} />
      <path d="M7 18.5h10" stroke={gray} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function OfficePreviewToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M5.5 12c1.9-3.2 4.1-4.8 6.5-4.8S16.6 8.8 18.5 12c-1.9 3.2-4.1 4.8-6.5 4.8S7.4 15.2 5.5 12z" stroke={gray} strokeWidth="1.2" />
      <circle cx="12" cy="12" r="2.4" fill={fillSoft} stroke={lineStrong} strokeWidth="1.1" />
    </svg>
  );
}

export function OfficePublishToolbarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="10.5" r="6.2" stroke="#8aaed7" strokeWidth="1.1" />
      <path d="M5.8 10.5h12.4M12 4.3c1.7 1.7 2.7 3.8 2.7 6.2 0 2.4-1 4.5-2.7 6.2-1.7-1.7-2.7-3.8-2.7-6.2 0-2.4 1-4.5 2.7-6.2z" stroke="#8aaed7" strokeWidth="1.1" />
      <path d="M16.5 13.7v5.3M13.8 16.4l2.7-2.7 2.7 2.7" stroke={green} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OfficeSearchSmallIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" aria-hidden="true">
      <circle cx="6.7" cy="6.7" r="4.6" stroke="#a1a1a1" strokeWidth="1.1" />
      <path d="M10.2 10.2l3 3" stroke="#a1a1a1" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function OfficeChevronDownSmallIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="none" aria-hidden="true">
      <path d="M2.5 4.2L6 7.8l3.5-3.6" stroke="#8a8a8a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClassicQuestionPreview({ type }: { type: QuestionType }) {
  return (
    <svg viewBox="0 0 81 58" width="81" height="58" aria-hidden="true">
      <rect x="0.5" y="0.5" width="80" height="57" fill="#fcfcfc" stroke="#7d7d7d" />
      <rect x="1" y="1" width="79" height="6" fill="#86b6e3" />
      <line x1="1" y1="7" x2="80" y2="7" stroke={lineStrong} strokeWidth="1" />
      <g transform="translate(10 14)">
        <QuestionArt type={type} />
      </g>
    </svg>
  );
}

export function ClassicIntroPreview({ type }: { type: IntroSlideKind }) {
  return (
    <svg viewBox="0 0 81 58" width="81" height="58" aria-hidden="true">
      <rect x="0.5" y="0.5" width="80" height="57" fill="#fcfcfc" stroke="#7d7d7d" />
      <rect x="1" y="1" width="79" height="6" fill="#86b6e3" />
      <line x1="1" y1="7" x2="80" y2="7" stroke={lineStrong} strokeWidth="1" />
      <g transform="translate(12 14)">
        {type === "intro-slide" ? (
          <>
            <rect x="8" y="4" width="36" height="10" fill={fillSoft} />
            <text x="26" y="11" textAnchor="middle" fontSize="6" fill={lineStrong} fontFamily={appFontStack}>Welcome</text>
            <line x1="16" y1="22" x2="35" y2="22" stroke={line} strokeWidth="1" />
            <line x1="12" y1="28" x2="39" y2="28" stroke={line} strokeWidth="1" />
          </>
        ) : null}
        {type === "user-info" ? (
          <>
            <circle cx="10" cy="13" r="8.5" fill="#cfe4fa" stroke={lineStrong} />
            <line x1="27" y1="8" x2="43" y2="8" stroke={line} strokeWidth="1" />
            <line x1="27" y1="14" x2="43" y2="14" stroke={line} strokeWidth="1" />
            <line x1="27" y1="20" x2="39" y2="20" stroke={line} strokeWidth="1" />
          </>
        ) : null}
        {type === "instruction-slide" ? (
          <>
            <circle cx="10" cy="13" r="8.5" fill="#fff" stroke={lineStrong} />
            <text x="10" y="16" textAnchor="middle" fontSize="11" fill={lineStrong} fontFamily={appFontStack}>!</text>
            <line x1="27" y1="8" x2="43" y2="8" stroke={line} strokeWidth="1" />
            <line x1="27" y1="14" x2="43" y2="14" stroke={line} strokeWidth="1" />
            <line x1="27" y1="20" x2="39" y2="20" stroke={line} strokeWidth="1" />
          </>
        ) : null}
      </g>
    </svg>
  );
}

function QuestionArt({ type }: { type: QuestionType }) {
  if (type === "multiple-choice" || type === "multiple-response" || type === "true-false") {
    return (
      <>
        {[0, 1, 2].map((index) => (
          <g key={index} transform={`translate(0 ${index * 10})`}>
            <rect
              x="0.5"
              y="0.5"
              width="8"
              height="8"
              rx={type === "multiple-choice" ? 4 : 1}
              fill={type === "true-false" && index < 2 ? fillAccent : "#fff"}
              stroke={line}
            />
            {type === "true-false" && index === 2 ? (
              <text x="4.5" y="6.7" textAnchor="middle" fontSize="7" fill={line} fontFamily={appFontStack}>x</text>
            ) : null}
            <line x1="15" y1="3" x2={index === 1 ? 33 : 39} y2="3" stroke={line} strokeWidth="1" />
            <line x1="15" y1="7" x2={index === 1 ? 29 : 36} y2="7" stroke={line} strokeWidth="1" />
          </g>
        ))}
      </>
    );
  }

  if (type === "short-answer") {
    return (
      <>
        <line x1="5" y1="3" x2="28" y2="3" stroke={line} strokeWidth="1" />
        <line x1="5" y1="7" x2="24" y2="7" stroke={line} strokeWidth="1" />
        <line x1="5" y1="11" x2="31" y2="11" stroke={line} strokeWidth="1" />
        <rect x="3.5" y="17.5" width="57" height="16" fill="#fff" stroke={line} />
        <text x="11" y="29" fontSize="10" fill={lineStrong} fontFamily={appFontStack}>abc</text>
      </>
    );
  }

  if (type === "numeric") {
        return (
      <>
        <line x1="5" y1="3" x2="28" y2="3" stroke={line} strokeWidth="1" />
        <line x1="5" y1="7" x2="24" y2="7" stroke={line} strokeWidth="1" />
        <rect x="3.5" y="17.5" width="57" height="16" fill="#fff" stroke={line} />
        <text x="9" y="29" fontSize="10" fill={lineStrong} fontFamily={appFontStack}>123</text>
        <line x1="50" y1="18" x2="50" y2="33" stroke={line} />
        <text x="52.5" y="25.4" fontSize="7" fill={lineStrong} fontFamily={appFontStack}>v</text>
        <text x="52.5" y="31.4" fontSize="7" fill={lineStrong} fontFamily={appFontStack}>^</text>
      </>
    );
  }

  if (type === "sequence") {
    return (
      <>
        {[1, 2, 3].map((index) => (
          <g key={index} transform={`translate(0 ${(index - 1) * 11})`}>
            <text x="0" y="8" fontSize="9" fill={lineStrong} fontFamily={appFontStack}>{index}</text>
            <rect x="10.5" y="1.5" width="32" height="8" fill={index === 2 ? fillSoft : "#fff"} stroke={line} />
          </g>
        ))}
        <path d="M46 14l6 4-4 1 2 5-2.2.8-2-5-2.8 2z" fill="#fff" stroke={lineStrong} strokeWidth="0.7" />
      </>
    );
  }

  if (type === "matching") {
    return (
      <>
        {[0, 1, 2].map((index) => (
          <g key={index} transform={`translate(0 ${index * 11})`}>
            <rect x="0.5" y="1.5" width="18" height="7" fill="#fff" stroke={line} />
            <rect x="26.5" y="1.5" width="18" height="7" fill={fillSoft} stroke={line} />
          </g>
        ))}
        <path d="M45 11l6 4-4 1 2 5-2.2.8-2-5-2.8 2z" fill="#fff" stroke={lineStrong} strokeWidth="0.7" />
        <path d="M45 22l6 4-4 1 2 5-2.2.8-2-5-2.8 2z" fill="#fff" stroke={lineStrong} strokeWidth="0.7" />
      </>
    );
  }

  if (type === "fill-in-the-blanks") {
    return (
      <>
        <line x1="5" y1="6" x2="26" y2="6" stroke={line} strokeWidth="1" />
        <rect x="31.5" y="1.5" width="21" height="9" rx="5" fill="#fff" stroke={line} />
        <line x1="5" y1="20" x2="18" y2="20" stroke={line} strokeWidth="1" />
        <rect x="23.5" y="15.5" width="21" height="9" rx="5" fill="#fff" stroke={line} />
        <line x1="49" y1="20" x2="59" y2="20" stroke={line} strokeWidth="1" />
      </>
    );
  }

  if (type === "select-from-lists") {
    return (
      <>
        {[0, 1].map((index) => (
          <g key={index} transform={`translate(0 ${index * 12})`}>
            <line x1="0" y1="6" x2="12" y2="6" stroke={line} strokeWidth="1" />
            <rect x="18.5" y="1.5" width="18" height="9" fill="#fff" stroke={line} />
            <text x="30" y="8.5" fontSize="7" fill={lineStrong} fontFamily={appFontStack}>v</text>
            <line x1="41" y1="6" x2="57" y2="6" stroke={line} strokeWidth="1" />
          </g>
        ))}
      </>
    );
  }

  if (type === "drag-the-words") {
    return (
      <>
        <rect x="2.5" y="6.5" width="18" height="8" fill="#fff" stroke={line} />
        <line x1="25" y1="10" x2="39" y2="10" stroke={line} strokeWidth="1" />
        <rect x="2.5" y="22.5" width="18" height="8" fill={fillSoft} stroke={line} />
        <path d="M26 18l6 4-4 1 2 5-2.2.8-2-5-2.8 2z" fill="#fff" stroke={lineStrong} strokeWidth="0.7" />
        <rect x="35.5" y="22.5" width="18" height="8" fill="#fff" stroke={line} />
      </>
    );
  }

  if (type === "hotspot") {
    return (
      <>
        <rect x="4.5" y="4.5" width="52" height="26" fill={fillSoft} stroke={line} />
        <path d="M4 26c6-8 11-3 17-11 5 7 8 6 14-1 4 2 8 6 21 12" stroke={line} strokeWidth="1" fill="none" />
        <circle cx="34" cy="16" r="6" fill="none" stroke={lineStrong} strokeWidth="1.6" />
        <path d="M40 20l6 6" stroke={lineStrong} strokeWidth="1.6" strokeLinecap="round" />
      </>
    );
  }

  if (type === "drag-and-drop") {
    return (
      <>
        <rect x="10.5" y="8.5" width="21" height="17" fill="none" stroke={line} strokeDasharray="2 2" />
        <rect x="39.5" y="9.5" width="9" height="9" fill="#fff" stroke={line} />
        <rect x="39.5" y="22.5" width="9" height="9" fill="#fff" stroke={line} />
        <rect x="51.5" y="9.5" width="9" height="9" fill="#fff" stroke={line} />
        <rect x="51.5" y="22.5" width="9" height="9" fill="#fff" stroke={line} />
        <path d="M34 16l6 4-4 1 2 5-2.2.8-2-5-2.8 2z" fill="#fff" stroke={lineStrong} strokeWidth="0.7" />
      </>
    );
  }

  if (type === "likert-scale") {
    return (
      <>
        {[0, 1, 2].map((index) => (
          <g key={index} transform={`translate(0 ${index * 10})`}>
            <line x1="0" y1="5" x2="11" y2="5" stroke={line} strokeWidth="1" />
            {[0, 1, 2].map((dot) => (
              <circle key={dot} cx={22 + dot * 11} cy="5" r="4" fill="#fff" stroke={line} />
            ))}
          </g>
        ))}
      </>
    );
  }

  return (
    <>
      <rect x="10.5" y="6.5" width="36" height="12" fill="#fff" stroke={line} />
      <rect x="10.5" y="24.5" width="36" height="12" fill="#fff" stroke={line} />
      <text x="34" y="33.5" fontSize="8" fill={lineStrong} fontFamily={appFontStack}>pen</text>
    </>
  );
}
