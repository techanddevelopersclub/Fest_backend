const rateLimit = require('express-rate-limit');
const { BadRequestError } = require('../utils/errors');

const eventEmailRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 10, // limit each user to 10 event registration emails per 15 minutes
    message: {
        status: 'error',
        message: 'Too many event registration email requests. Please try again later.',
        details: {
            retryAfter: 'windowMs',
            maxAttempts: 10
        }
    },
    keyGenerator: (req) => {
        // Use combination of user ID and event ID for more granular control
        return `${req.user._id.toString()}_${req.params.eventId || 'general'}`;
    },
    handler: (req, res) => {
        const timeLeft = req.rateLimit.resetTime - Date.now();
        const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
        
        res.status(429).json({
            status: 'error',
            message: 'Too many event registration email requests',
            details: {
                retryAfter: timeLeft,
                minutesLeft: minutesLeft,
                nextValidRequest: new Date(req.rateLimit.resetTime).toISOString(),
                remainingAttempts: 0
            }
        });
    }
});

module.exports = {
    eventEmailRateLimiter
};