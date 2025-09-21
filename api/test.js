// Test endpoint for Vercel deployment
module.exports = (req, res) => {
  res.status(200).json({
    message: 'Festify API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin']
    }
  });
};
