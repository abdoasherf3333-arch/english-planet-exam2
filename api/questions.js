const { publicItems } = require('./_lib/grade');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ items: publicItems() });
};
