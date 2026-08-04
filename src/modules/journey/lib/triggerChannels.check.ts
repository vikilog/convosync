import assert from 'node:assert/strict';
import { sampleMessagePreview } from './triggerChannels.ts';

assert.equal(sampleMessagePreview('Hi {{contact.name}}!'), 'Hi Alex!');

console.log('triggerChannels check ok');
