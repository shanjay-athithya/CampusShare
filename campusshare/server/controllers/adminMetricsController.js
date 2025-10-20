import Resource from '../models/Resource.js';

// GET /api/admin/metrics/downloads-over-time?days=30
export const downloadsOverTime = async (req, res) => {
  const days = Math.max(1, Math.min(365, parseInt(req.query.days || '30', 10)));
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const points = await Resource.aggregate([
    { $match: { createdAt: { $gte: from } } },
    {
      $project: {
        day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        downloads: { $ifNull: ['$downloads', 0] }
      }
    },
    { $group: { _id: '$day', downloads: { $sum: '$downloads' } } },
    { $sort: { _id: 1 } }
  ]);

  res.json({ points: points.map(p => ({ date: p._id, downloads: p.downloads })) });
};


