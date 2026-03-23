const Tip = require('../models/Tip');

const getAll = async (req, res) => {
  try {
    const { type, search } = req.query;
    const query = {};
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'items.text': { $regex: search, $options: 'i' } },
        { 'numberedItems.text': { $regex: search, $options: 'i' } },
        { 'expandableItems.title': { $regex: search, $options: 'i' } },
        { 'expandableItems.detail': { $regex: search, $options: 'i' } },
      ];
    }
    const tips = await Tip.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: tips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { title, type, items, numberedItems, expandableItems } = req.body;

    if (!title || !type) {
      return res
        .status(400)
        .json({ success: false, message: 'title এবং type দিন' });
    }

    const hasItems =
      (items && items.length) ||
      (numberedItems && numberedItems.length) ||
      (expandableItems && expandableItems.length);

    if (!hasItems) {
      return res
        .status(400)
        .json({ success: false, message: 'কমপক্ষে ১টা item দিন' });
    }

    const tip = await Tip.create({
      title,
      type,
      items: items || [],
      numberedItems: numberedItems || [],
      expandableItems: expandableItems || [],
      createdBy: req.user._id,
    });

    await tip.populate('createdBy', 'name');
    res.status(201).json({ success: true, data: tip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id);
    if (!tip)
      return res.status(404).json({ success: false, message: 'Not found' });

    const isOwner = tip.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (req.body.title) tip.title = req.body.title;
    if (req.body.items) tip.items = req.body.items;
    if (req.body.numberedItems !== undefined)
      tip.numberedItems = req.body.numberedItems;
    if (req.body.expandableItems !== undefined)
      tip.expandableItems = req.body.expandableItems;

    await tip.save();
    await tip.populate('createdBy', 'name');
    res.json({ success: true, data: tip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const tip = await Tip.findById(req.params.id);
    if (!tip)
      return res.status(404).json({ success: false, message: 'Not found' });

    const isOwner = tip.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await tip.deleteOne();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, update, remove };
