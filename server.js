const path = require('path');
const express = require('express');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const destinationNumber = '+16054965218';
const demoMode = process.env.DEMO_MODE === 'true';

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
  if (demoMode) {
    console.log('⚙️  Demo mode enabled - submissions will log to console');
  } else {
    console.warn('Missing Twilio env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER');
  }
}

const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact-form.html'));
});

app.all('*', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  return next();
});

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return [value];
  }

  return [];
}

app.post('/api/send-text', async (req, res) => {
  try {
    console.log('📨 API endpoint hit - processing submission');
    console.log('Request body:', JSON.stringify(req.body));

    if (!demoMode && (!twilioClient || !TWILIO_FROM_NUMBER)) {
      return res.status(500).json({
        ok: false,
        message: 'Server is missing Twilio configuration.'
      });
    }

    const { name, message, email, phone, otherContact } = req.body;
    const contactMethods = toArray(req.body.contactMethods);

    if (!name || !message) {
      return res.status(400).json({
        ok: false,
        message: 'Name and message are required.'
      });
    }

    if (contactMethods.length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'At least one contact method is required.'
      });
    }

    if (contactMethods.includes('email') && !email) {
      return res.status(400).json({
        ok: false,
        message: 'Email is required when Email is selected.'
      });
    }

    if (contactMethods.includes('phone') && !phone) {
      return res.status(400).json({
        ok: false,
        message: 'Phone is required when Phone is selected.'
      });
    }

    if (contactMethods.includes('other') && !otherContact) {
      return res.status(400).json({
        ok: false,
        message: 'Other contact method is required when Other is selected.'
      });
    }

    const smsBodyLines = [
      'Cruise 2026: Found Item Form Submission',
      `Name: ${name}`,
      `Preferred contact methods: ${contactMethods.join(', ')}`,
      contactMethods.includes('email') ? `Email: ${email}` : null,
      contactMethods.includes('phone') ? `Phone: ${phone}` : null,
      contactMethods.includes('other') ? `Other: ${otherContact}` : null,
      `Message: ${message}`
    ].filter(Boolean);

    if (demoMode) {
      console.log('📨 [DEMO] Submission received:');
      console.log(smsBodyLines.join('\n'));
      console.log(`🎯 [DEMO] Would send to: ${destinationNumber}\n`);
    } else {
      await twilioClient.messages.create({
        body: smsBodyLines.join('\n'),
        from: TWILIO_FROM_NUMBER,
        to: destinationNumber
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      message: 'Failed to send text message.'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
