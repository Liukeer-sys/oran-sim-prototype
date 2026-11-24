import { creatorAnalytics } from './creatorAnalytics.js';

// Prototype configuration, not a claim about a platform's reporting standard.
export const viewingQualityConfig = { TikTok: { seconds: 6 } };
export function individualPerformance(c, campaign, brief) {
  const history = creatorAnalytics(c.creator, campaign, brief);
  const baselineViews = history.views.median;
  // Independent total-play mock derived from the existing comparable-video sample.
  // Legacy c.views remains effective views for existing campaign analyses.
  const views = range(baselineViews * (1 + c.baseline.reachLift / 100));
  const counts = Object.fromEntries(c.deepParts);
  const interactions = { Likes: c.engagements.mid - c.deep.mid, Comments: counts.Comments, Shares: counts.Shares, Saves: counts.Saves };
  const total = Object.values(interactions).reduce((sum, value) => sum + value, 0);
  return { views, interactions, engagementRate: +(total / views.mid * 100).toFixed(2), seconds: viewingQualityConfig[c.creator.platform]?.seconds ?? null,
    viewRate: null, baseline: { views: baselineViews, viewsLift: +((views.mid / baselineViews - 1) * 100).toFixed(1), viewRateDelta: null, engagementDelta: null } };
}

