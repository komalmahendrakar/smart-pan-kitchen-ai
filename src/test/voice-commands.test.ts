import { describe, expect, it } from 'vitest';
import { matchCommand, stripWakeWord } from '@/lib/voice-commands';

describe('matchCommand', () => {
  it.each(['next', 'neck', 'नेक्स्ट', 'नैक्स्ट', 'نیکسٹ'])('recognizes %s as next', transcript => {
    expect(matchCommand(transcript)).toBe('next');
  });

  it.each(['repeat', 'रिपीट', 'ریپیٹ', 'दोबारा'])('recognizes %s as repeat', transcript => {
    expect(matchCommand(transcript)).toBe('repeat');
  });

  it('keeps native Hindi navigation commands working', () => {
    expect(matchCommand('अगला')).toBe('next');
    expect(matchCommand('पिछला')).toBe('previous');
  });
});
describe('stripWakeWord', () => {
  it('extracts the command after the wake word', () => {
    expect(stripWakeWord('Smart Pan, next')).toBe('next');
    expect(stripWakeWord('smartpan repeat')).toBe('repeat');
    expect(stripWakeWord('स्मार्ट पैन अगला')).toBe('अगला');
  });
  it('returns null without the wake word', () => {
    expect(stripWakeWord('so then you add the onions')).toBeNull();
  });
});
