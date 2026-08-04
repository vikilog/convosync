import assert from 'node:assert/strict';
import { FLOW_CHANNEL_THEMES, FLOW_EDGE_STYLE } from './channelTheme.js';

assert.equal(FLOW_CHANNEL_THEMES.instagram.channelLabel, 'Instagram');
assert.equal(FLOW_CHANNEL_THEMES.whatsapp.channelLabel, 'WhatsApp');
assert.ok(FLOW_CHANNEL_THEMES.instagram.iconChipBg.includes('#833AB4'));
assert.ok(FLOW_CHANNEL_THEMES.whatsapp.iconChipBg.includes('#25D366'));
assert.equal(FLOW_EDGE_STYLE.strokeWidth, 1.5);
assert.equal(FLOW_EDGE_STYLE.stroke, 'var(--color-border-strong)');

console.log('channelTheme.check: ok');
