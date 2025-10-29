const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Non procedere se non è una richiesta POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const params = new URLSearchParams(event.body);
  const recaptchaToken = params.get('g-recaptcha-response');
  const formName = params.get('form-name');

  // 1. Verifica del token reCAPTCHA con Google
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

    // Controlla se il punteggio è valido. Puoi aggiustare la soglia (es. > 0.5)
    if (!assessment.tokenProperties.valid || assessment.riskAnalysis.score < 0.5) {
        console.error('reCAPTCHA assessment failed:', assessment);
        return { statusCode: 400, body: 'reCAPTCHA validation failed.' };
    }

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return { statusCode: 500, body: 'Error verifying reCAPTCHA.' };
  }

  // 2. Se reCAPTCHA è valido, inoltra i dati del modulo a Netlify
  try {
    // Rimuovi il token reCAPTCHA prima di inviare a Netlify
    params.delete('g-recaptcha-response');

    // L'endpoint deve essere la pagina dove si trova il form (in questo caso, la root '/')
    // e il corpo deve essere codificato correttamente per Netlify.
    await fetch(`${process.env.URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    return { statusCode: 200, body: 'Suggestion submitted successfully.' };
  } catch (error) {
    console.error('Error submitting to Netlify:', error);
    return { statusCode: 500, body: 'Error submitting form.' };
  }
};