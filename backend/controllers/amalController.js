const Amal = require('../models/Amal');

exports.createAmal = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user._id };
    const existing = await Amal.findOne({
      user: req.user._id,
      date: req.body.date,
    });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: 'এই তারিখে আমল আগেই সেভ আছে।' });
    const amal = await Amal.create(data);
    res.status(201).json({ success: true, data: amal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAmals = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      month,
      year,
      search,
      page = 1,
      limit = 50,
    } = req.query;
    const query = { user: req.user._id };
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (month && year) {
      const m = String(month).padStart(2, '0');
      query.date = { $gte: `${year}-${m}-01`, $lte: `${year}-${m}-31` };
    } else if (year) {
      query.date = { $gte: `${year}-01-01`, $lte: `${year}-12-31` };
    }
    if (search) {
      query.$or = [
        { notes: { $regex: search, $options: 'i' } },
        { date: { $regex: search } },
      ];
    }
    const total = await Amal.countDocuments(query);
    const amals = await Amal.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({
      success: true,
      data: amals,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.checkDate = async (req, res) => {
  try {
    const amal = await Amal.findOne({
      user: req.user._id,
      date: req.params.date,
    });
    res.json({ success: true, exists: !!amal, data: amal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    const bdOffset = 6 * 60 * 60 * 1000;
    const bdNow = new Date(today.getTime() + bdOffset);
    const todayStr = bdNow.toISOString().split('T')[0];
    const thisMonth = todayStr.slice(0, 7);

    const allAmals = await Amal.find({ user: userId }).sort({ date: 1 });
    const monthAmals = allAmals.filter((a) => a.date.startsWith(thisMonth));
    const todayAmal = allAmals.find((a) => a.date === todayStr);

    // Streak calculation
    let streak = 0;
    const dateSet = new Set(allAmals.map((a) => a.date));
    let checkDate = new Date(bdNow);
    while (true) {
      const d = checkDate.toISOString().split('T')[0];
      if (dateSet.has(d)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }

    const salahFields = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const salahStats = {};
    salahFields.forEach((s) => {
      const completed = allAmals.filter((a) => a[s]).length;
      salahStats[s] = {
        completed,
        total: allAmals.length,
        pct: allAmals.length
          ? Math.round((completed / allAmals.length) * 100)
          : 0,
      };
    });

    const bestDay = allAmals.reduce(
      (best, cur) =>
        !best || cur.progressScore > best.progressScore ? cur : best,
      null,
    );

    res.json({
      success: true,
      data: {
        totalDays: allAmals.length,
        streak,
        todayAmal,
        salahStats,
        bestDay,
        avgProgress: allAmals.length
          ? Math.round(
              allAmals.reduce((s, a) => s + a.progressScore, 0) /
                allAmals.length,
            )
          : 0,
        totalFasting: allAmals.filter((a) => a.fasting).length,
        totalSadaqah: allAmals.reduce((s, a) => s + (a.sadaqahAmount || 0), 0),
        totalQuranPages: allAmals.reduce((s, a) => s + (a.quranPages || 0), 0),
        totalExerciseMinutes: allAmals.reduce(
          (s, a) => s + (a.exerciseMinutes || 0),
          0,
        ),
        monthTotal: monthAmals.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;
    const userId = req.user._id;
    const query = { user: userId };
    const now = new Date();
    const bdNow = new Date(now.getTime() + 6 * 3600000);

    if (period === 'week') {
      const d = new Date(bdNow);
      d.setDate(d.getDate() - 7);
      query.date = { $gte: d.toISOString().split('T')[0] };
    } else if (period === 'month') {
      const m = month || bdNow.getMonth() + 1;
      const y = year || bdNow.getFullYear();
      query.date = {
        $gte: `${y}-${String(m).padStart(2, '0')}-01`,
        $lte: `${y}-${String(m).padStart(2, '0')}-31`,
      };
    } else if (period === 'year') {
      const y = year || bdNow.getFullYear();
      query.date = { $gte: `${y}-01-01`, $lte: `${y}-12-31` };
    }

    const amals = await Amal.find(query).sort({ date: 1 });
    const weeklyData = amals.map((a) => ({
      date: a.date,
      progress: a.progressScore,
      salahCount: [a.fajr, a.dhuhr, a.asr, a.maghrib, a.isha].filter(Boolean)
        .length,
      sleep: a.sleepMinutes,
      quranPages: a.quranPages,
      fasting: a.fasting,
    }));

    const salahFields = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const namaz = {};
    salahFields.forEach((s) => {
      namaz[s] = amals.filter((a) => a[s]).length;
    });

    const heatmap = amals.map((a) => ({
      date: a.date,
      value: a.progressScore,
    }));

    const monthlyMap = {};
    amals.forEach((a) => {
      const mo = a.date.slice(0, 7);
      if (!monthlyMap[mo])
        monthlyMap[mo] = { total: 0, progress: 0, fasting: 0, quranPages: 0 };
      monthlyMap[mo].total++;
      monthlyMap[mo].progress += a.progressScore;
      if (a.fasting) monthlyMap[mo].fasting++;
      monthlyMap[mo].quranPages += a.quranPages;
    });
    const monthlyData = Object.entries(monthlyMap).map(([mo, v]) => ({
      month: mo,
      avgProgress: Math.round(v.progress / v.total),
      ...v,
    }));

    res.json({
      success: true,
      data: { weeklyData, namaz, heatmap, monthlyData, total: amals.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAmal = async (req, res) => {
  try {
    const { _id, user, __v, ...updateData } = req.body;
    const amal = await Amal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: false },
    );
    if (!amal)
      return res
        .status(404)
        .json({ success: false, message: 'Amal not found' });
    const checks = [
      amal.fajr,
      amal.dhuhr,
      amal.asr,
      amal.maghrib,
      amal.isha,
      amal.tahajjud,
      amal.morningDua,
      amal.daytimeTawbah,
      amal.eveningDua,
      amal.fasting,
      amal.sadaqah,
      amal.quranPages > 0,
    ];
    amal.progressScore = Math.round(
      (checks.filter(Boolean).length / checks.length) * 100,
    );
    await amal.save({ validateBeforeSave: false });
    res.json({ success: true, data: amal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteAmal = async (req, res) => {
  try {
    await Amal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportData = async (req, res) => {
  try {
    const amals = await Amal.find({ user: req.user._id }).sort({ date: 1 });
    res.json({
      success: true,
      data: amals,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.importData = async (req, res) => {
  try {
    const { data } = req.body;
    if (!Array.isArray(data))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid format' });
    let imported = 0,
      skipped = 0;
    for (const item of data) {
      const exists = await Amal.findOne({
        user: req.user._id,
        date: item.date,
      });
      if (exists) {
        skipped++;
        continue;
      }
      await Amal.create({ ...item, user: req.user._id, _id: undefined });
      imported++;
    }
    res.json({
      success: true,
      message: `Imported: ${imported}, Skipped: ${skipped}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
