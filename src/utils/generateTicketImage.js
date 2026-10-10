/**
 * Generates an executive, ultra-clean RailPeek PNR Boarding Pass Image
 * using native HTML5 Canvas without external dependencies.
 * Zero emojis — only clean, high-contrast typography and executive layout.
 */

function formatDisplayDate(dateStr) {
  if (!dateStr || dateStr === '--') return '--';
  const dmyMatch = String(dateStr).match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyMatch) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parseInt(dmyMatch[1], 10);
    const month = months[parseInt(dmyMatch[2], 10) - 1] || dmyMatch[2];
    const year = dmyMatch[3];
    return `${day} ${month} ${year}`;
  }
  const ymdMatch = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parseInt(ymdMatch[3], 10);
    const month = months[parseInt(ymdMatch[2], 10) - 1] || ymdMatch[2];
    const year = ymdMatch[1];
    return `${day} ${month} ${year}`;
  }
  return dateStr;
}

function formatDisplayTime(timeStr) {
  if (!timeStr || timeStr === '--' || timeStr === '--:--') return '--';
  const clean = String(timeStr).trim();
  if (/am|pm/i.test(clean)) return clean;
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return clean;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const padH = String(hours).padStart(2, '0');
  return `${padH}:${minutes} ${ampm}`;
}

