// middlewares/recaptchaValidation.js
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

// middlewares/recaptchaValidation.js
import fetch from 'node-fetch';

// Simple reCAPTCHA v3 validation (more reliable than Enterprise for most use cases)
async function validateRecaptcha(token, expectedAction = 'login') {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Your reCAPTCHA v3 secret key
    
    if (!secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY not set, skipping validation');
      return { isValid: true, score: 0.9 }; // Fallback for development
    }

    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await response.json();
    
    console.log('reCAPTCHA verification response:', data);

    if (data.success && data.action === expectedAction) {
      return {
        isValid: true,
        score: data.score,
        action: data.action
      };
    } else {
      return {
        isValid: false,
        reason: data['error-codes'] ? data['error-codes'].join(', ') : 'verification_failed',
        score: data.score || 0
      };
    }
  } catch (error) {
    console.error("reCAPTCHA validation error:", error);
    return {
      isValid: false,
      reason: "network_error",
      score: 0
    };
  }
}

export { validateRecaptcha };