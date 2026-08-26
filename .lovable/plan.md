# Fix multilingual voice-command recognition

## Implementation
- Bias AI transcription toward the selected recipe language and the small supported command vocabulary.
- Normalize common phonetic Hindi/Urdu-script transcriptions of English commands (such as “नेक्स्ट” and “نیکسٹ”) before intent matching.
- Preserve native Hindi commands and existing English fuzzy matching.
- Surface the backend's actual transcription error message when a request fails.

## Verification
- Add focused matcher tests for English, Devanagari, and Urdu-script command variants.
- Invoke the updated transcription function and confirm its response contract.

## Technical details
- Update the shared client-side matcher and the `transcribe-command` Lovable Cloud function only.
- Keep the current WAV recording flow and `openai/gpt-4o-mini-transcribe` model.
