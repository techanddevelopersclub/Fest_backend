const rateLimit = require('express-rate-limit');
const { BadRequestError } = require('../utils/errors');

const emailVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 3, // limit each user to 3 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many verification email requests. Please try again later.',
        details: {
            retryAfter: 'windowMs', // This will be replaced with actual time
            maxAttempts: 3
        }
    },
    keyGenerator: (req) => {
        // Use user ID instead of IP for more accurate limiting
        return req.user._id.toString();
    },
    handler: (req, res) => {
        const timeLeft = req.rateLimit.resetTime - Date.now();
        const minutesLeft = Math.ceil(timeLeft / (1000 * 60));
        
        res.status(429).json({
            status: 'error',
            message: 'Too many verification email requests',
            details: {
                retryAfter: timeLeft,
                minutesLeft: minutesLeft,
                nextValidRequest: new Date(req.rateLimit.resetTime).toISOString(),
                remainingAttempts: 0
            }
        });
    },
    skip: (req) => {
        // Skip rate limiting if user is already verified
        return req.user && req.user.isVerified;
    }
});

// Middleware to check if user has pending verification request
const checkPendingVerification = async (req, res, next) => {
    try {
        const user = req.user;
        
        if (user.isVerified) {
            throw new BadRequestError('Email is already verified');
        }

        // Get rate limit info
        const rateInfo = req.rateLimit;
        if (rateInfo) {
            // Add remaining attempts to response headers
            res.set('X-RateLimit-Limit', rateInfo.limit);
            res.set('X-RateLimit-Remaining', rateInfo.remaining);
            res.set('X-RateLimit-Reset', rateInfo.resetTime);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    emailVerificationLimiter,
    checkPendingVerification
};