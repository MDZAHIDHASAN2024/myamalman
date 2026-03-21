const Reminder = require('../models/Reminder');
const User = require('../models/User');

exports.getReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id });
    res.json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.saveReminders = async (req, res) => {
  try {
    const { reminders } = req.body;
    await Reminder.deleteMany({ user: req.user._id });
    const saved = await Reminder.insertMany(reminders.map(r => ({ ...r, user: req.user._id })));
    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reminder/fasting-upcoming - Returns upcoming Ayyam al-Beed & Sunnah fasting days
exports.getUpcomingFasting = async (req, res) => {
  try {
    const today = new Date();
    const upcoming = [];

    // Sunnah fasting: every Monday and Thursday within next 14 days
    for (let i = 0; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const day = d.getDay(); // 1=Mon, 4=Thu
      if (day === 1 || day === 4) {
        upcoming.push({
          date: d.toISOString().split('T')[0],
          type: day === 1 ? 'Monday Sunnah' : 'Thursday Sunnah',
          daysUntil: i
        });
      }
    }

    // Ayyam al-Beed: 13th, 14th, 15th of each Hijri month
    // We approximate: use a known Hijri epoch to compute
    const ayyamBeed = getAyyamBeedDates(today);
    upcoming.push(...ayyamBeed);

    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ success: true, data: upcoming });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function getAyyamBeedDates(today) {
  // Hijri epoch: 1 Muharram 1 AH = 16 July 622 CE (Julian) → simplified calculation
  const HIJRI_EPOCH = 1948439.5; // Julian Day Number
  const toJD = (date) => {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    return 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4)
      + Math.floor(275 * m / 9) + d + 1721013.5;
  };
  const jdToHijri = (jd) => {
    const z = Math.floor(jd) + 0.5;
    const era = Math.floor((30 * (z - HIJRI_EPOCH) + 10646) / 10631);
    const year = era;
    const month = Math.min(12, Math.ceil((z - (29 + jdToHijriMonthStart(year))) / 29.5) + 1);
    const day = Math.floor(z - jdToHijriMonthStart(year) - Math.floor(29.5001 * (month - 1))) + 1;
    return { year, month, day };
  };
  const jdToHijriMonthStart = (year) =>
    HIJRI_EPOCH + Math.ceil(29.5001 * 12 * (year - 1)) + (year % 30 < 15 ? 0 : 1);

  const results = [];
  // Check next 2 Hijri months for 13,14,15
  const todayJD = toJD(today);
  const todayH = jdToHijri(todayJD);

  for (let monthOffset = 0; monthOffset <= 1; monthOffset++) {
    let hMonth = todayH.month + monthOffset;
    let hYear = todayH.year;
    if (hMonth > 12) { hMonth -= 12; hYear++; }

    for (const hDay of [13, 14, 15]) {
      // Approx: convert back
      const approxJD = HIJRI_EPOCH + Math.ceil(29.5001 * (12 * (hYear - 1) + hMonth - 1)) + hDay - 1;
      const greg = new Date((approxJD - 2440587.5) * 86400000);
      const daysUntil = Math.round((greg - today) / 86400000);
      if (daysUntil >= -1 && daysUntil <= 30) {
        results.push({
          date: greg.toISOString().split('T')[0],
          type: `Ayyam al-Beed (${hDay} ${getHijriMonthName(hMonth)})`,
          hijriDay: hDay,
          daysUntil,
          notifyAt: daysUntil <= 2 ? 'Reminder: 2 days before!' : null
        });
      }
    }
  }
  return results;
}

function getHijriMonthName(m) {
  const months = ['', 'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", 'Rajab', "Sha'ban",
    'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'];
  return months[m] || '';
}
