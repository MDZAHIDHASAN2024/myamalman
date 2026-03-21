// This generates the PWA icon
const fs = require('fs');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d4f2e"/>
      <stop offset="100%" style="stop-color:#1a7a4a"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#4ade80;stop-opacity:0"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="110" fill="url(#bg)"/>
  <!-- Glow overlay -->
  <rect width="512" height="512" rx="110" fill="url(#glow)"/>
  <!-- Stars -->
  <circle cx="80" cy="80" r="3" fill="#4ade80" opacity="0.6"/>
  <circle cx="430" cy="100" r="2" fill="#4ade80" opacity="0.4"/>
  <circle cx="60" cy="380" r="2" fill="#4ade80" opacity="0.3"/>
  <circle cx="450" cy="420" r="3" fill="#4ade80" opacity="0.5"/>
  <circle cx="120" cy="200" r="1.5" fill="white" opacity="0.4"/>
  <circle cx="390" cy="300" r="1.5" fill="white" opacity="0.3"/>
  <!-- Crescent Moon -->
  <path d="M 230 130 
    A 110 110 0 1 1 380 280
    A 75 75 0 1 0 230 130 Z" 
    fill="#f0fdf4" opacity="0.95"/>
  <!-- Star next to moon -->
  <polygon points="390,145 396,162 414,162 400,173 405,190 390,180 375,190 380,173 366,162 384,162" 
    fill="#fbbf24" opacity="0.9"/>
  <!-- "আমল" Arabic-style text decoration line -->
  <rect x="156" y="355" width="200" height="3" rx="2" fill="#22c55e" opacity="0.7"/>
  <!-- App name -->
  <text x="256" y="400" font-family="Arial, sans-serif" font-size="52" font-weight="900" 
    text-anchor="middle" fill="white" letter-spacing="2">My Amal</text>
  <text x="256" y="445" font-family="Arial, sans-serif" font-size="26" font-weight="500"
    text-anchor="middle" fill="#86efac" letter-spacing="1">আমার আমল</text>
  <!-- Small mosque silhouette at bottom -->
  <g transform="translate(196, 290)" opacity="0.25" fill="#4ade80">
    <rect x="50" y="40" width="20" height="30"/>
    <rect x="50" y="40" width="20" height="5" rx="2"/>
    <polygon points="60,20 45,40 75,40"/>
    <rect x="55" y="10" width="10" height="15"/>
    <polygon points="60,2 54,10 66,10"/>
    <rect x="20" y="50" width="30" height="20"/>
    <rect x="70" y="50" width="30" height="20"/>
    <rect x="22" y="52" width="10" height="12" rx="5" fill="#0d4f2e" opacity="0.5"/>
    <rect x="38" y="52" width="10" height="12" rx="5" fill="#0d4f2e" opacity="0.5"/>
    <rect x="72" y="52" width="10" height="12" rx="5" fill="#0d4f2e" opacity="0.5"/>
    <rect x="88" y="52" width="10" height="12" rx="5" fill="#0d4f2e" opacity="0.5"/>
  </g>
</svg>`;

fs.writeFileSync('/home/claude/my-amal/frontend/public/icon-512.svg', svg);
console.log('SVG icon generated');
