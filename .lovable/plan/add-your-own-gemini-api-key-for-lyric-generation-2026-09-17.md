# Add your own Gemini API key for lyric generation

## Goal
Generate 5 Flows (and bar/flow regeneration) calls Google's Gemini API directly with your own key, so real lyrics are produced even when Lovable's built-in AI credits are exhausted. Lovable's built-in AI stays as an automatic fallback.

## Steps

1. **Store your key securely**
   - Open the secure secret form and ask you to paste a `GEMINI_API_KEY` (obtained free from aistudio.google.com → "Get API key").
   - The key is stored encrypted and only read by server-side code — never exposed to the browser.

2. **Update the AI server functions** (`src/lib/ai.functions.ts`)
   - Keep the exact same safety prompt and JSON output contract.
   - New call order inside `callGateway`:
     1. If `GEMINI_API_KEY` is set → call Google's Gemini API directly (`generativelanguage.googleapis.com`, model `gemini-2.5-flash`, JSON response mode) using that key.
     2. If no key is set, or the Gemini call fails with a retryable error → fall back to the existing Lovable AI gateway path (unchanged).
   - Map errors to the same friendly messages (rate limited, invalid key → "Your AI key was rejected — check it in settings", credits exhausted, network failure).
   - Update `getAiStatus` to report `configured: true` when either key exists, plus which source is active ("Your Gemini key" vs "Built-in AI").

3. **Show the key status in the composer** (`src/routes/compose.tsx`)
   - Update the AI status banner text: "Using your Gemini API key" when your key is active, "Using built-in AI" for fallback, or the existing "not configured" message when neither exists.

4. **Verify**
   - Re-check the build is clean.
   - Test one real Generate 5 Flows call through the app with your key and confirm 5 different flows come back.

## What you'll need to do
- Paste your Gemini API key into the secure form when prompted (free key: aistudio.google.com → Get API key).

## Technical details
- All key handling stays in server functions (`process.env["GEMINI_API_KEY"]` read inside the handler); nothing changes in browser code beyond banner text.
- Gemini endpoint: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` with `responseMimeType: application/json`; responses parsed through the same existing JSON-with-fallback parser.
- No database, no new dependencies.
