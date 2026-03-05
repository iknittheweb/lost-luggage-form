# Cruise 2026 Contact Form SMS Setup

This form submits data to a local Node.js server, which sends an SMS to `+1 (605) 496-5218` using Twilio.

## 1) Install dependencies

```powershell
npm.cmd install
```

## 2) Add environment variables

Create a `.env` file in the project root (or copy `.env.example`) and fill in your Twilio values:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER` (your Twilio phone number in E.164 format, like `+15551234567`)

### Demo mode (for testing without Twilio)

Set `DEMO_MODE=true` in your `.env` to log submissions to the server console instead of sending SMS.

## 3) Start the app

```powershell
npm.cmd start
```

Then open:

- `http://localhost:3000/contact-form.html`

## Notes

- SMS sending requires an active Twilio account and a verified destination if your account is in trial mode.
- The destination number is set server-side in `server.js` as `+16054965218`.
- In demo mode, submissions appear in the Node console with emoji indicators.
