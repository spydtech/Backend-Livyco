// middlewares/recaptchaValidation.js
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

// Function to validate reCAPTCHA token
async function validateRecaptcha(token, expectedAction = 'login') {
  try {
    const projectID = "livyco-b65f5";
    const recaptchaKey = "6LcoCoorAAAAADiEb6OVg_NZSX8kNIZl91NYhToW";

    // Create the reCAPTCHA client
    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    // Build the assessment request
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(request);

    // Check if the token is valid
    if (!response.tokenProperties.valid) {
      console.log(`reCAPTCHA validation failed: ${response.tokenProperties.invalidReason}`);
      return { isValid: false, reason: response.tokenProperties.invalidReason };
    }

    // Check if the expected action was executed
    if (response.tokenProperties.action === expectedAction) {
      const score = response.riskAnalysis.score;
      console.log(`reCAPTCHA score: ${score}`);
      
      // You can set your own threshold (0.5 is common, 0.7 for strict)
      const threshold = 0.5;
      const isHuman = score >= threshold;
      
      return { 
        isValid: isHuman, 
        score: score,
        reasons: response.riskAnalysis.reasons 
      };
    } else {
      console.log("Action mismatch in reCAPTCHA validation");
      return { isValid: false, reason: "action_mismatch" };
    }
  } catch (error) {
    console.error("reCAPTCHA validation error:", error);
    return { isValid: false, reason: "validation_error" };
  }
}

export { validateRecaptcha };