import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projects, importProject } from '../src/model.js';
import { prepareMatching, recommendCreators, mergeRecommendations, toggleSelection } from '../src/creatorModel.js';
import { buildSimulation, createSimulationState, advanceSimulation, moduleStatus, caseStatus, simulationModules, simulationKey } from '../src/simulationModel.js';

function fixture() {
  const campaign = importProject(projects[1]);
  const matching = prepareMatching(campaign);
  const sharedId = recommendCreators(campaign, campaign.briefs[0])[0].id;
  for (const b of campaign.briefs) {
    matching[b.id] = mergeRecommendations(matching[b.id], recommendCreators(campaign, b));
    matching[b.id] = toggleSelection(matching[b.id], sharedId);
  }
  const first = campaign.briefs[0];
  const secondId = matching[first.id].candidateCreators.find(c => c.id !== sharedId).id;
  matching[first.id] = toggleSelection(matching[first.id], secondId);
  return { campaign, matching };
}

test('simulation creates only selected pairs and consistent interval funnels', () => {
  const { campaign, matching } = fixture();
  const model = buildSimulation(campaign, matching);
  assert.equal(model.cases.length, 4);
  assert.equal(new Set(model.cases.map(c => c.id)).size, 4);
  assert.equal(model.audience.creators.length, 2);
  for (const c of model.cases) {
    assert.ok(matching[c.briefId].selectedCreatorIds.includes(c.creator.id));
    for (const range of [c.reach, c.views, c.engagements, c.deep]) assert.ok(range.low < range.mid && range.mid < range.high);
    assert.ok(c.reach.mid > c.views.mid && c.views.mid > c.engagements.mid && c.engagements.mid > c.deep.mid);
    assert.equal(c.deepParts.reduce((n, [, value]) => n + value, 0), c.deep.mid);
    assert.ok(Math.abs((c.reach.mid / c.baseline.reach - 1) * 100 - c.baseline.reachLift) < .1);
  }
  assert.equal(model.bestByBrief.length, campaign.briefs.length);
  assert.equal(model.topReach.reach.mid, Math.max(...model.cases.map(c => c.reach.mid)));
  assert.deepEqual(buildSimulation(campaign, matching), model);
});

test('modules appear sequentially and comparison waits for every case', () => {
  const { campaign, matching } = fixture();
  const { cases } = buildSimulation(campaign, matching);
  let state = createSimulationState(cases);
  assert.equal(moduleStatus(state, 'context'), 'generating');
  assert.equal(moduleStatus(state, 'performance'), 'not-started');
  state = advanceSimulation(state);
  assert.equal(moduleStatus(state, 'context'), 'completed');
  assert.equal(caseStatus(state, cases[0].id), 'generating');
  for (let i = 0; i < cases.length; i++) {
    assert.equal(moduleStatus(state, 'comparison'), 'not-started');
    assert.equal(caseStatus(state, cases[i].id), 'generating');
    state = advanceSimulation(state);
    assert.equal(caseStatus(state, cases[i].id), 'completed');
  }
  assert.equal(moduleStatus(state, 'comparison'), 'generating');
  assert.equal(moduleStatus(state, 'performance'), 'completed');
  while (state.cursor < state.tasks.length) state = advanceSimulation(state);
  assert.ok(simulationModules.every(m => moduleStatus(state, m.id) === 'completed'));
  assert.equal(advanceSimulation(state), state);
});

test('single creator across several briefs has no fake overlap; signature ignores save markers but tracks selected pairs', () => {
  const { campaign, matching } = fixture();
  const key = simulationKey(campaign, matching);
  matching[campaign.briefs[0].id].completed = true;
  assert.equal(simulationKey(campaign, matching), key);
  matching[campaign.briefs[0].id].selectedCreatorIds.pop();
  assert.notEqual(simulationKey(campaign, matching), key);
  const model = buildSimulation(campaign, matching);
  assert.equal(model.audience.creators.length, 1);
  assert.equal(model.audience.highestOverlap, null);
  assert.equal(model.audience.pairs.length, 0);
});
