# FlowWrite Studio

Build a simple, clean, fully functional web app called FlowWrite.



PURPOSE



FlowWrite helps a user write ORIGINAL lyrics that fit their own uploaded instrumental/beat.



The user uploads a beat, enters a lyric idea, selects a flow/style, and gets 3–5 different original lyric versions that are structured into bars.



This is NOT a music-generation platform. Do not generate melodies, vocals, or instrumental music.



IMPORTANT DEVELOPMENT RULE



Build a REAL WORKING MVP.



Do not create fake buttons, placeholder functionality, mock AI responses, or unfinished pages.



Every visible button must either work or be clearly disabled with an explanation.



Keep the application simple.



---



1. HOME PAGE



Create a professional dark music-production interface.



Header:



- FlowWrite logo

- "Lyrics"

- "My Projects"



Main hero:



Write lyrics that fit your beat.



Subtitle:

"Upload your beat, describe your idea, and explore different flows."



Primary button:

Start Writing



---



2. CREATE PROJECT



When the user clicks Start Writing, open the composer.



Fields:



Beat



- Upload MP3, WAV, or M4A

- Show uploaded filename

- Show audio player

- Play/Pause

- Seek bar

- Current time / duration

- Remove beat button



The audio must actually play using the browser's HTML5 Audio API.



Do NOT upload audio to an external service just to play it.



Beat Settings



Allow manual input:



BPM:



- number input

- default: 90



Time signature:



- default 4/4



Bars:



- 4

- 8

- 16

- 32



The user can change these values.



---



3. LYRIC IDEA



Create a large text box:



"What's the song about?"



Example placeholder:



"Missing someone after a breakup but trying to move forward."



Additional controls:



Language:



- Hindi

- Hinglish

- English

- Urdu

- Assamese



Mood:



- Sad

- Romantic

- Dark

- Hopeful

- Motivational

- Chill



Flow:



- Smooth

- Rap

- Melodic

- Conversational

- Fast

- Slow



Rhyme:



- Simple

- End rhyme

- Internal rhyme

- No forced rhyme



Lyric density:



- Low

- Medium

- High



---



4. GENERATE FLOWS



Primary button:



Generate 5 Flows



When clicked, send the user's inputs to the configured AI provider.



IMPORTANT:

The AI must be instructed to create ORIGINAL lyrics.



Never request lyrics from existing copyrighted songs.



Never imitate a living artist's exact writing style.



The AI prompt should contain:



"You are an original songwriting assistant. Write completely original lyrics based only on the user's topic, language, mood, flow, rhyme preference, BPM and bar count. Do not reproduce or paraphrase existing copyrighted lyrics. Do not imitate a specific living artist."



Generate 5 substantially different versions.



Each version should have:



- Flow name

- Short description

- Lyrics divided by bars

- Approximate syllable count per bar



Example:



FLOW 1 — Smooth



Bar 1:

Raat phir teri yaad aayi



Bar 2:

Dil ko neend na aayi



Bar 3:

...



Do not make every flow almost identical.



---



5. FLOW CARDS



Display the generated flows as cards.



Each card contains:



- Flow name

- Style description

- Lyrics

- Bar numbers

- Syllable count

- Copy button

- Edit button

- Play From Here button

- Regenerate button



Example:



FLOW 1

Smooth / Emotional



BAR 1

Raat phir teri yaad aayi

7 syllables



BAR 2

Dil ko neend na aayi

6 syllables



Buttons:

[Play] [Edit] [Regenerate]



---



6. LYRIC EDITOR



When Edit is clicked, allow the user to edit each bar individually.



Example:



BAR 1

[ Raat phir teri yaad aayi ]



BAR 2

[ Dil ko neend na aayi ]



Show live approximate syllable count.



Do not prevent the user from entering anything.



Show a small indicator:



Too short

Good

Long



This is only guidance, not a strict restriction.



---



7. BEAT SYNC



Create a simple timeline.



Use the manually entered BPM and 4/4 time signature.



Calculate approximate beat duration:



60000 / BPM milliseconds per beat.



Calculate:



4 beats = 1 bar.



Create a bar grid based on the selected number of bars.



While the beat is playing:



- highlight the current bar

