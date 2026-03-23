import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDate } from './hijri';

const FASTING_LABELS = {
  fard: 'ফরজ',
  monday: 'সোমবার',
  thursday: 'বৃহস্পতি',
  ayyam_beed: 'আইয়্যামুল বীয',
  other: 'অন্যান্য',
  '': '-',
};

const FASTING_PDF = {
  fard: 'Fard (Ramadan)',
  monday: 'Monday Sunnah',
  thursday: 'Thursday Sunnah',
  ayyam_beed: 'Ayyam al-Beed',
  other: 'Other Sunnah',
  '': '-',
};

export function exportToPDF(data, filename = 'my-amal-report') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const FOOTER_LEFT = 'My Amal  |  Developed by Zahid Hasan  |  +8801745940065';
  const FOOTER_RIGHT_URL = 'myamalman.vercel.app';

  const now = new Date();
  const bdTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const bdStr = bdTime.toISOString().replace('T', ' ').slice(0, 16) + ' (BD)';

  // ── Header ──
  doc.setFontSize(20);
  doc.setTextColor(26, 122, 74);
  doc.text('My Amal - Amal Report', 14, 15);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Exported: ${bdStr}  |  Total Records: ${data.length}`, 14, 23);
  doc.text(
    'F=Fajr  D=Dhuhr  A=Asr  M=Maghrib  I=Isha  Thj=Tahajjud  MD=Morning Dua  Twb=Tawbah  ED=Evening Dua',
    14,
    29,
  );

  const total = data.length;
  const pct = (n) => (total ? `${Math.round((n / total) * 100)}%` : '0%');

  // ── single-line headers (no wrap) ──
  const head = [
    [
      'Date',
      'F',
      'D',
      'A',
      'M',
      'I',
      'Thj',
      'MD',
      'Twb',
      'ED',
      'Quran',
      'Fasting',
      'Sadaqah',
      'Food(pl)',
      'Exer(h)',
      'Sleep(h)',
      'Score%',
      'Notes',
    ],
  ];

  const body = data.map((r) => [
    formatDate(r.date),
    r.fajr ? 'Y' : 'N',
    r.dhuhr ? 'Y' : 'N',
    r.asr ? 'Y' : 'N',
    r.maghrib ? 'Y' : 'N',
    r.isha ? 'Y' : 'N',
    r.tahajjud ? 'Y' : 'N',
    r.morningDua ? 'Y' : 'N',
    r.daytimeTawbah ? 'Y' : 'N',
    r.eveningDua ? 'Y' : 'N',
    r.quranPages || 0,
    r.fasting ? FASTING_PDF[r.fastingType] || 'Yes' : 'No',
    r.sadaqah ? `${r.sadaqahAmount}` : '-',
    r.foodPlates > 0 ? `${r.foodPlates}` : '-',
    r.exerciseMinutes > 0 ? (r.exerciseMinutes / 60).toFixed(1) : '-',
    r.sleepMinutes ? (r.sleepMinutes / 60).toFixed(1) : '-',
    `${r.progressScore}%`,
    (r.notes || '')
      .split('')
      .filter((c) => c.charCodeAt(0) < 128)
      .join('')
      .trim()
      .slice(0, 30) || '-',
  ]);

  // ── Summary footer row ──
  const sumBody = [
    [
      `Total: ${total}`,
      `${data.filter((d) => d.fajr).length}`,
      `${data.filter((d) => d.dhuhr).length}`,
      `${data.filter((d) => d.asr).length}`,
      `${data.filter((d) => d.maghrib).length}`,
      `${data.filter((d) => d.isha).length}`,
      `${data.filter((d) => d.tahajjud).length}`,
      `${data.filter((d) => d.morningDua).length}`,
      `${data.filter((d) => d.daytimeTawbah).length}`,
      `${data.filter((d) => d.eveningDua).length}`,
      `${data.reduce((s, d) => s + (d.quranPages || 0), 0)}p`,
      `${data.filter((d) => d.fasting).length}`,
      `${data.reduce((s, d) => s + (d.sadaqahAmount || 0), 0)}`,
      `${data.reduce((s, d) => s + (d.foodPlates || 0), 0)}`,
      `${(data.reduce((s, d) => s + (d.exerciseMinutes || 0), 0) / 60).toFixed(1)}h`,
      data.filter((d) => d.sleepMinutes > 0).length
        ? `${(data.filter((d) => d.sleepMinutes > 0).reduce((s, d) => s + (d.sleepMinutes || 0), 0) / data.filter((d) => d.sleepMinutes > 0).length / 60).toFixed(1)}h avg`
        : '-',
      `${total ? Math.round(data.reduce((s, d) => s + d.progressScore, 0) / total) : 0}%`,
      '',
    ],
  ];

  autoTable(doc, {
    startY: 33,
    head,
    body: [...body, ...sumBody],
    styles: {
      fontSize: 7,
      cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
      font: 'helvetica',
      overflow: 'ellipsize', // no wrap
      minCellHeight: 7,
    },
    headStyles: {
      fillColor: [26, 122, 74],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      overflow: 'ellipsize',
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    // last row = summary — bold green bg
    didParseCell: (d) => {
      if (d.section === 'body' && d.row.index === body.length) {
        d.cell.styles.fillColor = [26, 122, 74];
        d.cell.styles.textColor = [255, 255, 255];
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fontSize = 7;
      }
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left' },
      1: { cellWidth: 7, halign: 'center' },
      2: { cellWidth: 7, halign: 'center' },
      3: { cellWidth: 7, halign: 'center' },
      4: { cellWidth: 7, halign: 'center' },
      5: { cellWidth: 7, halign: 'center' },
      6: { cellWidth: 7, halign: 'center' },
      7: { cellWidth: 7, halign: 'center' },
      8: { cellWidth: 7, halign: 'center' },
      9: { cellWidth: 7, halign: 'center' },
      10: { cellWidth: 11, halign: 'center' },
      11: { cellWidth: 22, halign: 'center' },
      12: { cellWidth: 16, halign: 'center' },
      13: { cellWidth: 13, halign: 'center' },
      14: { cellWidth: 13, halign: 'center' },
      15: { cellWidth: 13, halign: 'center' },
      16: { cellWidth: 12, halign: 'center' },
      17: { cellWidth: 'auto', halign: 'left' },
    },
    margin: { left: 6, right: 6, bottom: 18 },
    didDrawCell: (d) => {
      if (d.section !== 'body') return;
      if (d.row.index === body.length) return; // summary row already styled
      const val = String(d.cell.raw || '');
      if (val === 'Y') doc.setTextColor(26, 122, 74);
      else if (val === 'N') doc.setTextColor(200, 50, 50);
      else doc.setTextColor(50, 50, 50);
    },
  });

  // ── Summary Page ──
  doc.addPage();
  const sPageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setTextColor(26, 122, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Report', sPageW / 2, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total ${total} days  |  Exported: ${bdStr}`, sPageW / 2, 24, {
    align: 'center',
  });

  const fajrC = data.filter((d) => d.fajr).length;
  const dhuhrC = data.filter((d) => d.dhuhr).length;
  const asrC = data.filter((d) => d.asr).length;
  const maghribC = data.filter((d) => d.maghrib).length;
  const ishaC = data.filter((d) => d.isha).length;
  const tahajC = data.filter((d) => d.tahajjud).length;
  const mduaC = data.filter((d) => d.morningDua).length;
  const tawbC = data.filter((d) => d.daytimeTawbah).length;
  const eduaC = data.filter((d) => d.eveningDua).length;
  const fastC = data.filter((d) => d.fasting).length;
  const sadC = data.filter((d) => d.sadaqah).length;
  const quranTot = data.reduce((s, d) => s + (d.quranPages || 0), 0);
  const sadTot = data.reduce((s, d) => s + (d.sadaqahAmount || 0), 0);
  const foodTot = data.reduce((s, d) => s + (d.foodPlates || 0), 0);
  const exTot = data.reduce((s, d) => s + (d.exerciseMinutes || 0), 0);
  const slpRows = data.filter((d) => d.sleepMinutes > 0);
  const slpAvg = slpRows.length
    ? (
        slpRows.reduce((s, d) => s + d.sleepMinutes, 0) /
        slpRows.length /
        60
      ).toFixed(1)
    : '-';
  const avgScr = total
    ? Math.round(data.reduce((s, d) => s + d.progressScore, 0) / total)
    : 0;
  const miss = (n) => total - n;
  const ppct = (n) => (total ? `${Math.round((n / total) * 100)}%` : '0%');

  // Salah table (left)
  autoTable(doc, {
    startY: 30,
    head: [['Salah', 'Done', 'Missed', 'Done %', 'Missed %']],
    body: [
      ['Fajr', fajrC, miss(fajrC), ppct(fajrC), ppct(miss(fajrC))],
      ['Dhuhr', dhuhrC, miss(dhuhrC), ppct(dhuhrC), ppct(miss(dhuhrC))],
      ['Asr', asrC, miss(asrC), ppct(asrC), ppct(miss(asrC))],
      [
        'Maghrib',
        maghribC,
        miss(maghribC),
        ppct(maghribC),
        ppct(miss(maghribC)),
      ],
      ['Isha', ishaC, miss(ishaC), ppct(ishaC), ppct(miss(ishaC))],
    ],
    styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
    headStyles: {
      fillColor: [26, 122, 74],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: 18 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 6, right: sPageW / 2 + 3 },
    didDrawCell: (d) => {
      if (d.section !== 'body' || d.column.index === 0) return;
      if (d.column.index === 2 || d.column.index === 4)
        doc.setTextColor(200, 50, 50);
      else doc.setTextColor(26, 122, 74);
    },
  });

  const salahEndY = doc.lastAutoTable.finalY;

  // Nafl table (left continued)
  autoTable(doc, {
    startY: salahEndY + 5,
    head: [['Nafl / Extra', 'Done', 'Done %']],
    body: [
      ['Tahajjud', tahajC, ppct(tahajC)],
      ['Morning Dua', mduaC, ppct(mduaC)],
      ['Tawbah', tawbC, ppct(tawbC)],
      ['Evening Dua', eduaC, ppct(eduaC)],
    ],
    styles: { fontSize: 8, cellPadding: 3, halign: 'center' },
    headStyles: {
      fillColor: [90, 60, 180],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 38 },
      1: { cellWidth: 18 },
      2: { cellWidth: 18 },
    },
    alternateRowStyles: { fillColor: [245, 240, 255] },
    margin: { left: 6, right: sPageW / 2 + 3 },
  });

  const leftEndY = doc.lastAutoTable.finalY;

  // Fasting + Sadaqah + Quran (right)
  autoTable(doc, {
    startY: 30,
    head: [['Fasting, Sadaqah & Quran', 'Value', '%']],
    body: [
      ['Fasting Days', `${fastC} / ${total}`, ppct(fastC)],
      ['Missed Fasting', `${miss(fastC)} / ${total}`, ppct(miss(fastC))],
      ['Sadaqah Days', `${sadC} / ${total}`, ppct(sadC)],
      ['Total Sadaqah (BDT)', `${sadTot}`, ''],
      ['Total Quran Pages', `${quranTot}p`, ''],
    ],
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [26, 100, 180],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 48 },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'center', cellWidth: 18 },
    },
    alternateRowStyles: { fillColor: [236, 245, 255] },
    margin: { left: sPageW / 2 + 3, right: 6 },
    didDrawCell: (d) => {
      if (d.section !== 'body' || d.column.index !== 2) return;
      const val = String(d.cell.raw || '');
      if (!val) return;
      const num = parseInt(val);
      doc.setTextColor(
        num >= 70 ? 26 : 200,
        num >= 70 ? 122 : 50,
        num >= 70 ? 74 : 50,
      );
    },
  });

  const rightTopEndY = doc.lastAutoTable.finalY;

  // Lifestyle (right continued)
  autoTable(doc, {
    startY: rightTopEndY + 5,
    head: [['Lifestyle', 'Total / Avg']],
    body: [
      ['Food Plates (total)', `${foodTot} plates`],
      ['Exercise (total)', exTot > 0 ? `${(exTot / 60).toFixed(1)}h` : '-'],
      ['Sleep (avg/day)', slpAvg !== '-' ? `${slpAvg}h` : '-'],
    ],
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: {
      fillColor: [180, 80, 20],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 48 },
      1: { halign: 'center', cellWidth: 28 },
    },
    alternateRowStyles: { fillColor: [255, 245, 236] },
    margin: { left: sPageW / 2 + 3, right: 6 },
  });

  const rightEndY = doc.lastAutoTable.finalY;

  // Overall Score Box
  const boxY = Math.max(leftEndY, rightEndY) + 10;
  const scoreColor =
    avgScr >= 70 ? [26, 122, 74] : avgScr >= 40 ? [200, 140, 0] : [200, 50, 50];
  doc.setFillColor(...scoreColor);
  doc.roundedRect(6, boxY, sPageW - 12, 20, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Overall Avg Score: ${avgScr}%  —  ${total} days recorded`,
    sPageW / 2,
    boxY + 8,
    { align: 'center' },
  );
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const grade =
    avgScr >= 85
      ? 'Mashallah! Excellent performance!'
      : avgScr >= 70
        ? 'Good — keep it up!'
        : avgScr >= 50
          ? 'Needs improvement — stay consistent!'
          : 'Keep trying, never give up!';
  doc.text(grade, sPageW / 2, boxY + 15, { align: 'center' });

  // ── Page footers ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const fY = pageH - 8;
    doc.setDrawColor(26, 122, 74);
    doc.setLineWidth(0.5);
    doc.line(6, fY - 3, pageW - 6, fY - 3);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(FOOTER_LEFT, 6, fY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 122, 74);
    doc.text(FOOTER_RIGHT_URL, pageW / 2, fY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Page ${p} / ${totalPages}`, pageW - 6, fY, { align: 'right' });
  }

  doc.save(`${filename}.pdf`);
}

