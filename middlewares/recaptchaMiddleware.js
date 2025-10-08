// middlewares/recaptchaMiddleware.js
import { validateRecaptcha } from './recaptchaValidation.js';

const recaptchaMiddleware = async (req, res, next) => {
  // Skip reCAPTCHA in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const recaptchaToken = req.headers['recaptcha-token'] || req.body.recaptchaToken;

  if (!recaptchaToken) {
    return res.status(400).json({
      success: false,
      message: "reCAPTCHA token is required"
    });
  }

  try {
    const result = await validateRecaptcha(recaptchaToken, 'login');
    
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification failed",
        reason: result.reason
      });
    }

    // Attach recaptcha score to request for additional checks
    req.recaptchaScore = result.score;
    next();
  } catch (error) {
    console.error("reCAPTCHA middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "reCAPTCHA verification error"
    });
  }
};

export default recaptchaMiddleware;