- highlight the corresponding lyric

- automatically scroll to the active lyric



The synchronization does NOT need advanced audio analysis.



It can use BPM + playback position.



Provide:



[Play Beat]

[Pause]

[Restart]



Also provide:



Metronome



The metronome should actually generate a click using the Web Audio API.



Add:



- Metronome ON/OFF

- Volume

- BPM follows project BPM



---



8. MULTIPLE FLOWS



The most important feature:



The same beat and lyric idea must be able to produce different approaches.



For example:



Flow 1:

Smooth



Flow 2:

Rap



Flow 3:

Melodic



Flow 4:

Conversational



Flow 5:

Syncopated



Do NOT simply change a few words.



Change:



- line length

- syllable density

- rhyme placement

- pauses

- rhythmic phrasing

- vocabulary



while keeping the same topic and requested language.



---



9. REGENERATE ONE BAR



Every bar must have a small regenerate button.



When clicked:



Generate 3 alternatives for ONLY that bar.



Keep all other bars unchanged.



Show:



Alternative 1

Alternative 2

Alternative 3



User clicks one to replace the current bar.



---



10. SAVE PROJECT



Add:



Save Project



For the MVP, save projects using browser localStorage.



Store:



- project name

- beat filename

- lyric idea

- BPM

- language

- mood

- flow

- generated lyrics

- edited lyrics

- creation date



Do NOT require a database for the first version.



Create a "My Projects" page showing saved projects.



User can:



- Open

- Rename

- Delete



---



11. EXPORT



Add:



Copy Lyrics



and:



Download TXT



The TXT should contain:



Project name



BPM:

Language:

Mood:



FLOW NAME



BAR 1:

lyrics



BAR 2:

lyrics



etc.



Do not add unnecessary export formats in this MVP.



---



12. RESPONSIVE DESIGN



The website must work properly on:



- Android phones

- iPhone

- tablets

- desktop



Mobile composer should be easy to use.



Do not make the interface overcrowded.



---



13. DESIGN



Style:



- modern music-production SaaS

- dark interface

- clean typography

- subtle borders

- rounded cards

- professional spacing

- responsive

- minimal animations



Do not copy the design of another website.



---



14. AI CONFIGURATION



Do not expose any API key in frontend code.



Create a secure server-side/backend function for AI requests.



Put the AI provider configuration behind environment variables.



If no AI API key is configured, the application must clearly show:



"AI generation is not configured yet. Add your AI API key to enable generation."



Do not fake generated lyrics.



The rest of the website must still work without the AI key:



- beat upload

- audio playback

- BPM

- timeline

- metronome

- editor

- local saving

- TXT export



---



15. ERROR HANDLING



Handle:



- unsupported audio file

- missing lyric idea

- invalid BPM

- AI request failure

- network failure

- empty AI response



Show useful error messages.



Never leave the user staring at a loading screen indefinitely.



Add loading state:



"Writing your flows..."



with a cancel/timeout fallback.



---



16. COPYRIGHT SAFETY



The app must generate original text.



Do NOT include:



- copyrighted lyric databases

- lyric scraping

- copyrighted song lyrics

- artist-style imitation

- voice cloning

- music generation

- unauthorized samples



Add a small footer:



"Users are responsible for ensuring they have the rights to audio they upload."



---



17. MVP PRIORITY



Build in this order:



1. Beat upload + playback

2. BPM/bar settings

3. Lyric input

4. AI generation

5. 5 different flows

6. Bar editor

7. Beat/lyric synchronization

8. Metronome

9. Local project saving

10. TXT export



Do NOT add unnecessary features such as:



- social network

- subscriptions

- payments

- marketplace

- advanced mastering

- vocal generation

- stem separation

- complicated authentication

- advanced audio analysis



Focus on making the above features actually work.



FINAL REQUIREMENT



Before considering the build complete, test the complete flow:



Upload beat → set BPM → enter idea → select language/mood/flow → generate 5 flows → play beat → lyrics highlight by bar → edit a bar → regenerate that bar → save project → reopen project → export TXT.



Fix any errors found during testing.



Do not just create the UI. Implement the functionality.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2d8bd5a9-b57f-4f44-9df4-06e425c788b7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
