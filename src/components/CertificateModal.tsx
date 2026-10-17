import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, Award, Sparkles, Check, Share2, Printer } from 'lucide-react';
import { WorldId } from '../game/types';
import { WORLDS } from '../game/constants';
import { sound } from '../game/audio';

interface CertificateModalProps {
  highScore: number;
  totalGems: number;
  highestWorldId: WorldId;
  onClose: () => void;
}

const SAVED_NAME_KEY = 'cosmic_gem_rush_player_name';

export const CertificateModal: React.FC<CertificateModalProps> = ({
  highScore,
  totalGems,
  highestWorldId,
  onClose,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem(SAVED_NAME_KEY) || '';
    } catch {
      return '';
    }
  });
  const [isGenerated, setIsGenerated] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const world = WORLDS[highestWorldId];

  // Render Certificate onto Canvas
  const drawCertificate = useCallback((nameToRender: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1600;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    // 1. Deep Space Cosmic Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#060a17');
    bgGrad.addColorStop(0.3, '#0b1329');
    bgGrad.addColorStop(0.7, '#160d2b');
    bgGrad.addColorStop(1, '#080514');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Cosmic Nebulae Clouds
    const nebulaGrad1 = ctx.createRadialGradient(250, 250, 20, 250, 250, 450);
    nebulaGrad1.addColorStop(0, 'rgba(6, 182, 212, 0.18)');
    nebulaGrad1.addColorStop(1, 'transparent');
    ctx.fillStyle = nebulaGrad1;
    ctx.fillRect(0, 0, width, height);

    const nebulaGrad2 = ctx.createRadialGradient(1350, 750, 30, 1350, 750, 500);
    nebulaGrad2.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
    nebulaGrad2.addColorStop(1, 'transparent');
    ctx.fillStyle = nebulaGrad2;
    ctx.fillRect(0, 0, width, height);

    const nebulaGrad3 = ctx.createRadialGradient(800, 500, 10, 800, 500, 600);
    nebulaGrad3.addColorStop(0, 'rgba(251, 191, 36, 0.09)');
    nebulaGrad3.addColorStop(1, 'transparent');
    ctx.fillStyle = nebulaGrad3;
    ctx.fillRect(0, 0, width, height);

    // 3. Stardust & Constellations
    ctx.fillStyle = '#ffffff';
    const starCoords = [
      [120, 150, 2], [300, 110, 3], [520, 180, 1.5], [1100, 120, 2.5], [1450, 160, 2],
      [180, 820, 2], [420, 880, 1.5], [1200, 850, 2.5], [1480, 820, 3], [130, 480, 1.5],
      [1490, 490, 2], [700, 160, 2], [900, 140, 1.5]
    ];
    starCoords.forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle cross
      if (r >= 2.5) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.stroke();
      }
    });

    // 4. Ornate Double Gold Borders
    const insetOuter = 40;
    const insetInner = 56;

    // Outer border
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(insetOuter, insetOuter, width - insetOuter * 2, height - insetOuter * 2);

    // Inner fine border
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(insetInner, insetInner, width - insetInner * 2, height - insetInner * 2);

    // Corner Ornaments
    const drawCorner = (cx: number, cy: number, rot: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(35, 0);
      ctx.lineTo(35, 12);
      ctx.lineTo(12, 12);
      ctx.lineTo(12, 35);
      ctx.lineTo(0, 35);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(18, 18, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    drawCorner(insetInner + 2, insetInner + 2, 0);
    drawCorner(width - insetInner - 2, insetInner + 2, Math.PI / 2);
    drawCorner(width - insetInner - 2, height - insetInner - 2, Math.PI);
    drawCorner(insetInner + 2, height - insetInner - 2, -Math.PI / 2);

    // 5. Header Emblem & Title
    // Crest Star
    ctx.save();
    ctx.translate(width / 2, 130);
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Star icon
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? 24 : 10;
      const px = Math.cos(angle - Math.PI / 2) * r;
      const py = Math.sin(angle - Math.PI / 2) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Top Sub-header
    ctx.textAlign = 'center';
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.letterSpacing = '6px';
    ctx.fillText('COSMIC GEM RUSH ACADEMY · INTERSTELLAR ARCHIVES', width / 2, 185);

    // Main Certificate Title
    ctx.font = '900 48px "Cinzel", Georgia, serif';
    const goldTextGrad = ctx.createLinearGradient(0, 200, 0, 260);
    goldTextGrad.addColorStop(0, '#ffffff');
    goldTextGrad.addColorStop(0.3, '#fef08a');
    goldTextGrad.addColorStop(0.7, '#fbbf24');
    goldTextGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = goldTextGrad;
    ctx.shadowColor = 'rgba(251, 191, 36, 0.4)';
    ctx.shadowBlur = 14;
    ctx.letterSpacing = '4px';
    ctx.fillText('CERTIFICATE OF GALACTIC EXCELLENCE', width / 2, 245);
    ctx.shadowBlur = 0;

    // Divider Line
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 250, 275);
    ctx.lineTo(width / 2 + 250, 275);
    ctx.stroke();

    // Diamond marker on line
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(width / 2 - 4, 271, 8, 8);

    // Subtitle
    ctx.font = 'italic 500 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.letterSpacing = '2px';
    ctx.fillText('This is officially presented to honor the outstanding galactic voyager', width / 2, 325);

    // 6. Recipient Name Box
    const displayName = nameToRender.trim() || 'COSMIC VOYAGER';
    ctx.font = '800 52px "Cinzel", Georgia, serif';
    const nameGrad = ctx.createLinearGradient(0, 360, 0, 420);
    nameGrad.addColorStop(0, '#38bdf8');
    nameGrad.addColorStop(0.5, '#ffffff');
    nameGrad.addColorStop(1, '#a855f7');
    ctx.fillStyle = nameGrad;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 18;
    ctx.letterSpacing = '3px';
    ctx.fillText(displayName.toUpperCase(), width / 2, 400);
    ctx.shadowBlur = 0;

    // Underline beneath name
    const nameMetrics = ctx.measureText(displayName.toUpperCase());
    const underlineW = Math.max(340, nameMetrics.width + 80);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - underlineW / 2, 425);
    ctx.lineTo(width / 2 + underlineW / 2, 425);
    ctx.stroke();

    // 7. Citation Body
    ctx.font = '400 19px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '1px';
    ctx.fillText(
      'for demonstrating peerless speed, razor reflexes, and intrepid courage by conquering the cosmic perils of',
      width / 2,
      475
    );

    // Highlight Realm
    ctx.font = '700 24px "Outfit", sans-serif';
    ctx.fillStyle = world.themeColor;
    ctx.fillText(`${world.name.toUpperCase()} (${world.subtitle})`, width / 2, 515);

    // 8. Official Record Plaque
    const plaqueY = 555;
    const plaqueW = 760;
    const plaqueH = 110;
    const plaqueX = width / 2 - plaqueW / 2;

    const plaqueGrad = ctx.createLinearGradient(plaqueX, plaqueY, plaqueX + plaqueW, plaqueY + plaqueH);
    plaqueGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    plaqueGrad.addColorStop(1, 'rgba(30, 41, 59, 0.85)');
    ctx.fillStyle = plaqueGrad;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(plaqueX, plaqueY, plaqueW, plaqueH, 16);
    ctx.fill();
    ctx.stroke();

    // Plaque Content: Score, Gems, Rank
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('OFFICIAL GALACTIC HIGH SCORE', width / 2 - 230, plaqueY + 36);

    ctx.font = '900 38px "Outfit", monospace';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(highScore.toLocaleString(), width / 2 - 230, plaqueY + 80);

    // Divider in plaque
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 90, plaqueY + 18);
    ctx.lineTo(width / 2 - 90, plaqueY + plaqueH - 18);
    ctx.stroke();

    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('TOTAL GEMS HARVESTED', width / 2 + 50, plaqueY + 36);

    ctx.font = '900 38px "Outfit", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(totalGems.toLocaleString(), width / 2 + 50, plaqueY + 80);

    ctx.beginPath();
    ctx.moveTo(width / 2 + 180, plaqueY + 18);
    ctx.lineTo(width / 2 + 180, plaqueY + plaqueH - 18);
    ctx.stroke();

    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('COSMIC RANK', width / 2 + 280, plaqueY + 36);

    const rankTitle = highScore >= 5000 ? 'LEGEND' : highScore >= 2500 ? 'MASTER' : highScore >= 1000 ? 'ADEPT' : 'NOVICE';
    ctx.font = '900 32px "Outfit", sans-serif';
    ctx.fillStyle = '#a855f7';
    ctx.fillText(rankTitle, width / 2 + 280, plaqueY + 79);

    // 9. Signatures & Official Seals
    const bottomY = 790;

    // Left: Official Seal & Date
    ctx.textAlign = 'left';
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Verification emblem circle
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(220, bottomY + 20, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(220, bottomY + 20, 42, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('OFFICIAL SEAL', 220, bottomY + 12);
    ctx.fillText('VERIFIED 2026', 220, bottomY + 28);

    ctx.textAlign = 'left';
    ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Date Issued: ${today}`, 290, bottomY + 12);
    ctx.font = '500 12px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Registry ID: CGR-${Math.floor(highScore * 137).toString(16).toUpperCase()}-VERIFIED`, 290, bottomY + 34);

    // Right: Creator Signature & Class 9 Title
    const sigX = 1180;
    ctx.textAlign = 'center';

    // Stylized signature text in Cinzel
    ctx.font = 'bold 26px "Cinzel", Georgia, serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Shreyas Chaturvedi', sigX, bottomY);

    // Signature decorative line
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sigX - 160, bottomY + 12);
    ctx.lineTo(sigX + 160, bottomY + 12);
    ctx.stroke();

    // Student of Class 9 & Creator title
    ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Shreyas Chaturvedi', sigX, bottomY + 32);

    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Student of Class 9 · Game Creator & Director', sigX, bottomY + 52);

    ctx.font = '400 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Cosmic Gem Rush Studios © 2026 · All Rights Reserved', sigX, bottomY + 70);
  }, [highScore, totalGems, highestWorldId, world]);

  // Initial render when modal opens or name changes
  useEffect(() => {
    drawCertificate(playerName);
  }, [playerName, drawCertificate]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setIsGenerated(true);
    try {
      localStorage.setItem(SAVED_NAME_KEY, playerName);
    } catch {}
    drawCertificate(playerName);
  };

  const handleDownload = () => {
    sound.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const safeName = playerName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Cosmic_Voyager';
    link.download = `Cosmic_Gem_Rush_Certificate_${safeName}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    sound.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Cosmic Gem Rush - Certificate of Galactic Excellence</title>
            <style>
              body { margin: 0; display: flex; align-items: center; justify-content: center; background: #000; min-height: 100vh; }
              img { width: 100%; max-width: 1000px; height: auto; }
            </style>
          </head>
          <body>
            <img src="${canvas.toDataURL('image/png')}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md select-none pointer-events-auto">
      <div className="w-full max-w-2xl max-h-[95vh] rounded-2xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-wide uppercase">
                GALACTIC CERTIFICATE OF EXCELLENCE
              </h2>
              <p className="text-xs text-slate-400">
                Official personalized certificate recognizing your interstellar high score
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name Input Form */}
        <form onSubmit={handleGenerate} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-4">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Enter Your Full Name for the Certificate
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                drawCertificate(e.target.value);
              }}
              placeholder="e.g. Commander Sarah Connor"
              maxLength={36}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-white font-medium text-sm placeholder:text-slate-500 outline-none transition-all"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>GENERATE CERTIFICATE</span>
            </button>
          </div>
        </form>

        {/* Live Canvas Certificate Preview */}
        <div className="relative w-full rounded-xl overflow-hidden border border-amber-500/40 shadow-xl bg-black mb-4">
          <canvas
            ref={canvasRef}
            className="w-full h-auto block"
            style={{ aspectRatio: '16/10' }}
          />
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-400">
            Official high score recorded:{' '}
            <span className="font-bold text-amber-300 font-mono tabular-nums">{highScore.toLocaleString()} pts</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>SAVED TO DEVICE!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD CERTIFICATE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
