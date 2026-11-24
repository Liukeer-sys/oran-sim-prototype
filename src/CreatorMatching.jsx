import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Field, Icon, Modal, Select } from './components.jsx';
import { addManualCreator, allBriefsSelected, mergeRecommendations, parseManualCreator, recommendCreators, toggleSelection } from './creatorModel.js';
import './matching.css';
import { creatorAnalytics, verticalNames } from './creatorAnalytics.js';
import { CreatorMetrics } from './CreatorMetrics.jsx';

export function CreatorCard({ creator, campaign, brief, selected = false, onToggle, usedIn = [] }) {
  const analytics = creatorAnalytics(creator, campaign, brief);
  return <article className={`creator-card ${selected ? 'creator-selected' : ''}`} data-creator-id={creator.id}>
    <div className="creator-identity"><img src={creator.avatar} alt={`${creator.displayName} 示例头像`} width="60" height="60"/><div><h3>{creator.username}</h3><span className="creator-locale">{creator.platform} · {analytics.country} · {analytics.language}</span><p className="creator-bio">{analytics.bio}</p><div className="creator-tags creator-classification" aria-label="内容领域、达人类型与层级">{creator.verticals.map(tag => <span key={tag}>{verticalNames[tag] || tag}</span>)}<span>{creator.creatorType}</span><span>{creator.tier}</span></div></div>{selected && <span className="selected-mark"><Icon name="check" size={14}/></span>}</div>
    <div className="performance-heading"><h4>Performance Overview</h4><span>历史表现 · Mock</span></div>
    <CreatorMetrics creator={creator} analytics={analytics}/>
    <div className="creator-reason"><span><Icon name="spark" size={13}/>为什么适合当前 Brief</span><p>{creator.reason}</p></div>
    {usedIn.length > 0 && <p className="creator-reused">已用于 {usedIn.join('、')} · 可重复选择</p>}
    <div className="creator-actions"><a className="button" href={creator.profileUrl} target="_blank" rel="noopener noreferrer">查看主页<Icon name="arrow" size={14}/></a>{onToggle && <Button variant={selected ? 'selected-button' : 'primary'} onClick={onToggle} aria-pressed={selected} aria-label={`${selected ? '取消选择' : '选择'} ${creator.username}`}><Icon name={selected ? 'check' : 'plus'} size={14}/>{selected ? 'Selected · 取消' : '选择'}</Button>}</div>
  </article>;
}

