import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creatorAnalytics } from '../src/creatorAnalytics.js';
import { recommendCreators, parseManualCreator } from '../src/creatorModel.js';
import { importProject, projects } from '../src/model.js';

test('analytics remain consistent, with bounded audience distributions and view-based engagement', () => {
  const campaign = importProject(projects[1]);
  const brief = campaign.briefs[0];
  const creators = recommendCreators(campaign, brief);
  creators.push(parseManualCreator({ url: '', username: 'example', activePlatform: 'TikTok', campaign, brief }).creator);
  for (const creator of creators) {
    const a = creatorAnalytics(creator, campaign, brief);
    assert.equal(a.followerHistory.length, 6);
    assert.equal(a.followerHistory.at(-1).value, creator.followers);
    assert.ok(a.views.min <= a.views.median && a.views.median <= a.views.max);
    const e = a.engagement;
    assert.equal(+((e.likes + e.saves + e.comments) / e.views * 100).toFixed(1), creator.engagementRate);
    for (const d of a.audience.dimensions) {
      assert.equal(d.actual.reduce((s, v) => s + v, 0), 100);
      assert.equal(d.target.reduce((s, v) => s + v, 0), 100);
      assert.equal(d.overlap, d.actual.reduce((s, v, i) => s + Math.min(v, d.target[i]), 0));
    }
    assert.equal(a.audience.score, Math.round(a.audience.dimensions.reduce((s, d) => s + d.overlap, 0) / 3));
    const other = creatorAnalytics(creator, { ...campaign, background: 'students beauty', product: 'beauty', market: 'CN' }, { title: '校园护肤', description: '学生美妆' });
    assert.deepEqual(other.followerHistory, a.followerHistory);
    assert.deepEqual(other.views, a.views);
    assert.equal(other.country, a.country);
    assert.deepEqual(other.audience.dimensions[0].actual, a.audience.dimensions[0].actual);
    assert.notDeepEqual(other.audience.dimensions[0].target, a.audience.dimensions[0].target);
    assert.notDeepEqual(other.audience.dimensions[2].target, a.audience.dimensions[2].target);
  }
});
