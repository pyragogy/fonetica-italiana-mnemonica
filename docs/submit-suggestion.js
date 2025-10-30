const fetch = require('node-fetch');

exports.handler = async (event) => {
  // This function is now intended to be a Netlify "submission-created" event handler.
  // It receives the form submission data in event.payload.data.

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const payload = JSON.parse(event.body).payload; // Netlify submission-created event structure
  const formData = payload.data;
  const recaptchaToken = formData['g-recaptcha-response']; // Get token from form data

  if (!recaptchaToken) {
    console.error('reCAPTCHA token missing from form submission.');
    return { statusCode: 400, body: 'reCAPTCHA token missing.' };
  }

  // 1. Verifica del token reCAPTCHA Enterprise con Google
  try {
    const recaptchaResponse = await fetch(`https://recaptchaenterprise.googleapis.com/v1/projects/ecosystem-1761686232893/assessments?key=${process.env.RECAPTCHA_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            event: {
                token: recaptchaToken,
                siteKey: '6LfzdPorAAAAAOfWCzYl9eJBjCeUiavoOgMQHNUJ', // La tua Site Key
                expectedAction: 'SUBMIT_SUGGESTION' // L'azione che hai definito nel frontend
            }
        })
    });

    const assessment = await recaptchaResponse.json();

    // Controlla se il punteggio è valido. La soglia di 0.5 è un buon punto di partenza.
    if (!assessment.tokenProperties.valid || assessment.riskAnalysis.score < 0.5) {
        console.error('reCAPTCHA assessment failed:', assessment);
        // Restituisci un codice di errore per indicare a Netlify che la submission è spam/fallita.
        return { statusCode: 403, body: 'reCAPTCHA validation failed.' };
    }

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return { statusCode: 500, body: 'Error verifying reCAPTCHA.' };
  }

  // 2. Se reCAPTCHA è valido, Netlify continuerà a processare il form.
  // Non è necessario inoltrare i dati a Netlify qui, perché Netlify li ha già ricevuti.
  // Semplicemente restituisci un successo.
  return { statusCode: 200, body: 'reCAPTCHA verified. Form will be processed by Netlify.' };
};