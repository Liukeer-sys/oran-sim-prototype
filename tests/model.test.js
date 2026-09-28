import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptySetup, emptyBrief, isComplete, fileError, projects, importProject, parseDescription } from '../src/model.js';

test('CTA requires product, background and complete briefs; whitespace is not content', () => {
  assert.equal(isComplete(emptySetup()), false);
  const data = importProject(projects[0]);
  assert.equal(isComplete(data), true);
  assert.equal(isComplete({ ...data, product: '  ' }), false);
  assert.equal(isComplete({ ...data, background: '' }), false);
  assert.equal(isComplete({ ...data, platform: [] }), false);
  assert.equal(isComplete({ ...data, platform: ['小红书', '抖音'] }), true);
  assert.equal(isComplete({ ...data, briefs: [] }), false);
  assert.equal(isComplete({ ...data, briefs: [...data.briefs, emptyBrief()] }), false);
  assert.equal(isComplete({ ...data, briefs: [{ ...data.briefs[0], description: ' ' }] }), false);
});
test('every mock project imports editable, independent brief data', () => {
  for (const project of projects) {
    const first = importProject(project), second = importProject(project);
    assert.equal(isComplete(first), true);
    assert.equal(first.briefs.length, project.briefs.length);
    assert.notEqual(first.briefs[0].id, second.briefs[0].id);
    first.briefs[0].title = 'Edited';
    assert.notEqual(second.briefs[0].title, 'Edited');
    assert.notEqual(project.briefs[0][0], 'Edited');
  }
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
  assert.equal(complete.product, '云眠');
  assert.equal(complete.market, 'CN');
  assert.deepEqual(complete.platform, ['小红书']);
  assert.equal(isComplete(complete), true);
});

test('text and Hub imports retain multiple independent platform selections', () => {
  assert.deepEqual(parseDescription('在小红书和抖音一起做，小红书优先').platform, ['小红书', '抖音']);
  const project = { ...projects[2], platform: ['小红书', '抖音'] };
  const imported = importProject(project);
  assert.deepEqual(imported.platform, ['小红书', '抖音']);
  imported.platform.pop();
  assert.deepEqual(project.platform, ['小红书', '抖音']);
});
