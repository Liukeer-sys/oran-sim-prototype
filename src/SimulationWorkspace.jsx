import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Button, Icon, Select } from './components.jsx';
import { advanceSimulation, buildSimulation, caseStatus, compact, createSimulationState, moduleStatus, rangeText, signed, simulationModules } from './simulationModel.js';
import './simulationWorkspace.css';

function SimulationProgress({ campaign, model, progress, currentCase, runningCaseId, onCase, onBrief, onModule, activeModule }) {
  const navRef = useRef(null);
  useEffect(() => {
    const nav = navRef.current;
    const row = [...nav.querySelectorAll('[data-case-id]')].find(node => node.dataset.caseId === currentCase.id);
    const target = nav.querySelector('.simulation-module-nav .viewing') || row;
    if (!target) return;
    const bounds = nav.getBoundingClientRect(), targetBounds = target.getBoundingClientRect();
    if (targetBounds.top < bounds.top || targetBounds.bottom > bounds.bottom) nav.scrollTo?.({ top: Math.max(0, nav.scrollTop + targetBounds.top - bounds.top - 30), behavior: 'smooth' });
  }, [currentCase.id, activeModule]);
  const visible = simulationModules.filter(m => moduleStatus(progress, m.id) !== 'not-started');
  const finished = simulationModules.filter(m => moduleStatus(progress, m.id) === 'completed').length;
  const moduleLinks = (modules, label) => <nav className="simulation-module-nav" aria-label={label}>{modules.map(m => { const status = moduleStatus(progress, m.id); return <button key={m.id} data-module={m.id} className={`${status} ${activeModule === m.id ? 'viewing' : ''}`} onClick={() => onModule(m.id)} aria-label={`${m.title} · ${status === 'generating' ? 'Generating' : 'Completed'}`}>{status === 'completed' ? <Icon name="check" size={12}/> : <span className="sim-live-dot"/>}<span>{m.title}</span></button>; })}</nav>;
  return <aside ref={navRef} className="brief-navigator simulation-nav" aria-label="Simulation Progress"><div className="brief-nav-heading"><span className="matching-eyebrow">CONTENT BRIEFS</span><h2>Simulation Progress <span>{finished} / 7</span></h2><div className="brief-progress" role="progressbar" aria-label="模拟模块进度" aria-valuemin={0} aria-valuemax={7} aria-valuenow={finished}><span style={{ width: `${finished / 7 * 100}%` }}/></div></div>
    <div className="sim-campaign-context-nav"><span className="matching-eyebrow">CAMPAIGN 环境</span>{moduleLinks(visible.filter(m => m.id === 'context'), 'Campaign 环境')}</div>
    <p className="sim-nav-section-label">单个 Case · 自然表现预测</p>
    <div className="brief-nav-list">{campaign.briefs.map((brief, index) => <article key={brief.id} className={`brief-nav-item ${currentCase.briefId === brief.id ? 'active' : ''}`}>
      <button className="brief-nav-select" onClick={() => onBrief(brief.id)} aria-label={`查看 Brief ${index + 1} 的模拟`}><span className="brief-nav-number">Brief {String(index + 1).padStart(2, '0')}</span><strong>{brief.title}</strong><span className="brief-nav-summary">{brief.description}</span></button>
      <div className="simulation-case-list">{model.cases.filter(c => c.briefId === brief.id).map(c => <div key={c.id} data-case-id={c.id} className={`simulation-case-row ${currentCase.id === c.id ? 'focused' : ''}`}>
        <button className="simulation-case-select" aria-pressed={currentCase.id === c.id} onClick={() => onCase(c.id)}><span>×</span><img src={c.creator.avatar} alt="" width="23" height="23"/><span>{c.creator.username}<small>{c.creator.platform}</small></span>{runningCaseId === c.id ? <span className="sim-live-dot" aria-label="正在模拟"/> : caseStatus(progress, c.id) === 'completed' && <Icon name="check" size={12}/>}</button>
        {currentCase.id === c.id && moduleLinks(visible.filter(m => m.id === 'performance'), 'Case 自然表现')}
      </div>)}</div>
    </article>)}</div>
    {visible.some(m => !['context', 'performance'].includes(m.id)) && <div className="sim-campaign-analysis-nav"><span className="matching-eyebrow">CAMPAIGN 整体分析</span><p>全部 {campaign.briefs.length} 个 Brief × {model.audience.creators.length} 位 Creator</p>{moduleLinks(visible.filter(m => !['context', 'performance'].includes(m.id)), 'Campaign 整体分析')}</div>}
    <p className="brief-nav-note">自然表现逐个 Case 预测。<br/>比较、受众、诊断、总结与报告仅汇总一次。</p>
  </aside>;
}

