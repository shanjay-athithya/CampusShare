import Resource from '../models/Resource.js';
import User from '../models/User.js';

// GET /api/stats/top-contributors?limit=10&by=downloads|upvotes|net
export const getTopContributors = async (req, res) => {
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit || '10', 10)));
  const by = (req.query.by || 'downloads').toLowerCase();

  const agg = await Resource.aggregate([
    {
      $project: {
        uploadedBy: 1,
        downloads: { $ifNull: ['$downloads', 0] },
        upvotesCount: { $size: { $ifNull: ['$upvotes', []] } },
        downvotesCount: { $size: { $ifNull: ['$downvotes', []] } }
      }
    },
    {
      $group: {
        _id: '$uploadedBy',
        totalDownloads: { $sum: '$downloads' },
        totalUpvotes: { $sum: '$upvotesCount' },
        totalDownvotes: { $sum: '$downvotesCount' }
      }
    },
    { $addFields: { netUpvotes: { $subtract: ['$totalUpvotes', '$totalDownvotes'] } } },
    {
      $sort:
        by === 'upvotes' ? { totalUpvotes: -1, _id: 1 } :
        by === 'net' ? { netUpvotes: -1, _id: 1 } :
        { totalDownloads: -1, _id: 1 }
    },
    { $limit: limit }
  ]);

  const users = await User.find({ _id: { $in: agg.map(a => a._id) } })
    .select('name email department')
    .lean();

  const userMap = new Map(users.map(u => [String(u._id), u]));
  const contributors = agg.map(a => ({
    user: userMap.get(String(a._id)) || { name: 'Unknown', email: '', department: '' },
    totals: {
      downloads: a.totalDownloads,
      upvotes: a.totalUpvotes,
      downvotes: a.totalDownvotes,
      net: a.netUpvotes
    }
  }));

  res.json({ contributors });
};


