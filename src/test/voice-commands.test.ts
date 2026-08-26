import { describe, expect, it } from 'vitest';
import { matchCommand } from '@/lib/voice-commands';

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