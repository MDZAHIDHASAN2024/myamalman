const User = require('../models/User');
const Amal = require('../models/Amal');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    const usersWithStats = await Promise.all(users.map(async u => {
      const amalCount = await Amal.countDocuments({ user: u._id });
      return { ...u.toObject(), amalCount };
    }));
    res.json({ success: true, data: usersWithStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    // Admin cannot ban themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'নিজেকে ban করা যাবে না!' });
    }
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'banned', bannedReason: reason || 'No reason given' },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User banned', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active', bannedReason: '' },
      { new: true }
    );
    res.json({ success: true, message: 'User unbanned', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Admin cannot delete themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'নিজেকে delete করা যাবে না!' });
    }
    await Amal.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User and all data deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserData = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    const amals = await Amal.find({ user: req.params.id }).sort({ date: -1 });
    res.json({ success: true, data: { user, amals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const totalAmals = await Amal.countDocuments();
    res.json({ success: true, data: { totalUsers, activeUsers, bannedUsers, totalAmals } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