function ManualCreatorModal({ campaign, brief, activePlatform, onClose, onAdd }) {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [creator, setCreator] = useState(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function parse() {
    const result = parseManualCreator({ url, username, activePlatform, campaign, brief });
    setError(result.error || ''); setCreator(null);
    if (result.error) return;
    setBusy(true);
    timer.current = setTimeout(() => { setCreator(result.creator); setBusy(false); }, 850);
  }
  return <Modal title="手动添加达人" subtitle={`加入「${brief.title}」· 输入主页链接或账号即可`} onClose={onClose}>
    <div className="manual-creator-fields"><Field label="Creator profile URL"><input disabled={busy} value={url} placeholder="https://www.tiktok.com/@username" onChange={e => { setUrl(e.target.value); setCreator(null); setError(''); }}/></Field><Field label="Username / account ID"><input disabled={busy} value={username} placeholder="@username 或 account ID" onChange={e => { setUsername(e.target.value); setCreator(null); setError(''); }}/></Field><p className="manual-platform-note">仅填写账号时按当前 {activePlatform} 平台添加；链接将自动识别平台。仅接受当前 Campaign 的平台。</p></div>
    {error && <p role="alert" className="error">{error}</p>}
    {busy && <p className="manual-parsing" role="status"><span className="spinner"/>正在模拟解析达人资料…</p>}
    {creator && <div className="manual-creator-preview"><CreatorCard creator={creator} campaign={campaign} brief={brief}/><p>全部指标为模拟值，未验证账号真实性。</p></div>}
    <div className="modal-footer"><Button onClick={onClose}>取消</Button>{creator ? <Button variant="primary" onClick={() => onAdd(creator)}>加入当前 Brief<Icon name="plus" size={15}/></Button> : <Button variant="primary" disabled={busy || (!url.trim() && !username.trim())} onClick={parse}>解析达人<Icon name="spark" size={15}/></Button>}</div>
  </Modal>;
}

function BriefNavigator({ campaign, matching, activeId, onSelect, onComplete }) {
  const completed = campaign.briefs.filter(b => matching[b.id]?.completed).length;
  return <aside className="brief-navigator" aria-label="Content Brief 列表"><div className="brief-nav-heading"><span className="matching-eyebrow">CONTENT BRIEFS</span><h2>达人匹配 <span>{completed} / {campaign.briefs.length}</span></h2><div className="brief-progress"><span style={{ width: `${completed / campaign.briefs.length * 100}%` }}/></div></div><div className="brief-nav-list">{campaign.briefs.map((brief, index) => {
    const entry = matching[brief.id];
    const ids = entry?.selectedCreatorIds || [];
    const active = activeId === brief.id;
    return <article key={brief.id} className={`brief-nav-item ${active ? 'active' : ''}`} aria-current={active ? 'step' : undefined}>
      <button className="brief-nav-select" onClick={() => onSelect(brief.id)} aria-pressed={active}><span className="brief-nav-number">Brief {String(index + 1).padStart(2, '0')}{entry?.completed && <Icon name="check" size={13}/>}</span><strong>{brief.title}</strong><span className="brief-nav-summary">{brief.description}</span></button>
      <div className="brief-selected-indicator" aria-live="polite"><span className="brief-selection-avatars" role="group" aria-label={`已选择 ${ids.length} 位达人`} title={`已选择 ${ids.length} 位达人`}>{ids.map(id => {
        const creator = entry.candidateCreators.find(c => c.id === id);
        return creator && <img className="brief-creator-avatar" key={id} src={creator.avatar} alt={creator.username} title={`${creator.username} · ${creator.platform}`} width="26" height="26"/>;
      })}</span></div>
      <div className="brief-card-actions"><Button variant="primary" disabled={!ids.length} onClick={() => onComplete(brief.id)}>保存达人选择<Icon name="check" size={13}/></Button></div>
    </article>;
  })}</div><p className="brief-nav-note">每个 Brief 独立选择达人。<br/>同一达人可以参与多个内容方向。</p></aside>;
}

const loadingSteps = ['正在理解内容方向', '正在搜索匹配达人', '正在评估 Creator × Brief 匹配度'];
export default function CreatorMatching({ campaign, matching, setMatching, enabled }) {
  const [activeId, setActiveId] = useState(campaign.briefs[0]?.id);
  const [platform, setPlatform] = useState(campaign.platform[0]);
  const [filters, setFilters] = useState({ creatorType: '', tier: '', vertical: '' });
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [manual, setManual] = useState(false);
  const [loading, setLoading] = useState(null);
  const [notice, setNotice] = useState('');
  const currentId = campaign.briefs.some(b => b.id === activeId) ? activeId : campaign.briefs[0]?.id;
  const brief = campaign.briefs.find(b => b.id === currentId);
  const entry = matching[currentId];
  const currentPlatform = campaign.platform.includes(platform) ? platform : campaign.platform[0];
  const ready = allBriefsSelected(campaign, matching);
  const closeManual = useCallback(() => setManual(false), []);
  const changeEntry = fn => setMatching(prev => ({ ...prev, [currentId]: fn(prev[currentId]) }));

  useEffect(() => {
    if (!enabled || !brief || !entry || entry.recommended) { setLoading(null); return; }
    const id = brief.id;
    const context = entry.context;
    setLoading({ id, step: 0 });
    const timers = [setTimeout(() => setLoading({ id, step: 1 }), 600), setTimeout(() => setLoading({ id, step: 2 }), 1250), setTimeout(() => {
      const creators = recommendCreators(campaign, brief);
      setMatching(prev => prev[id]?.context === context ? { ...prev, [id]: mergeRecommendations(prev[id], creators) } : prev);
      setLoading(null);
    }, 1900)];
    return () => timers.forEach(clearTimeout);
  }, [enabled, currentId, campaign, entry?.recommended, setMatching]);

  function selectBrief(id) { setActiveId(id); setSelectedOnly(false); setFilters({ creatorType: '', tier: '', vertical: '' }); setNotice(''); }
  function complete(id) {
    if (!matching[id]?.selectedCreatorIds.length) return;
    setMatching(previous => ({ ...previous, [id]: { ...previous[id], completed: true } }));
    const index = campaign.briefs.findIndex(b => b.id === id);
    const next = [...campaign.briefs.slice(index + 1), ...campaign.briefs.slice(0, index)].find(b => !matching[b.id]?.completed);
    if (next) selectBrief(next.id);
    else setNotice('所有 Brief 已完成选择，可确认达人组合。');
  }
  if (!brief || !entry) return null;
  const busy = loading?.id === currentId;
  const selected = entry.candidateCreators.filter(c => entry.selectedCreatorIds.includes(c.id));
  const available = entry.candidateCreators.filter(c => c.platform === currentPlatform);
  const verticals = [...new Set(available.flatMap(c => c.verticals))].sort();
  const candidates = (selectedOnly ? selected : available.filter(c => (!filters.creatorType || c.creatorType === filters.creatorType) && (!filters.tier || c.tier === filters.tier) && (!filters.vertical || c.verticals.includes(filters.vertical)))).toSorted((a, b) => b.briefMatch - a.briefMatch);
  return <section className="matching-page" aria-label="Creator Matching">
    <div className="matching-topbar"><Button variant="text-button" onClick={() => { window.location.hash = 'sim'; }}><Icon name="back" size={15}/>返回编辑方案</Button><span>ORAN SIM <i>/</i> Creator Matching</span><span className="matching-stage">02 <span>/ 03</span></span></div>
    <div className="matching-layout"><BriefNavigator campaign={campaign} matching={matching} activeId={currentId} onSelect={selectBrief} onComplete={complete}/>
      <div className="creator-workbench">
        <div className="recommend-actions"><Button className="ai-recommend-button" disabled={busy} onClick={() => { setSelectedOnly(false); changeEntry(old => ({ ...old, recommended: false })); }}><Icon name="spark" size={16}/>AI 推荐达人</Button><Button onClick={() => setManual(true)}><Icon name="plus" size={16}/>手动添加达人</Button><span>基于当前 Brief、品牌、市场与平台匹配</span></div>
        {campaign.platform.length > 1 && <div className="creator-platform-tabs" role="tablist" aria-label="Campaign 平台">{campaign.platform.map(p => <button key={p} role="tab" aria-selected={currentPlatform === p} onClick={() => { setPlatform(p); setSelectedOnly(false); setFilters({ creatorType: '', tier: '', vertical: '' }); }}>{p}<span>{entry.candidateCreators.filter(c => c.platform === p && entry.selectedCreatorIds.includes(c.id)).length}</span></button>)}</div>}
        {selectedOnly && <div className="creator-results-heading"><h3>已选达人 · 全部平台<span>{candidates.length}</span></h3><span>可在卡片中取消选择</span></div>}
        {!selectedOnly && <div className="creator-filters"><Field label="Creator Type"><Select value={filters.creatorType} onChange={e => setFilters({ ...filters, creatorType: e.target.value })}><option value="">全部类型</option><option>KOL</option><option>KOC</option><option>KOS</option></Select></Field><Field label="Creator Tier"><Select value={filters.tier} onChange={e => setFilters({ ...filters, tier: e.target.value })}><option value="">全部层级</option><option>Mega</option><option>Macro</option><option>Mid-tier</option><option>Micro</option><option>Nano</option></Select></Field><Field label="Vertical"><Select value={filters.vertical} onChange={e => setFilters({ ...filters, vertical: e.target.value })}><option value="">全部领域</option>{verticals.map(v => <option key={v}>{v}</option>)}</Select></Field>{Object.values(filters).some(Boolean) && <Button variant="text-button" onClick={() => setFilters({ creatorType: '', tier: '', vertical: '' })}>清除筛选</Button>}</div>}
        <p className="creator-data-note">模拟推荐：示例账号、指标与匹配度均为虚构，未联网搜索或验证主页。</p>
        {busy && !selectedOnly ? <div className="creator-loading" role="status" aria-live="polite"><span className="parsing-orb"><Icon name="spark" size={27}/></span><h3>{loadingSteps[loading.step]}</h3><ol>{loadingSteps.map((step, n) => <li key={step} className={n <= loading.step ? 'current' : ''}>{n < loading.step ? <Icon name="check" size={13}/> : <span className={n === loading.step ? 'spinner' : 'step-dot'}/>} {step}</li>)}</ol><span>正在模拟 {campaign.platform.join(' / ')} 上的 Creator 匹配</span></div>
          : candidates.length ? <div className="creator-grid">{candidates.map(c => <CreatorCard key={c.id} creator={c} campaign={campaign} brief={brief} selected={entry.selectedCreatorIds.includes(c.id)} onToggle={() => changeEntry(old => toggleSelection(old, c.id))} usedIn={campaign.briefs.flatMap((b, i) => b.id !== currentId && matching[b.id]?.selectedCreatorIds.includes(c.id) ? [`Brief ${String(i + 1).padStart(2, '0')}`] : [])}/>)}</div>
          : <div className="creator-empty"><Icon name="search" size={27}/><h3>{selectedOnly ? '还没有选择达人' : '没有符合筛选条件的达人'}</h3><p>{selectedOnly ? '从 AI 推荐中选择，或手动添加一个账号。' : '试试调整筛选条件，也可以手动添加达人。'}</p><Button onClick={() => { setSelectedOnly(false); setFilters({ creatorType: '', tier: '', vertical: '' }); }}>查看 AI 推荐</Button></div>}
        {notice && <p className="matching-notice" role="status">{notice}</p>}
      </div>
    </div>
    <footer className="matching-footer"><span><Icon name="check" size={15}/>{campaign.briefs.filter(b => matching[b.id]?.selectedCreatorIds.length).length} / {campaign.briefs.length} 个 Brief 已选择达人</span>{ready ? <Button variant="primary" onClick={() => { window.location.hash = 'result'; }}>确认达人组合，开始模拟<Icon name="arrow" size={17}/></Button> : <span>为每个 Brief 至少选择 1 位达人，即可继续</span>}</footer>
    {manual && <ManualCreatorModal campaign={campaign} brief={brief} activePlatform={currentPlatform} onClose={closeManual} onAdd={creator => { changeEntry(old => addManualCreator(old, creator)); setManual(false); setSelectedOnly(true); setNotice('已加入当前 Brief，可在已选达人中查看。'); }}/ >}
  </section>;
}
