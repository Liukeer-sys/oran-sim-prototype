import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySetup, emptyBrief, isComplete, fileError, projects, importProject, parseDescription, timingError, changeBriefAudienceMode, effectiveBriefAudience } from '../src/model.js';

test('CTA requires five campaign basics, one platform and complete briefs; settings are optional', () => {
  assert.equal(isComplete(emptySetup()), false);
  const data = importProject(projects[0]);
  assert.equal(isComplete(data), true);
  assert.equal(isComplete({ ...data, product: '  ' }), false);
  assert.equal(isComplete({ ...data, background: '' }), true);
  assert.equal(isComplete({ ...data, brandName: ' ' }), false);
  assert.equal(isComplete({ ...data, productCategory: '' }), false);
  assert.equal(isComplete({ ...data, market: '' }), false);
  assert.equal(isComplete({ ...data, platform: [] }), false);
  assert.equal(isComplete({ ...data, platform: ['小红书', '抖音'] }), false);
  assert.equal(isComplete({ ...data, briefs: [] }), false);
  assert.equal(isComplete({ ...data, briefs: [...data.briefs, emptyBrief()] }), false);
  assert.equal(isComplete({ ...data, briefs: [{ ...data.briefs[0], description: ' ' }] }), false);
});
test('every mock project imports editable, independent brief data', () => {
  for (const project of projects) {
    const first = importProject(project), second = importProject(project);
    assert.equal(isComplete(first), true);
    assert.equal(first.briefs.length, project.briefs.length);
    assert.equal(first.briefs[0].title, project.briefs[0][0]);
    assert.equal(first.briefs[0].description, project.briefs[0][1]);
    assert.equal(first.briefs[0].contentFormat, '');
    assert.equal(first.briefs[0].audienceMode, 'campaign');
    assert.notEqual(first.briefs[0].id, second.briefs[0].id);
    first.briefs[0].title = 'Edited';
    assert.notEqual(second.briefs[0].title, 'Edited');
    assert.notEqual(project.briefs[0][0], 'Edited');
  }
});

test('brief audience inherits live campaign values and custom drafts are isolated', () => {
  const campaign = emptySetup();
  campaign.audience.age = ['25–34'];
  const base = { ...emptyBrief(), title: 'Original title', description: 'Original description' };
  assert.equal(effectiveBriefAudience(campaign, base), campaign.audience);
  const one = changeBriefAudienceMode(base, 'custom', campaign.audience);
  const two = changeBriefAudienceMode(emptyBrief(), 'custom', campaign.audience);
  one.customAudience.age.push('35–44');
  one.customAudience.region = 'Oregon';
  assert.deepEqual(campaign.audience.age, ['25–34']);
  assert.deepEqual(two.customAudience.age, ['25–34']);
  assert.equal(two.customAudience.region, '');
  campaign.audience.region = 'California';
  assert.equal(effectiveBriefAudience(campaign, one).region, 'Oregon');
  const inherited = changeBriefAudienceMode(one, 'campaign', campaign.audience);
  assert.equal(effectiveBriefAudience(campaign, inherited).region, 'California');
  assert.equal(changeBriefAudienceMode(inherited, 'custom', campaign.audience).customAudience.region, 'Oregon');
  assert.equal(one.title, base.title);
  assert.equal(one.description, base.description);
});
test('uploads validate extension, size and empty files', () => {
  for(const name of ['brief.pdf', 'brief.DOCX', 'brief.txt']) assert.equal(fileError({ name, size: 100 }), '');
  assert.match(fileError({ name: 'image.png', size: 100 }), /格式/);
  assert.match(fileError({ name: 'brief.pdf', size: 0 }), /为空/);
  assert.match(fileError({ name: 'brief.pdf', size: 21 * 1024 * 1024 }), /20 MB/);
});

test('text parsing preserves input and leaves unknown facts empty', () => {
  const text = '希望通过生活记录推广新品。';
  const partial = parseDescription(text);
  assert.equal(partial.background, text);
  assert.deepEqual(partial.platform, []);
  assert.equal(partial.market, '');
  assert.equal(partial.product, '');
  assert.equal(partial.briefs.length, 2);
  assert.equal(isComplete(partial), false);
  const complete = parseDescription('品牌：云眠。希望在小红书面向中国新婚人群推广床品。');
  assert.equal(complete.brandName, '云眠');
  assert.equal(complete.product, '全棉家居床品');
  assert.equal(complete.market, 'CN');
  assert.deepEqual(complete.platform, ['小红书']);
  assert.equal(isComplete(complete), true);
});

test('text and Hub imports use the first mentioned platform without mutating source data', () => {
  assert.deepEqual(parseDescription('在小红书和抖音一起做，小红书优先').platform, ['小红书']);
  assert.deepEqual(parseDescription('YouTube 和 TikTok').platform, ['YouTube']);
  const project = { ...projects[2], platform: ['小红书', '抖音'] };
  const imported = importProject(project);
  assert.deepEqual(imported.platform, ['小红书']);
  imported.platform.pop();
  assert.deepEqual(project.platform, ['小红书', '抖音']);
});

test('campaign settings have independent multi-select arrays and a fixed fourteen-day duration', () => {
  const first = emptySetup(), second = emptySetup();
  assert.equal(first.performanceFocus, 'Overall Performance');
  assert.equal(first.timing.mode, 'current');
  first.audience.age.push('25–34', '35–44');
  first.audience.gender.push('female', 'male');
  assert.deepEqual(second.audience.age, []);
  assert.deepEqual(second.audience.gender, []);
  assert.equal(first.timing.durationDays, 14);
  assert.equal(timingError({ mode: 'current', start: '' }), '');
  assert.ok(timingError({ mode: 'date', start: '' }));
  assert.equal(timingError({ mode: 'date', start: '2026-12-10' }), '');
  assert.ok(timingError({ mode: 'range', start: '2026-12-10', end: '2026-12-01' }));
  assert.ok(timingError({ mode: 'range', start: '2026-12-10', end: '2026-12-20' }));
  const explicit = parseDescription('品牌：测试品牌。产品：便携水杯。品类：生活用品。TikTok 美国。');
  assert.equal(explicit.brandName, '测试品牌');
  assert.equal(explicit.product, '便携水杯');
  assert.equal(explicit.productCategory, '生活用品');
});