export const simulationModules = [
  { id: 'context', title: 'Simulation Context' },
  { id: 'performance', title: 'Natural Performance' },
  { id: 'comparison', title: 'Content × Creator Comparison' },
  { id: 'audience', title: 'Audience Coverage' },
  { id: 'diagnosis', title: 'Expert Diagnosis' },
  { id: 'summary', title: 'Simulation Summary' },
  { id: 'report', title: 'Report' },
];
const hash = text => [...text].reduce((n, char) => (n * 31 + char.charCodeAt(0)) >>> 0, 7);
const range = (value, spread = .12) => ({ low: Math.round(value * (1 - spread)), high: Math.round(value * (1 + spread)), mid: Math.round(value) });
export const compact = n => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
export const rangeText = value => `${compact(value.low)} – ${compact(value.high)}`;
export const signed = (value, suffix = '%') => `${value >= 0 ? '+' : ''}${value}${suffix}`;
export function simulationKey(campaign, matching) {
  return JSON.stringify([campaign, campaign.briefs.map(b => matching[b.id]?.selectedCreatorIds.map(id => matching[b.id].candidateCreators.find(c => c.id === id)))]);
}
export function buildCases(campaign, matching) {
  return campaign.briefs.flatMap((brief, briefIndex) => (matching[brief.id]?.selectedCreatorIds || []).flatMap(creatorId => {
    const creator = matching[brief.id].candidateCreators.find(c => c.id === creatorId);
    if (!creator || !campaign.platform.includes(creator.platform)) return [];
    const seed = hash(`${brief.id}:${brief.title}:${creator.id}:${campaign.market}`);
    const lift = (seed % 40) - 8;
    const reachMid = Math.round(creator.followers * (.18 + seed % 15 / 100));
    const viewsMid = Math.round(reachMid * (.52 + seed % 17 / 100));
    const engagementRate = +(creator.engagementRate * (.85 + seed % 31 / 100)).toFixed(1);
    const engagements = Math.round(viewsMid * engagementRate / 100);
    const deep = Math.round(engagements * (.32 + seed % 13 / 100));
    const deepParts = [Math.floor(deep * .27), Math.floor(deep * .23), Math.floor(deep * .31)];
    return [{ id: `${brief.id}::${creator.id}`, briefId: brief.id, briefIndex, briefTitle: brief.title, briefDescription: brief.description, creator,
      reach: range(reachMid), views: range(viewsMid), engagements: range(engagements), deep: range(deep), engagementRate,
      engagementRateRange: { low: +(engagementRate * .88).toFixed(1), high: +(engagementRate * 1.12).toFixed(1) },
      deepParts: [ ['Comments', deepParts[0]], ['Shares', deepParts[1]], ['Saves', deepParts[2]], ['Profile visits', deep - deepParts.reduce((n, v) => n + v, 0)] ],
      baseline: { reachLift: lift, engagementDelta: +(engagementRate - creator.engagementRate).toFixed(1), shareLift: seed % 39 - 6, reach: Math.round(reachMid / (1 + lift / 100)) },
      diagnosis: { contentFit: creator.briefMatch >= 90 ? 'Strong' : 'Medium–High', audienceFit: seed % 3 ? 'Medium–High' : 'Medium', risk: lift < 0 ? 'Medium–High' : 'Medium' },
    }];
  }));
}
export function buildAudience(cases) {
  const groups = new Map();
  cases.forEach(c => {
    const previous = groups.get(c.creator.id);
    // Repeated creators are counted once; campaign totals are not sums of case reach.
    if (!previous || c.reach.mid > previous.reach.mid) groups.set(c.creator.id, c);
  });
  const segmentNames = { Outdoor: 'Outdoor Enthusiasts', Camping: 'Weekend Campers', Tech: 'Tech Enthusiasts', Lifestyle: 'Lifestyle Seekers', Home: 'Young Households', Parenting: 'Young Parents', Wellness: 'Wellness Enthusiasts' };
  const creators = [...groups.values()].map(c => ({ ...c.creator, reach: c.reach, segments: c.creator.verticals.map(v => segmentNames[v] || v) }));
  const pairs = [];
  for (let i = 0; i < creators.length; i++) for (let j = i + 1; j < creators.length; j++) {
    const a = creators[i], b = creators[j];
    const common = a.segments.filter(s => b.segments.includes(s)).length;
    const union = new Set([...a.segments, ...b.segments]).size;
    pairs.push({ a: a.id, b: b.id, overlap: Math.round(12 + 65 * common / union) });
  }
  creators.forEach(c => {
    const maxOverlap = Math.max(0, ...pairs.filter(p => p.a === c.id || p.b === c.id).map(p => p.overlap));
    c.incremental = range(Math.round(c.reach.mid * (1 - maxOverlap / 100)), .15);
  });
  return { creators, pairs, highestOverlap: [...pairs].sort((a, b) => b.overlap - a.overlap)[0] || null, incrementalLeader: [...creators].sort((a, b) => b.incremental.mid - a.incremental.mid)[0] };
}
export function buildSimulation(campaign, matching) {
  const cases = buildCases(campaign, matching);
  const audience = buildAudience(cases);
  const topReach = [...cases].sort((a, b) => b.reach.mid - a.reach.mid)[0];
  const topLift = [...cases].sort((a, b) => b.baseline.reachLift - a.baseline.reachLift)[0];
  const risk = [...cases].sort((a, b) => a.baseline.reachLift - b.baseline.reachLift)[0];
  const bestByBrief = campaign.briefs.map(brief => [...cases].filter(c => c.briefId === brief.id).sort((a, b) => b.baseline.reachLift - a.baseline.reachLift)[0]).filter(Boolean);
  const verticals = [...new Set(audience.creators.flatMap(c => c.verticals))];
  const strong = cases.filter(c => c.diagnosis.contentFit === 'Strong').length;
  const belowBaseline = cases.filter(c => c.baseline.reachLift < 0).length;
  const overlap = audience.highestOverlap;
  const campaignDiagnosis = {
    judgments: [
      { title: 'Content Fit', level: strong >= cases.length / 2 ? 'Strong' : 'Medium–High', description: `全部 ${cases.length} 个组合中，${strong} 个内容匹配度为 Strong。建议不同 Brief 分配不同叙事重点，避免多个 Creator 重复表达同一卖点。` },
      { title: 'Audience Fit', level: overlap?.overlap >= 60 ? 'Overlap to review' : 'Medium–High', description: overlap ? `组合覆盖 ${verticals.join(' / ')} 等领域，最高账号受众重叠 ${overlap.overlap}%。应将单体表现与增量受众共同考虑，不能简单累加触达。` : '当前为单一 Creator 的内容组合，尚不能形成跨账号增量覆盖；多个 Brief 的触达不能简单累加。' },
      { title: 'Distribution Risk', level: belowBaseline > 0 ? 'Medium–High' : 'Medium', description: `${belowBaseline} / ${cases.length} 个组合的触达低于模拟基线。整体应协调开场表达、品牌露出和发布时间，避免内容同质化。` },
    ],
    consensus: `本次 Campaign 应按 Brief 区分内容任务，并兼顾 Creator 表达优势与受众去重。${belowBaseline ? '优先调整低于基线的组合，' : ''}在统一品牌信息的同时保留差异化场景，而不是将所有达人作为独立投放简单叠加。`,
    agents: [ ['Content Agent', `综合 ${campaign.briefs.length} 个 Brief，建议各自聚焦一个不同的用户需求与场景。`], ['Creator Agent', `联合评估 ${audience.creators.length} 位 Creator 的 ${cases.length} 个内容组合，按擅长领域分配表达任务。`], ['Audience Agent', overlap ? `最高模拟重叠为 ${overlap.overlap}%，需优先核验相似受众并保留差异化账号。` : '单账号覆盖有限，建议后续增加互补受众来源。'], ['Brand Agent', '跨 Brief 保持品牌信息一致，避免所有内容重复同一种卖点表达。'] ],
  };
  return { cases, audience, topReach, topLift, risk, bestByBrief, campaignDiagnosis, context: { verticals, heat: '中高', competition: '中高', baseline: '3.2% – 5.4%', trend: [26, 34, 29, 41, 38, 48, 54, 50, 61, 65, 60, 71] } };
}
export function buildTasks(cases) {
  return [{ module: 'context' }, ...cases.map(c => ({ module: 'performance', caseId: c.id })), ...simulationModules.slice(2).map(m => ({ module: m.id }))];
}
export function createSimulationState(cases) {
  return { cursor: 0, tasks: buildTasks(cases) };
}
export function advanceSimulation(state) {
  return state.cursor < state.tasks.length ? { ...state, cursor: state.cursor + 1 } : state;
}
export function moduleStatus(state, id) {
  const first = state.tasks.findIndex(t => t.module === id);
  if (first < 0 || state.cursor < first) return 'not-started';
  const last = state.tasks.findLastIndex(t => t.module === id);
  return state.cursor > last ? 'completed' : 'generating';
}
export function caseStatus(state, caseId) {
  const index = state.tasks.findIndex(t => t.caseId === caseId);
  if (index < 0) return 'not-started';
  return state.cursor > index ? 'completed' : state.cursor === index ? 'generating' : 'not-started';
}