export function exportToExcel(data, filename = 'my-amal-report') {
  const wb = XLSX.utils.book_new();

  // ===== DATA SHEET =====
  const rows = data.map((r) => ({
    'তারিখ (Date)': formatDate(r.date),
    'ফজর (Fajr)': r.fajr ? '✓' : '✗',
    'যোহর (Dhuhr)': r.dhuhr ? '✓' : '✗',
    'আসর (Asr)': r.asr ? '✓' : '✗',
    'মাগরিব (Maghrib)': r.maghrib ? '✓' : '✗',
    'ইশা (Isha)': r.isha ? '✓' : '✗',
    'তাহাজ্জুদ (Tahajjud)': r.tahajjud ? '✓' : '✗',
    'সকালের দোয়া': r.morningDua ? '✓' : '✗',
    'তওবা (Tawbah)': r.daytimeTawbah ? '✓' : '✗',
    'সন্ধ্যার দোয়া': r.eveningDua ? '✓' : '✗',
    'কুরআন পৃষ্ঠা': r.quranPages || 0,
    'রোজা (Fasting)': r.fasting ? FASTING_LABELS[r.fastingType] || 'Yes' : 'No',
    'সাদাকাহ (Sadaqah)': r.sadaqah ? `৳${r.sadaqahAmount}` : 'No',
    'খাবার প্লেট (Food Plates)': r.foodPlates || 0,
    'ব্যায়াম (Exercise h)': r.exerciseMinutes
      ? parseFloat((r.exerciseMinutes / 60).toFixed(1))
      : 0,
    'ঘুম (Sleep h)': r.sleepMinutes
      ? parseFloat((r.sleepMinutes / 60).toFixed(1))
      : 0,
    'Score %': r.progressScore,
    'নোট (Notes)': r.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Amal Data');

  // ===== SUMMARY SHEET =====
  const total = data.length;
  const pct = (n) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
  const exerciseTotal = data.reduce((s, d) => s + (d.exerciseMinutes || 0), 0);
  const sleepRows = data.filter((d) => d.sleepMinutes > 0);
  const sleepAvg = sleepRows.length
    ? (
        sleepRows.reduce((s, d) => s + d.sleepMinutes, 0) /
        sleepRows.length /
        60
      ).toFixed(1)
    : 0;

  const summaryRows = [
    { Metric: '📊 SUMMARY REPORT', Value: '', Percentage: '' },
    { Metric: '', Value: '', Percentage: '' },
    { Metric: 'Total Days Recorded', Value: total, Percentage: '' },
    {
      Metric: 'Avg Progress Score',
      Value: `${total ? Math.round(data.reduce((s, d) => s + d.progressScore, 0) / total) : 0}%`,
      Percentage: '',
    },
    { Metric: '', Value: '', Percentage: '' },
    { Metric: '🕌 SALAH', Value: 'Count', Percentage: '% of Days' },
    {
      Metric: 'Fajr',
      Value: data.filter((d) => d.fajr).length,
      Percentage: pct(data.filter((d) => d.fajr).length),
    },
    {
      Metric: 'Dhuhr',
      Value: data.filter((d) => d.dhuhr).length,
      Percentage: pct(data.filter((d) => d.dhuhr).length),
    },
    {
      Metric: 'Asr',
      Value: data.filter((d) => d.asr).length,
      Percentage: pct(data.filter((d) => d.asr).length),
    },
    {
      Metric: 'Maghrib',
      Value: data.filter((d) => d.maghrib).length,
      Percentage: pct(data.filter((d) => d.maghrib).length),
    },
    {
      Metric: 'Isha',
      Value: data.filter((d) => d.isha).length,
      Percentage: pct(data.filter((d) => d.isha).length),
    },
    {
      Metric: 'Tahajjud',
      Value: data.filter((d) => d.tahajjud).length,
      Percentage: pct(data.filter((d) => d.tahajjud).length),
    },
    { Metric: '', Value: '', Percentage: '' },
    { Metric: '🌙 OTHER IBADAH', Value: '', Percentage: '' },
    {
      Metric: 'Fasting Days',
      Value: data.filter((d) => d.fasting).length,
      Percentage: pct(data.filter((d) => d.fasting).length),
    },
    {
      Metric: 'Sadaqah Days',
      Value: data.filter((d) => d.sadaqah).length,
      Percentage: pct(data.filter((d) => d.sadaqah).length),
    },
    {
      Metric: 'Total Sadaqah (BDT)',
      Value: `${data.reduce((s, d) => s + (d.sadaqahAmount || 0), 0)}`,
      Percentage: '',
    },
    {
      Metric: 'Total Quran Pages',
      Value: data.reduce((s, d) => s + (d.quranPages || 0), 0),
      Percentage: '',
    },
    { Metric: '', Value: '', Percentage: '' },
    { Metric: '🏃 LIFESTYLE', Value: '', Percentage: '' },
    {
      Metric: 'Total Food Plates',
      Value: data.reduce((s, d) => s + (d.foodPlates || 0), 0),
      Percentage: '',
    },
    {
      Metric: 'Total Exercise (h)',
      Value: parseFloat((exerciseTotal / 60).toFixed(1)),
      Percentage: '',
    },
    {
      Metric: 'Avg Sleep per Day (h)',
      Value: parseFloat(sleepAvg),
      Percentage: '',
    },
    { Metric: '', Value: '', Percentage: '' },
    {
      Metric: '📅 Exported At',
      Value: new Date().toLocaleString('en-BD'),
      Percentage: '',
    },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToJSON(data) {
  const blob = new Blob(
    [
      JSON.stringify(
        { version: '1.0', exportedAt: new Date().toISOString(), data },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-amal-backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