function ModuleCard({ module, status, children, loadingText }) {
  const index = simulationModules.findIndex(m => m.id === module.id);
  return <section id={`simulation-${module.id}`} className="simulation-module" data-module={module.id} aria-labelledby={`sim-heading-${module.id}`} tabIndex={-1}>
    <div className="sim-module-heading"><span className="sim-module-number">{String(index + 1).padStart(2, '0')}</span><h2 id={`sim-heading-${module.id}`}>{module.title}</h2><span className={`sim-module-status ${status}`}>{status === 'completed' ? <><Icon name="check" size={12}/>Completed</> : <><span className="sim-live-dot"/>Generating</>}</span></div>
    {children || <div className="sim-skeleton" role="status"><p>{loadingText || `正在生成 ${module.title}…`}</p><span/><span/><span/></div>}
  </section>;
}

function SimulationContext({ campaign, context }) {
  return <><div className="sim-context-tags">{campaign.platform.map(p => <span key={p}>{p} · {campaign.market}</span>)}<span>{campaign.product}</span><span>{context.verticals.slice(0, 3).join(' / ')}</span></div>
    <div className="sim-context-grid"><div><small>品类内容热度</small><strong>{context.heat}</strong><svg viewBox="0 0 220 48" role="img" aria-label="品类热度模拟趋势：近十二周总体上升"><polyline points={context.trend.map((v, i) => `${i * 20},${48 - v * .55}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2"/></svg><span className="sim-caption">近 12 周 · 示例趋势</span></div><div><small>自然互动基线</small><strong>{context.baseline}</strong><span className="sim-caption">同类内容互动 / 有效观看</span></div><div><small>内容竞争程度</small><strong>{context.competition}</strong><span className="sim-caption">真实场景与明确内容主题更易区分</span></div></div><p className="sim-footnote">平台趋势示例：生活场景、体验对比与实用分享。以上为本次模拟假设，非实时市场数据。</p></>;
}

function NaturalPerformance({ currentCase: c, cases, model, progress, onCase, filteredBrief, onClearFilter }) {
  const touch = useRef(null);
  const available = cases.filter(item => caseStatus(progress, item.id) !== 'not-started');
  const localIndex = available.findIndex(item => item.id === c.id);
  const move = direction => { if (available.length > 1) onCase(available[(Math.max(0, localIndex) + direction + available.length) % available.length].id); };
  const complete = caseStatus(progress, c.id) === 'completed';
  const completedCount = model.cases.filter(item => caseStatus(progress, item.id) === 'completed').length;
  return <div className="natural-performance" tabIndex={0} aria-label="自然表现 Case，可使用左右方向键切换" onKeyDown={e => { if (e.target === e.currentTarget && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); } }} onTouchStart={e => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }} onTouchEnd={e => { if (!touch.current) return; const dx = e.changedTouches[0].clientX - touch.current.x; const dy = e.changedTouches[0].clientY - touch.current.y; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1); touch.current = null; }}>
    <div className="sim-case-top"><span>Case {String(model.cases.findIndex(item => item.id === c.id) + 1).padStart(2, '0')} / {model.cases.length}</span><span>{completedCount} / {model.cases.length} 已生成</span>{filteredBrief && <Button variant="text-button" onClick={onClearFilter}>显示全部 Brief</Button>}</div>
    <div className="sim-case-identity"><div><small>Brief {String(c.briefIndex + 1).padStart(2, '0')} × {c.creator.username}</small><h3>{c.briefTitle}</h3></div><img src={c.creator.avatar} alt={c.creator.username} width="38" height="38"/></div><div className="sim-case-platform">{c.creator.platform} · {compact(c.creator.followers)} followers</div>
    {!complete ? <div className="sim-skeleton" role="status"><p>{caseStatus(progress, c.id) === 'generating' ? '正在生成当前组合的自然表现预测…' : '该组合尚未开始，完成后可查看区间预测。'}</p><span/><span/><span/></div> : <>
      <h4 className="sim-subtitle">Natural Performance Funnel</h4><div className="sim-funnel">{[['Estimated Reach', '预计触达', c.reach], ['Effective Views', '有效观看', c.views], ['Engagement', '互动', c.engagements], ['Deep Engagement', '深度互动', c.deep]].map(([name, label, value], i) => <div className="sim-funnel-row" key={name}><div className="sim-funnel-bar" style={{ width: `${100 - i * 14}%` }}/><span className="sim-funnel-label">{label}<small>{name}</small></span><div><strong>{rangeText(value)}</strong><small>中位示意 {compact(value.mid)}</small></div></div>)}</div>
      <div className="sim-deep-breakdown">{c.deepParts.map(([name, value]) => <span key={name}>{name} <b>{compact(value)}</b></span>)}</div><p className="sim-footnote">拆分值为区间中位示意，非精确预测。互动包含点赞与深度互动；所有数值均为 mock。</p>
      <div className="sim-baseline"><h4>vs Creator Baseline</h4><div><span>Reach <b>{signed(c.baseline.reachLift)}</b></span><span>Engagement Rate <b>{signed(c.baseline.engagementDelta, 'pp')}</b></span><span>Share Rate <b>{signed(c.baseline.shareLift)}</b></span></div><p>基于该达人近期同类内容的模拟基线。仅分析自然传播，不包含付费投流或销售 ROI。</p></div>
    </>}
    <div className="sim-case-pagination"><Button variant="icon-button" aria-label="上一个 Case" disabled={available.length < 2} onClick={() => move(-1)}><Icon name="back" size={16}/></Button><span>{Math.max(0, cases.findIndex(item => item.id === c.id)) + 1} / {cases.length}{filteredBrief ? ' · 当前 Brief' : ''}</span><Button variant="icon-button" aria-label="下一个 Case" disabled={available.length < 2} onClick={() => move(1)}><Icon name="arrow" size={16}/></Button></div><div className="sim-case-indicators">{cases.map((item, i) => <button key={item.id} aria-label={`查看 Case ${model.cases.findIndex(v => v.id === item.id) + 1}`} aria-pressed={c.id === item.id} disabled={caseStatus(progress, item.id) === 'not-started'} onClick={() => onCase(item.id)} title={`${item.briefTitle} × ${item.creator.username}`}>{i + 1}</button>)}</div>
  </div>;
}

function CombinationComparison({ campaign, model, onCase }) {
  const [metric, setMetric] = useState('baseline');
  const creators = model.audience.creators;
  const value = c => metric === 'reach' ? rangeText(c.reach) : metric === 'engagement' ? `${c.engagementRateRange.low}% – ${c.engagementRateRange.high}%` : metric === 'deep' ? rangeText(c.deep) : signed(c.baseline.reachLift);
  return <><div className="sim-comparison-toolbar"><p>点击组合，查看对应的自然表现。</p><label><span className="sim-caption">比较指标</span><Select aria-label="比较指标" value={metric} onChange={e => setMetric(e.target.value)}><option value="baseline">vs Baseline · Reach</option><option value="reach">Estimated Reach</option><option value="engagement">Engagement Rate</option><option value="deep">Deep Engagement</option></Select></label></div><div className="sim-table-scroll"><table className="sim-comparison-table"><thead><tr><th>Content Brief</th>{creators.map(c => <th key={c.id}>{c.username}<small>{c.platform}</small></th>)}</tr></thead><tbody>{campaign.briefs.map((brief, i) => <tr key={brief.id}><th>Brief {String(i + 1).padStart(2, '0')}<small>{brief.title}</small></th>{creators.map(creator => { const c = model.cases.find(item => item.briefId === brief.id && item.creator.id === creator.id); return <td key={creator.id}>{c ? <button className={c.baseline.reachLift >= 0 ? 'positive' : 'negative'} onClick={() => onCase(c.id)}>{value(c)}</button> : <span title="此组合未选择，不生成预测">—</span>}</td>; })}</tr>)}</tbody></table></div><p className="sim-footnote">只比较已选择的 Brief × Creator 组合；— 表示未选择。互动率以有效观看为分母。</p></>;
}

function AudienceCoverage({ audience }) {
  const [selectedId, setSelectedId] = useState(audience.incrementalLeader.id);
  const selected = audience.creators.find(c => c.id === selectedId) || audience.creators[0];
  // A focused neighborhood stays legible even when the campaign contains many creators.
  const nearby = audience.pairs.filter(p => p.a === selected.id || p.b === selected.id).sort((a, b) => b.overlap - a.overlap).slice(0, 6);
  const related = nearby.map((pair, index) => {
    const c = audience.creators.find(item => item.id === (pair.a === selected.id ? pair.b : pair.a));
    const angle = (index / Math.max(nearby.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const distance = 95 + (100 - pair.overlap) * .7;
    return { creator: c, pair, x: 300 + Math.cos(angle) * distance, y: 200 + Math.sin(angle) * distance };
  });
  const maxReach = Math.max(...audience.creators.map(c => c.reach.mid));
  const radius = c => 12 + 17 * Math.sqrt(c.reach.mid / maxReach);
  const overlap = audience.highestOverlap;
  const name = id => audience.creators.find(c => c.id === id)?.username;
  return <><div className="sim-comparison-toolbar"><p>Creator 受众相似度与增量覆盖</p><Select aria-label="查看 Creator 受众" value={selected.id} onChange={e => setSelectedId(e.target.value)}>{audience.creators.map(c => <option value={c.id} key={c.id}>{c.username} · {c.platform}</option>)}</Select></div>
    <div className="sim-audience-map"><svg viewBox="0 0 600 410" role="img" aria-label={`${selected.username} 的受众覆盖示意图，越近表示受众相似度越高，不是真实社交传播网络`}>
      {[95, 165].map(r => <circle key={r} cx="300" cy="200" r={r} fill="none" stroke="#efefef" strokeDasharray="3 6"/>)}
      {related.map(({ creator, pair, x, y }) => <g key={creator.id}><line x1="300" y1="200" x2={x} y2={y} stroke="#e4c5ae" strokeWidth={1 + pair.overlap / 50}/><text x={(300 + x) / 2} y={(200 + y) / 2 - 5} className="network-overlap">{pair.overlap}%</text><circle cx={x} cy={y} r={radius(creator)} fill="#f4e6dc" stroke="#d9b99f"/><text x={x} y={y + 4} textAnchor="middle" className="network-name">{creator.displayName.slice(0, 10)}</text><text x={x} y={y + radius(creator) + 15} textAnchor="middle" className="network-label">{compact(creator.reach.mid)} · {creator.platform}</text></g>)}
      {selected.segments.slice(0, 4).map((segment, index, arr) => { const x = 75 + index * (450 / Math.max(1, arr.length - 1)); return <g key={segment}><line x1="300" y1="200" x2={x} y2="385" stroke="#ddd" strokeDasharray="3 5"/><rect x={x - 65} y="369" width="130" height="26" rx="13" fill="#f8f8f8" stroke="#eaeaea"/><text x={x} y="386" textAnchor="middle" className="network-label">{segment}</text></g>; })}
      <circle cx="300" cy="200" r={radius(selected) + 7} fill="#fff3e9" stroke="#ef8a47"/><text x="300" y="198" textAnchor="middle" className="network-name">{selected.displayName.slice(0, 12)}</text><text x="300" y="212" textAnchor="middle" className="network-label">{compact(selected.reach.mid)}</text>
    </svg></div>
    <p className="sim-footnote">节点大小 = 预计触达；距离 = 与当前 Creator 的受众相似度；连线 = 受众重叠；外围 = 受众领域。展示当前账号与最多 6 位相似账号，不代表真实用户关系。指标均为模拟假设。</p>
    <div className="sim-audience-insights"><div><small>Audience overlap</small><strong>{overlap ? `${overlap.overlap}%` : '单一 Creator'}</strong><p>{overlap ? `${name(overlap.a)} 与 ${name(overlap.b)} 的模拟受众重叠最高。` : '当前只有一位独立 Creator，暂无跨账号重叠比较。'}</p></div><div><small>最高增量覆盖</small><strong>{rangeText(audience.incrementalLeader.incremental)}</strong><p>{audience.incrementalLeader.username} 提供最高模拟增量覆盖；按账号去重，未将多个 Brief 触达简单相加。</p></div></div>
  </>;
}

function ExpertDiagnosis({ model }) {
  const diagnosis = model.campaignDiagnosis;
  return <><p className="sim-caption">Campaign 整体诊断 · 覆盖全部 {model.bestByBrief.length} 个 Brief、{model.audience.creators.length} 位 Creator、{model.cases.length} 个组合</p><div className="sim-diagnosis-grid">{diagnosis.judgments.map(item => <div key={item.title}><small>{item.title}</small><strong>{item.level}</strong><p>{item.description}</p></div>)}</div><div className="sim-consensus"><small>Expert Consensus</small><p>{diagnosis.consensus}</p></div><details className="sim-agent-details"><summary>查看 Agent 分析过程</summary>{diagnosis.agents.map(([name, text]) => <p key={name}><b>{name}</b>{text}</p>)}</details></>;
}

function SimulationSummary({ model, onCase }) {
  const label = c => `Brief ${c.briefIndex + 1} × ${c.creator.username} (${c.creator.platform})`;
  const overlap = model.audience.highestOverlap;
  const byId = id => model.audience.creators.find(c => c.id === id).username;
  return <div className="sim-summary"><div><h3>Top Opportunities</h3><p><button onClick={() => onCase(model.topReach.id)}>{label(model.topReach)}</button> 预计自然触达最高：{rangeText(model.topReach.reach)}。</p><p><button onClick={() => onCase(model.topLift.id)}>{label(model.topLift)}</button> 的触达相对基线表现最好：{signed(model.topLift.baseline.reachLift)}。</p><p>{model.audience.incrementalLeader.username} 提供最高模拟增量覆盖：{rangeText(model.audience.incrementalLeader.incremental)}。</p></div><div><h3>Key Risks</h3><p><button onClick={() => onCase(model.risk.id)}>{label(model.risk)}</button> 的相对基线表现最弱（{signed(model.risk.baseline.reachLift)}），建议优先复核开场与内容表达。</p><p>{overlap ? `${byId(overlap.a)} 与 ${byId(overlap.b)} 的模拟受众重叠为 ${overlap.overlap}%，不宜直接累加两者触达。` : '当前仅一位独立 Creator，缺少跨账号受众分散度。'}</p></div><div><h3>Recommended Adjustments</h3>{model.bestByBrief.map(c => <p key={c.id}><button onClick={() => onCase(c.id)}>Brief {c.briefIndex + 1}</button> 优先考虑 {c.creator.username} 的 {c.creator.verticals.join(' / ')} 表达方向。</p>)}<p>实际投放前，补充近期内容表现与受众数据，再校准所有区间。以上建议仅用于演示。</p></div></div>;
}

function SimulationReport({ campaign, model }) {
  const [toast, setToast] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <><div className="sim-report-cover"><span><Icon name="file" size={28}/></span><div><h3>Campaign Simulation Report</h3><p>{campaign.product} · {campaign.market} · {campaign.platform.join(' / ')}</p><small>{campaign.briefs.length} Briefs · {model.audience.creators.length} Creators · {model.cases.length} Cases</small></div><span className="sim-report-ready">Ready</span></div>
    <details className="sim-report-details"><summary>查看报告内容摘要</summary><dl><dt>Campaign information</dt><dd>{campaign.product} · {campaign.market} · {campaign.platform.join(' / ')}<p>{campaign.background}</p></dd><dt>Simulation Context</dt><dd>{model.context.verticals.join(' / ')} · 自然互动基线 {model.context.baseline} · 热度 {model.context.heat}</dd><dt>Content Briefs & Creator selection</dt><dd>{campaign.briefs.map((b, i) => <div key={b.id}><b>Brief {i + 1} · {b.title}</b><p>{b.description}</p><p>{model.cases.filter(c => c.briefId === b.id).map(c => `${c.creator.username} (${c.creator.platform})`).join('、')}</p></div>)}</dd><dt>Case Performance & Comparison</dt><dd>{model.cases.map(c => <p key={c.id}>Brief {c.briefIndex + 1} × {c.creator.username} · {c.creator.platform}：触达 {rangeText(c.reach)} / 有效观看 {rangeText(c.views)} / 互动 {rangeText(c.engagements)} / 深度互动 {rangeText(c.deep)}；Reach vs Baseline {signed(c.baseline.reachLift)}。</p>)}</dd><dt>Audience Coverage</dt><dd>最高增量：{model.audience.incrementalLeader.username} · {rangeText(model.audience.incrementalLeader.incremental)}。最高受众重叠：{model.audience.highestOverlap ? `${model.audience.highestOverlap.overlap}%` : '单账号，暂无比较'}。</dd><dt>Expert Diagnosis</dt><dd>{model.campaignDiagnosis.judgments.map(item => <p key={item.title}>{item.title}: {item.level}. {item.description}</p>)}<p>{model.campaignDiagnosis.consensus}</p></dd><dt>Simulation Summary</dt><dd>最高触达组合：Brief {model.topReach.briefIndex + 1} × {model.topReach.creator.username}。优先复核组合：Brief {model.risk.briefIndex + 1} × {model.risk.creator.username}。建议用场景表达产品收益，并核验重叠受众。</dd></dl></details>
    <div className="sim-report-actions"><span>原型演示 · 暂不导出真实 PDF</span><Button variant="primary" onClick={() => { setToast(true); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(false), 3500); }}>下载 Simulation Report<Icon name="arrow" size={15}/></Button></div>{toast && <p role="status" className="sim-report-toast"><Icon name="check" size={15}/>Simulation Report 已生成 · 模拟下载，未创建 PDF 文件</p>}</>;
}

export default function SimulationWorkspace({ campaign, matching, enabled }) {
  const [model] = useState(() => buildSimulation(campaign, matching));
  const [progress, dispatch] = useReducer(advanceSimulation, model.cases, createSimulationState);
  const [focusId, setFocusId] = useState(model.cases[0]?.id);
  const [filter, setFilter] = useState(null);
  const [follow, setFollow] = useState(true);
  const [activeModule, setActiveModule] = useState('context');
  const task = progress.tasks[progress.cursor];
  const done = !task;
  const currentCase = model.cases.find(c => c.id === (follow && task?.caseId ? task.caseId : focusId)) || model.cases[0];
  const filteredCases = useMemo(() => filter ? model.cases.filter(c => c.briefId === filter) : model.cases, [filter, model]);
  function scrollModule(id) {
    setActiveModule(id);
    const node = document.getElementById(`simulation-${id}`);
    node?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    node?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (!enabled || done) return;
    const timer = setTimeout(() => dispatch(), 1100);
    return () => clearTimeout(timer);
  }, [enabled, done, progress.cursor]);
  useEffect(() => {
    if (!enabled || !follow || !task) return;
    if (task.caseId) setFocusId(task.caseId);
    setActiveModule(task.module);
    document.getElementById(`simulation-${task.module}`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [enabled, follow, progress.cursor]);
  function chooseCase(id, jump = false) { setFocusId(id); setFollow(false); if (jump) { setFilter(null); scrollModule('performance'); } }
  function chooseBrief(id) { setFilter(id); setFollow(false); setFocusId(model.cases.find(c => c.briefId === id).id); if (moduleStatus(progress, 'performance') !== 'not-started') scrollModule('performance'); }
  if (!currentCase) return <p>暂无可模拟的 Brief × Creator 组合，请返回匹配页面。</p>;
  return <section className="matching-page simulation-workspace" aria-label="Simulation Workspace"><div className="matching-topbar"><Button variant="text-button" onClick={() => { window.location.hash = 'matching'; }}><Icon name="back" size={15}/>返回达人匹配</Button><span>ORAN SIM <i>/</i> Simulation</span><span className="matching-stage">03 <span>/ 03</span></span></div>
    <div className="matching-layout"><SimulationProgress campaign={campaign} model={model} progress={progress} currentCase={currentCase} runningCaseId={task?.caseId} activeModule={activeModule} onCase={id => { setFilter(null); chooseCase(id); if (moduleStatus(progress, 'performance') !== 'not-started') scrollModule('performance'); }} onBrief={chooseBrief} onModule={id => { setFollow(false); scrollModule(id); }}/>
      <div className="creator-workbench simulation-workbench"><div className="sim-run-status" role="status"><span>{done ? <Icon name="check" size={15}/> : <span className="sim-live-dot"/>}{done ? 'Simulation completed' : `${simulationModules.find(m => m.id === task.module).title} · 生成中`}</span>{!done && <Button variant="text-button" onClick={() => { setFollow(!follow); if (!follow) setFilter(null); }}>{follow ? '暂停自动跟随' : '跟随生成进度'}</Button>}</div><p className="sim-data-note">所有区间、基线、受众与专家判断均为 mock 演示，不代表真实预测。</p>
        {simulationModules.filter(m => moduleStatus(progress, m.id) !== 'not-started').map(module => {
          const status = moduleStatus(progress, module.id);
          let content = null;
          if (module.id === 'performance') content = <NaturalPerformance currentCase={currentCase} cases={filteredCases} model={model} progress={progress} onCase={chooseCase} filteredBrief={filter} onClearFilter={() => setFilter(null)}/>;
          else if (status === 'completed') {
            if (module.id === 'context') content = <SimulationContext campaign={campaign} context={model.context}/>;
            if (module.id === 'comparison') content = <CombinationComparison campaign={campaign} model={model} onCase={id => chooseCase(id, true)}/>;
            if (module.id === 'audience') content = <AudienceCoverage audience={model.audience}/>;
            if (module.id === 'diagnosis') content = <ExpertDiagnosis model={model}/>;
            if (module.id === 'summary') content = <SimulationSummary model={model} onCase={id => chooseCase(id, true)}/>;
            if (module.id === 'report') content = <SimulationReport campaign={campaign} model={model}/>;
          }
          return <ModuleCard key={module.id} module={module} status={status}>{content}</ModuleCard>;
        })}
      </div></div>
  </section>;
}
