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

function fmtBool(v) {
  return v ? 'Yes' : 'No';
}
function fmtVal(v) {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
}

// PDF Export — clean English/transliteration (jsPDF has no Bengali font support)
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
  const FOOTER_LEFT = 'My Amal  |  Developed by Zahid Hasan  |  01745940065';
  const FOOTER_RIGHT_URL = 'myAmal.vercel.app';

  // BD Time (UTC+6)
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
      'Fasting Type',
      'Sadaqah',
      'Food(pl)',
      'Sleep(h)',
      'Score%',
      'Notes',
    ],
  ];

  const body = data.map((r) => [
    formatDate(r.date),
    r.fajr ? 'Yes' : 'No',
    r.dhuhr ? 'Yes' : 'No',
    r.asr ? 'Yes' : 'No',
    r.maghrib ? 'Yes' : 'No',
    r.isha ? 'Yes' : 'No',
    r.tahajjud ? 'Yes' : 'No',
    r.morningDua ? 'Yes' : 'No',
    r.daytimeTawbah ? 'Yes' : 'No',
    r.eveningDua ? 'Yes' : 'No',
    r.quranPages || 0,
    r.fasting ? FASTING_PDF[r.fastingType] || 'Yes' : 'No',
    r.sadaqah ? `BDT ${r.sadaqahAmount}` : 'No',
    r.foodPlates > 0 ? `${r.foodPlates} plates` : '-',
    r.sleepMinutes ? (r.sleepMinutes / 60).toFixed(1) : '-',
    `${r.progressScore}%`,
    (r.notes || '')
      .split('')
      .filter((c) => c.charCodeAt(0) < 128)
      .join('')
      .trim()
      .slice(0, 35) || '-',
  ]);

  autoTable(doc, {
    startY: 33,
    head,
    body,
    styles: {
      fontSize: 7,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      font: 'helvetica',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [26, 122, 74],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    columnStyles: {
      0: { cellWidth: 22, halign: 'left' },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 10, halign: 'center' },
      6: { cellWidth: 10, halign: 'center' },
      7: { cellWidth: 10, halign: 'center' },
      8: { cellWidth: 10, halign: 'center' },
      9: { cellWidth: 10, halign: 'center' },
      10: { cellWidth: 12, halign: 'center' },
      11: { cellWidth: 26, halign: 'center' },
      12: { cellWidth: 18, halign: 'center' },
      13: { cellWidth: 16, halign: 'center' },
      14: { cellWidth: 16, halign: 'center' },
      15: { cellWidth: 14, halign: 'center' },
      16: { cellWidth: 'auto', halign: 'left' },
    },
    margin: { left: 6, right: 6, bottom: 18 },
    didDrawCell: (d) => {
      if (d.section !== 'body') return;
      const val = String(d.cell.raw || '');
      if (val === 'Yes') doc.setTextColor(26, 122, 74);
      else if (val === 'No') doc.setTextColor(200, 50, 50);
      else doc.setTextColor(50, 50, 50);
    },
    didDrawPage: (d) => {
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      const fY = pageH - 8;
      // Footer line
      doc.setDrawColor(26, 122, 74);
      doc.setLineWidth(0.5);
      doc.line(6, fY - 3, pageW - 6, fY - 3);
      // Left: branding
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(FOOTER_LEFT, 6, fY);
      // Center: URL
      doc.setTextColor(26, 122, 74);
      doc.setFont('helvetica', 'bold');
      doc.text(FOOTER_RIGHT_URL, pageW / 2, fY, { align: 'center' });
      // Right: page number (drawn after full render in loop below)
    },
  });

  // ── Summary ──
  const finalY = (doc.lastAutoTable?.finalY || 100) + 8;
  const fajrC = data.filter((d) => d.fajr).length;
  const dhuhrC = data.filter((d) => d.dhuhr).length;
  const asrC = data.filter((d) => d.asr).length;
  const maghribC = data.filter((d) => d.maghrib).length;
  const ishaC = data.filter((d) => d.isha).length;
  const fastingC = data.filter((d) => d.fasting).length;
  const quranTotal = data.reduce((s, d) => s + (d.quranPages || 0), 0);
  const avgScore = total
    ? Math.round(data.reduce((s, d) => s + d.progressScore, 0) / total)
    : 0;

  doc.setFontSize(10);
  doc.setTextColor(26, 122, 74);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary:', 14, finalY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  const summaryLine1 = [
    `Total Days: ${total}`,
    `Fajr: ${fajrC}/${total} (${pct(fajrC)})`,
    `Dhuhr: ${dhuhrC}/${total} (${pct(dhuhrC)})`,
    `Asr: ${asrC}/${total} (${pct(asrC)})`,
    `Maghrib: ${maghribC}/${total} (${pct(maghribC)})`,
  ];
  const summaryLine2 = [
    `Isha: ${ishaC}/${total} (${pct(ishaC)})`,
    `Fasting: ${fastingC}`,
    `Quran Pages: ${quranTotal}`,
    `Avg Score: ${avgScore}%`,
    `Sadaqah: BDT ${data.reduce((s, d) => s + (d.sadaqahAmount || 0), 0)}`,
  ];

  summaryLine1.forEach((item, i) => {
    doc.text(item, 14 + i * 55, finalY + 7);
  });
  summaryLine2.forEach((item, i) => {
    doc.text(item, 14 + i * 55, finalY + 13);
  });

  // ── Add footer + page numbers to ALL pages after render ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const fY = pageH - 8;
    doc.setDrawColor(26, 122, 74);
    doc.setLineWidth(0.5);
    doc.line(6, fY - 3, pageW - 6, fY - 3);
    // Left
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(FOOTER_LEFT, 6, fY);
    // Center URL
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 122, 74);
    doc.text(FOOTER_RIGHT_URL, pageW / 2, fY, { align: 'center' });
    // Right: Page X / Y
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Page ${p} / ${totalPages}`, pageW - 6, fY, { align: 'right' });
  }

  doc.save(`${filename}.pdf`);
}

// Excel Export with beautiful styling
// Excel Export with beautiful styling
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
    'ঘুম (Sleep h)': r.sleepMinutes
      ? parseFloat((r.sleepMinutes / 60).toFixed(1))
      : 0,
    'Score %': r.progressScore,
    'নোট (Notes)': r.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
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
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Amal Data');

  // ===== SUMMARY SHEET =====
  const total = data.length;
  const pct = (n) => (total ? `${Math.round((n / total) * 100)}%` : '0%');

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
      Metric: 'Total Sadaqah Amount',
      Value: `${data.reduce((s, d) => s + (d.sadaqahAmount || 0), 0)}`,
      Percentage: '',
    },
    {
      Metric: 'Total Quran Pages',
      Value: data.reduce((s, d) => s + (d.quranPages || 0), 0),
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
