const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Questa funzione viene attivata dall'evento "submission-created" di Netlify.
  // I dati del form si trovano in event.body.payload.data

  // Per l'evento "submission-created", Netlify invia sempre una richiesta POST.
  // Il controllo `event.httpMethod` non è necessario e può causare errori.

  try {
    const payload = JSON.parse(event.body).payload;
    const formData = payload.data;
    const recaptchaToken = formData['g-recaptcha-response'];

    if (!recaptchaToken) {
      console.error('ERRORE: Token reCAPTCHA mancante nella submission del form.');
      // Se il token manca, blocchiamo la submission.
      return { statusCode: 400, body: 'reCAPTCHA token is missing.' };
    }

    // 1. Verifica del token reCAPTCHA Enterprise con Google
    const recaptchaResponse = await fetch(`https://recaptchaenterprise.googleapis.com/v1/projects/ecosystem-1761686232893/assessments?key=${process.env.RECAPTCHA_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            event: {
                token: recaptchaToken,
                siteKey: '6LfzdPorAAAAAOfWCzYl9eJBjCeUiavoOgMQHNUJ', // La tua Site Key
                expectedAction: 'SUBMIT_SUGGESTION' // L'azione definita nel frontend
            }
        })
    });

    if (!recaptchaResponse.ok) {
        const errorBody = await recaptchaResponse.text();
        console.error(`ERRORE API Google reCAPTCHA: ${recaptchaResponse.status} - ${errorBody}`);
        return { statusCode: 500, body: 'Error communicating with reCAPTCHA service.' };
    }
    
    const assessment = await recaptchaResponse.json();

    // Controlla se il punteggio è valido. La soglia di 0.5 è un buon punto di partenza.
    if (!assessment.tokenProperties.valid || assessment.riskAnalysis.score < 0.5) {
        console.warn('ATTENZIONE: reCAPTCHA assessment fallito o punteggio basso. Possibile SPAM.', assessment);
        // Restituisci un errore per indicare a Netlify di scartare la submission (o marcarla come spam).
        return { statusCode: 403, body: 'reCAPTCHA validation failed. Submission rejected.' };
    }

    // 2. Se la verifica ha successo, restituisci 200.
    // Netlify procederà a salvare il form nel pannello "Forms".
    console.log('SUCCESS: reCAPTCHA verificato con successo. Punteggio:', assessment.riskAnalysis.score);
    return { statusCode: 200, body: 'reCAPTCHA verified. Form submission will be processed.' };

  } catch (error) {
    console.error('ERRORE CRITICO nella funzione submit-suggestion:', error);
    // In caso di errore imprevisto, è meglio non accettare la submission per sicurezza.
    return { statusCode: 500, body: 'An internal error occurred during reCAPTCHA verification.' };
  }
};