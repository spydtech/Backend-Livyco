// middlewares/recaptchaMiddleware.js
import { validateRecaptcha } from './recaptchaValidation.js';

const recaptchaMiddleware = async (req, res, next) => {
  // Skip reCAPTCHA in development for testing
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.log('Development mode: Skipping reCAPTCHA validation');
    return next();
  }

  const recaptchaToken = req.headers['recaptcha-token'] || req.body.recaptchaToken;

  if (!recaptchaToken) {
    return res.status(400).json({
      success: false,
      message: "Security verification is required. Please refresh the page."
    });
  }

  try {
    const result = await validateRecaptcha(recaptchaToken, 'login');
    
    if (!result.isValid) {
      console.log('reCAPTCHA validation failed:', result.reason);
      return res.status(400).json({
        success: false,
        message: "Security verification failed. Please try again.",
        reason: result.reason
      });
    }

    // Optional: Check score for additional security
    if (result.score < 0.3) {
      return res.status(400).json({
        success: false,
        message: "Suspicious activity detected. Please try again.",
        score: result.score
      });
    }

    req.recaptchaScore = result.score;
    next();
  } catch (error) {
    console.error("reCAPTCHA middleware error:", error);
    
    // Fallback: allow request to proceed in case of reCAPTCHA service failure
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: "Security service temporarily unavailable. Please try again later."
      });
    } else {
      // In development, proceed without reCAPTCHA
      console.log('reCAPTCHA service error, proceeding in development mode');
      next();
    }
  }
};

export default recaptchaMiddleware;