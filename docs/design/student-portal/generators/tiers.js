// 8 student tiers (Bậc): thresholds by total course XP, avatar frames and shield emblems.
const TIERS = [
  // band = share of the grade (khối) from the top; count = seats in a 128-student grade; min/max only drive the sample data.
  { key: "go", name: "Gỗ", band: "6% cuối", count: 7, min: 0, max: 299, icon: "forest" },
  { key: "sat", name: "Sắt", band: "Top 82–94%", count: 15, min: 300, max: 799, icon: "hardware" },
  { key: "dong", name: "Đồng", band: "Top 65–82%", count: 22, min: 800, max: 1499, icon: "shield" },
  { key: "bac", name: "Bạc", band: "Top 45–65%", count: 26, min: 1500, max: 2499, icon: "shield" },
  { key: "vang", name: "Vàng", band: "Top 25–45%", count: 25, min: 2500, max: 3999, icon: "star" },
  { key: "bk", name: "Bạch kim", band: "Top 12–25%", count: 17, min: 4000, max: 5999, icon: "auto_awesome" },
  { key: "kc", name: "Kim cương", band: "Top 3–12%", count: 12, min: 6000, max: 8999, icon: "diamond" },
  { key: "ct", name: "Cao thủ", band: "Top 3%", count: 4, min: 9000, max: null, icon: "crown" },
];

const css = `
.fr{position:relative;display:inline-grid;place-items:center;border-radius:50%;padding:3px;flex-shrink:0}
.fr>.av{border:2px solid #fff;margin:0}
.fr.t-go{background:repeating-linear-gradient(115deg,#8B5A2B 0 4px,#A9743F 4px 7px,#6E4520 7px 9px)}
.fr.t-sat{background:conic-gradient(from 200deg,#5B636E,#A3ABB5,#4A515B,#8E96A0,#5B636E)}
.fr.t-dong{background:conic-gradient(from 200deg,#9A4E1F,#E3A06B,#8A431A,#D08850,#9A4E1F)}
.fr.t-bac{background:conic-gradient(from 200deg,#8A94A6,#F4F6F9,#7C8698,#DCE1E8,#8A94A6)}
.fr.t-vang{background:conic-gradient(from 200deg,#B07A00,#FFE08A,#A86F00,#F2C94C,#B07A00);box-shadow:0 0 0 2px #FFF3CC}
.fr.t-bk{background:conic-gradient(from 200deg,#2E8F86,#B9F3EA,#227A72,#7FD9CD,#2E8F86);box-shadow:0 0 0 2px #DDF7F3}
.fr.t-kc{background:conic-gradient(from 200deg,#2D5BD8,#A8C8FF,#6C3FD1,#7FB2FF,#3B6CF0,#C9B6FF,#2D5BD8);box-shadow:0 0 0 2px #E3ECFF,0 0 14px rgba(59,108,240,.35)}
.fr.t-ct{background:conic-gradient(from 200deg,#7A1FA2,#F2C94C,#B0266B,#FFE08A,#7A1FA2);box-shadow:0 0 0 2px #FBE7FF,0 0 16px rgba(176,38,107,.35)}
.fr .gem{position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);height:16px;min-width:16px;padding:0 5px;border-radius:999px;display:inline-grid;place-items:center;font-size:9px;font-weight:700;color:#fff;border:1.5px solid #fff;white-space:nowrap}
.fr .crn{position:absolute;top:-13px;left:50%;transform:translateX(-50%);font-size:18px;color:#E2A400;filter:drop-shadow(0 1px 0 #8F6200)}
.g-go{background:#8B5A2B}.g-sat{background:#5B636E}.g-dong{background:#B4632B}.g-bac{background:#8A94A6}.g-vang{background:#C98A04}.g-bk{background:#2E8F86}.g-kc{background:linear-gradient(90deg,#2D5BD8,#6C3FD1)}.g-ct{background:linear-gradient(90deg,#7A1FA2,#B0266B)}
.emb{position:relative;display:inline-grid;place-items:center;clip-path:polygon(50% 0,100% 16%,100% 60%,50% 100%,0 60%,0 16%);color:#fff;font-weight:700}
.emb::after{content:"";position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.55),rgba(255,255,255,0) 50%);pointer-events:none}
.emb .ms{position:relative;z-index:1;filter:drop-shadow(0 1px 0 rgba(0,0,0,.25))}
.emb.t-go{background:linear-gradient(#B07A45,#6E4520)}.emb.t-sat{background:linear-gradient(#A3ABB5,#4A515B)}.emb.t-dong{background:linear-gradient(#E3A06B,#8A431A)}.emb.t-bac{background:linear-gradient(#F4F6F9,#7C8698);color:#3D4553}
.emb.t-vang{background:linear-gradient(#FFE08A,#A86F00)}.emb.t-bk{background:linear-gradient(#B9F3EA,#227A72)}.emb.t-kc{background:linear-gradient(#A8C8FF,#3B6CF0 55%,#6C3FD1)}.emb.t-ct{background:linear-gradient(#FFE08A,#B0266B 45%,#7A1FA2)}
.tchip{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px 0 6px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;white-space:nowrap}
.tchip.t-bac{color:#3D4553;background:linear-gradient(90deg,#DCE1E8,#AEB6C3)}
`;

// Framed avatar. size in px of inner avatar.
function frame(key, ini, size, opts) {
  opts = opts || {};
  const fs = Math.round(size * 0.36);
  const avStyle = `width:${size}px;height:${size}px;font-size:${fs}px;${opts.avStyle || "background:var(--nt);color:var(--nx)"}`;
  const crown = key === "ct" ? `<span class="ms f crn" aria-hidden="true">crown</span>` : "";
  const gem = opts.gem ? `<span class="gem g-${key}">${opts.gem}</span>` : "";
  return `<span class="fr t-${key}">${crown}<span class="av" style="${avStyle}">${ini}</span>${gem}</span>`;
}

function emblem(key, size, label) {
  const t = TIERS.find((x) => x.key === key);
  return `<span class="emb t-${key}" style="width:${size}px;height:${Math.round(size * 1.12)}px" aria-label="${label || t.name}"><span class="ms f" style="font-size:${Math.round(size * 0.46)}px" aria-hidden="true">${t.icon}</span></span>`;
}

function chip(key, text) {
  return `<span class="tchip g-${key} t-${key}">${text}</span>`;
}

module.exports = { TIERS, css, frame, emblem, chip };