function getBerthTypeLabel(code) {
  if (!code || code === '--') return '--';
  const c = String(code).toUpperCase().trim();
  const map = {
    WS: 'Window Seat',
    L: 'Lower Berth',
    LB: 'Lower Berth',
    LOWER: 'Lower Berth',
    M: 'Middle Berth',
    MB: 'Middle Berth',
    MIDDLE: 'Middle Berth',
    U: 'Upper Berth',
    UB: 'Upper Berth',
    UPPER: 'Upper Berth',
    SL: 'Side Lower',
    SUB: 'Side Lower',
    'SIDE LOWER': 'Side Lower',
    SU: 'Side Upper',
    'SIDE UPPER': 'Side Upper',
    SM: 'Side Middle',
    'SIDE MIDDLE': 'Side Middle',
    CB: 'Cabin',
    CP: 'Coupe',
    AS: 'Aisle Seat',
    MS: 'Middle Seat',
  };
  return map[c] || code;
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

export function generateTicketCanvas(pnrData) {
  if (typeof document === 'undefined') return null;

  const passengers = pnrData.passengers || [];
  const paxCount = Math.max(1, passengers.length);

  const canvasWidth = 960;
  const baseHeight = 860;
  const paxRowHeight = 44;
  const canvasHeight = baseHeight + (paxCount > 1 ? (paxCount - 1) * paxRowHeight : 0);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#0f172a'; // Deep slate outer frame
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Main Card Body
  const margin = 24;
  const cardX = margin;
  const cardY = margin;
  const cardWidth = canvasWidth - margin * 2;
  const cardHeight = canvasHeight - margin * 2;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 20, true, true);

  // Header Bar (Deep Navy)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cardX + 20, cardY);
  ctx.lineTo(cardX + cardWidth - 20, cardY);
  ctx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + 20);
  ctx.lineTo(cardX + cardWidth, cardY + 90);
  ctx.lineTo(cardX, cardY + 90);
  ctx.lineTo(cardX, cardY + 20);
  ctx.quadraticCurveTo(cardX, cardY, cardX + 20, cardY);
  ctx.closePath();
  ctx.fillStyle = '#0a2342';
  ctx.fill();
  ctx.restore();

  // Header Content
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('RAILPEEK', cardX + 28, cardY + 42);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('OFFICIAL IRCTC PNR BOARDING PASS', cardX + 28, cardY + 64);

  // Right Badge in Header (Live Verified)
  ctx.fillStyle = '#065f46';
  roundRect(ctx, cardX + cardWidth - 170, cardY + 28, 142, 34, 8, true, false);
  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('LIVE VERIFIED', cardX + cardWidth - 146, cardY + 50);

  // PNR & Train Section
  let curY = cardY + 120;

  // PNR Block (Left)
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PNR NUMBER', cardX + 28, curY);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px "SF Mono", Menlo, Consolas, monospace';
  const rawPnr = String(pnrData.pnrNumber || '0000000000');
  const formattedPnr = rawPnr.length === 10 ? `${rawPnr.slice(0, 3)} ${rawPnr.slice(3, 6)} ${rawPnr.slice(6)}` : rawPnr;
  ctx.fillText(formattedPnr, cardX + 28, curY + 30);

  // Train Details (Right of PNR)
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('TRAIN NAME & NUMBER', cardX + 340, curY);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const trainStr = `${pnrData.trainNumber || '--'} · ${pnrData.trainName || 'TRAIN'}`;
  ctx.fillText(trainStr.length > 28 ? trainStr.slice(0, 27) + '...' : trainStr, cardX + 340, curY + 28);

  // Class & Quota Badge
  const classPillText = `${pnrData.travelClass || '--'} · QUOTA ${pnrData.quota || 'GN'}`;
  ctx.fillStyle = '#f1f5f9';
  ctx.strokeStyle = '#cbd5e1';
  roundRect(ctx, cardX + cardWidth - 210, curY + 6, 182, 32, 6, true, true);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 12px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText(classPillText, cardX + cardWidth - 198, curY + 27);

  // Divider Line
  curY += 60;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 28, curY);
  ctx.lineTo(cardX + cardWidth - 28, curY);
  ctx.stroke();

  // Route Section
  curY += 28;

  // Origin Station (Left)
  ctx.fillStyle = '#ea580c';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('ORIGIN / DEPARTURE', cardX + 28, curY);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText(pnrData.fromStation || '--', cardX + 28, curY + 34);

  ctx.fillStyle = '#475569';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const originName = pnrData.fromStationName || pnrData.fromStation || '--';
  ctx.fillText(originName.length > 22 ? originName.slice(0, 21) + '..' : originName, cardX + 28, curY + 54);

  ctx.fillStyle = '#0f172a';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Dep: ${formatDisplayTime(pnrData.departureTime)}`, cardX + 28, curY + 74);

  // Center Route Line
  const centerX = cardX + cardWidth / 2;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 100, curY + 24);
  ctx.lineTo(centerX + 100, curY + 24);
  ctx.stroke();

  // Center Arrowhead
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.moveTo(centerX + 100, curY + 24);
  ctx.lineTo(centerX + 92, curY + 19);
  ctx.lineTo(centerX + 92, curY + 29);
  ctx.closePath();
  ctx.fill();

  // Center Journey Date
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const dateFormatted = formatDisplayDate(pnrData.journeyDate);
  const dateWidth = ctx.measureText(dateFormatted).width;
  ctx.fillText(dateFormatted, centerX - dateWidth / 2, curY + 48);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const chartText = pnrData.chartPrepared ? 'Chart Prepared' : 'Chart Not Prepared';
  const chartWidth = ctx.measureText(chartText).width;
  ctx.fillText(chartText, centerX - chartWidth / 2, curY + 68);

  // Destination Station (Right)
  ctx.fillStyle = '#0284c7';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('DESTINATION', cardX + cardWidth - 210, curY);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px "SF Mono", Menlo, Consolas, monospace';
  ctx.fillText(pnrData.toStation || '--', cardX + cardWidth - 210, curY + 34);

  ctx.fillStyle = '#475569';
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const destName = pnrData.toStationName || pnrData.toStation || '--';
  ctx.fillText(destName.length > 22 ? destName.slice(0, 21) + '..' : destName, cardX + cardWidth - 210, curY + 54);

  ctx.fillStyle = '#0f172a';
  ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`Arr: ${formatDisplayTime(pnrData.arrivalTime)}`, cardX + cardWidth - 210, curY + 74);

  // Official Boarding Box (Highlight if exists)
  curY += 92;
  const hasBoardingInfo = pnrData.boardingStation || pnrData.isDifferentBoarding;
  if (hasBoardingInfo) {
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    roundRect(ctx, cardX + 28, curY, cardWidth - 56, 38, 8, true, true);

    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('OFFICIAL BOARDING STATION:', cardX + 42, curY + 24);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const boardingStationCode = pnrData.boardingStation || pnrData.fromStation;
    const boardingStationName = pnrData.boardingStationName || pnrData.fromStationName || boardingStationCode;
    const platInfo = pnrData.platform && pnrData.platform !== '--' ? ` · Platform ${pnrData.platform}` : '';
    ctx.fillText(`${boardingStationCode} (${boardingStationName}) · Dep: ${formatDisplayTime(pnrData.departureTime)}${platInfo}`, cardX + 240, curY + 24);

    curY += 50;
  } else {
    curY += 12;
  }

  // Passengers Table Header
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  roundRect(ctx, cardX + 28, curY, cardWidth - 56, 32, 6, true, true);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('PAX', cardX + 42, curY + 20);
  ctx.fillText('STATUS', cardX + 130, curY + 20);
  ctx.fillText('COACH', cardX + 360, curY + 20);
  ctx.fillText('BERTH / SEAT', cardX + 490, curY + 20);
  ctx.fillText('BERTH TYPE', cardX + 680, curY + 20);

  // Passengers Table Rows
  curY += 34;
  passengers.forEach((p, idx) => {
    const isCnf = p.currentStatus?.startsWith('CNF') || p.currentStatus?.startsWith('CONFIRM');
    const isRac = p.currentStatus?.startsWith('RAC');

    // Row zebra / background
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(cardX + 28, curY, cardWidth - 56, paxRowHeight);

    // Pax Number
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(`P${p.passengerNumber || idx + 1}`, cardX + 42, curY + 26);

    // Status Pill
    if (isCnf) {
      ctx.fillStyle = '#dcfce7';
      roundRect(ctx, cardX + 130, curY + 9, 100, 26, 4, true, false);
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('CONFIRMED', cardX + 144, curY + 26);
    } else if (isRac) {
      ctx.fillStyle = '#fef9c3';
      roundRect(ctx, cardX + 130, curY + 9, 110, 26, 4, true, false);
      ctx.fillStyle = '#854d0e';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(p.currentStatus, cardX + 142, curY + 26);
    } else {
      ctx.fillStyle = '#fee2e2';
      roundRect(ctx, cardX + 130, curY + 9, 110, 26, 4, true, false);
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(p.currentStatus || 'WL', cardX + 142, curY + 26);
    }

    // Coach
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(p.coach && p.coach !== '--' ? p.coach : '--', cardX + 360, curY + 26);

    // Berth Number
    ctx.fillText(p.berthNumber && p.berthNumber !== '--' ? String(p.berthNumber) : '--', cardX + 490, curY + 26);

    // Berth Type
    ctx.fillStyle = '#475569';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(getBerthTypeLabel(p.berthType), cardX + 680, curY + 26);

    // Border line under row
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(cardX + 28, curY + paxRowHeight);
    ctx.lineTo(cardX + cardWidth - 28, curY + paxRowHeight);
    ctx.stroke();

    curY += paxRowHeight;
  });

  // Refund Radar Banner
  curY += 16;
  if (pnrData.refund) {
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    roundRect(ctx, cardX + 28, curY, cardWidth - 56, 76, 10, true, true);

    // Left: Current Refund
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('IRCTC OFFICIAL REFUND (CANCEL NOW)', cardX + 44, curY + 24);

    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 22px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(`₹${pnrData.refund.refundAmount}`, cardX + 44, curY + 54);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`(Clerkage deduction: ₹${pnrData.refund.deductionAmount})`, cardX + 160, curY + 52);

    // Right: Next Cutoff
    if (pnrData.refund.cutoffDateTime) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('NEXT CANCELLATION DEADLINE', cardX + cardWidth / 2 + 30, curY + 24);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(pnrData.refund.cutoffDateTime, cardX + cardWidth / 2 + 30, curY + 44);

      if (pnrData.refund.nextSlabRefundAmount !== undefined) {
        ctx.fillStyle = '#ea580c';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`Next Refund: ₹${pnrData.refund.nextSlabRefundAmount}`, cardX + cardWidth / 2 + 30, curY + 62);
      }
    }

    curY += 92;
  }

  // Decorative Perforated Ticket Line
  curY += 8;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(cardX + 28, curY);
  ctx.lineTo(cardX + cardWidth - 28, curY);
  ctx.stroke();
  ctx.setLineDash([]); // Reset line dash

  // Stub Barcode & Security Verification
  curY += 20;

  // Fake Barcode Lines
  const barcodeX = cardX + 42;
  const barcodeY = curY;
  const barcodeHeight = 28;
  const barPattern = [3, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3];
  ctx.fillStyle = '#1e293b';
  let bx = barcodeX;
  barPattern.forEach((w) => {
    ctx.fillRect(bx, barcodeY, w, barcodeHeight);
    bx += w + 2;
  });

  // Footer Metadata
  ctx.fillStyle = '#64748b';
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Verified IRCTC Live PNR Status · Generated by RailPeek', cardX + 280, curY + 16);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const nowStr = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  ctx.fillText(`Timestamp: ${nowStr} · Track live anytime at railpeek.app`, cardX + 280, curY + 30);

  return canvas;
}

/**
 * Returns a PNG Blob of the generated ticket boarding pass
 */
export async function generateTicketImageBlob(pnrData) {
  const canvas = generateTicketCanvas(pnrData);
  if (!canvas) return null;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Triggers a direct download of the ticket pass PNG file
 */
export function downloadTicketImage(pnrData) {
  const canvas = generateTicketCanvas(pnrData);
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `RailPeek-PNR-${pnrData.pnrNumber || 'ticket'}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
