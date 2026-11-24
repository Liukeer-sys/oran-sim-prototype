import React, { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './components.jsx';
export const compactNumber = value => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const dimensionNames = ['Age', 'Region', 'Interests'];
const level = score => score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low';

function AudienceCircles({ score }) {
  const offset = 38 - Math.max(0, Math.min(100, score)) * 0.24;
  return <svg className="audience-circles" viewBox="0 0 220 108" role="img" aria-label={'Target Audience 与 Creator Audience 相似度示意，Match Score ' + score + '%，非实际用户重合率'}>
    <circle cx={110 - offset} cy="45" r="39" fill="#f8b68b" fillOpacity=".28" stroke="#e7a579"/>
    <circle cx={110 + offset} cy="45" r="39" fill="#aebdb4" fillOpacity=".32" stroke="#9daa9f"/>
    <text x="110" y="44" textAnchor="middle" className="circle-score">{score}%</text>
    <text x="110" y="59" textAnchor="middle" className="circle-caption">Match Score</text>
    <text x="51" y="101" textAnchor="middle" className="circle-label">Target Audience</text>
    <text x="169" y="101" textAnchor="middle" className="circle-label">Creator Audience</text>
  </svg>;
}

function AudienceFit({ audience }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null), trigger = useRef(null), panel = useRef(null);
  const id = useId();
  const summary = [['High', 'Strong'], ['Medium', 'Moderate'], ['Low', 'Weaker']].flatMap(([grade, wording]) => {
    const names = audience.dimensions.flatMap((d, i) => level(d.overlap) === grade ? [dimensionNames[i].toLowerCase()] : []);
    return names.length ? [wording + ' ' + names.join(' + ') + ' match'] : [];
  }).join('; ') + '.';
  function close() { setOpen(false); trigger.current?.focus(); }
  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  return <section className="creator-metric audience-fit" ref={root} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }} onKeyDown={e => { if (e.key === 'Escape' && open) { e.stopPropagation(); close(); } }}>
    <button ref={trigger} className="audience-fit-trigger" type="button" aria-label={'Audience Fit ' + audience.score + '%，查看匹配详情'} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}>
      <span className="metric-label">Audience Fit</span><AudienceCircles score={audience.score}/><small className="audience-summary">{summary}</small>
    </button>
    {open && <div id={id} ref={panel} tabIndex={-1} role="dialog" aria-labelledby={id + '-title'} className="audience-popover">
      <div className="audience-popover-heading"><h4 id={id + '-title'}>Audience Similarity</h4><button type="button" className="button icon-button" aria-label="关闭受众匹配详情" onClick={close}><Icon name="close" size={15}/></button></div>
      <AudienceCircles score={audience.score}/><p>{summary}</p>
      <dl className="audience-levels">{audience.dimensions.map((d, i) => {
        const top = d.target.indexOf(Math.max(...d.target));
        return <div key={d.label}><dt>{dimensionNames[i]} <span>{level(d.overlap)} · {level(d.overlap) === 'High' ? '高' : level(d.overlap) === 'Medium' ? '中' : '低'}</span></dt><dd>{d.label}分布相似度 {d.overlap}%；目标侧重{d.labels[top]}。</dd></div>;
      })}</dl>
      <p className="audience-disclaimer">双圆仅示意 Match Score / Audience Similarity，不代表实际用户重合率。目标画像根据 Brief 推断，数据均为 Mock。</p>
    </div>}
  </section>;
}

export function CreatorMetrics({ creator, analytics }) {
  const { followerHistory: history, views, engagement, audience } = analytics;
  const values = history.map(p => p.value), min = Math.min(...values), range = Math.max(...values) - min || 1;
  const points = history.map((p, i) => (8 + i * 34) + ',' + (44 - (p.value - min) / range * 34)).join(' ');
  return <div className="creator-metrics">
    <section className="creator-metric"><span className="metric-label">Followers</span><strong>{compactNumber(creator.followers)}</strong>
      <svg className="metric-chart followers-chart" viewBox="0 0 186 56" role="img" aria-label={'2026 年月度粉丝数：' + history.map(p => p.month + ' ' + p.value).join('，')}><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>{history.map((p, i) => <circle key={p.month} cx={8 + i * 34} cy={44 - (p.value - min) / range * 34} r="3" fill="transparent"><title>{p.month} · {p.value.toLocaleString()} followers</title></circle>)}</svg>
      <div className="metric-range"><span>2026 · {history[0].month}</span><span>{history.at(-1).month}</span></div>
    </section>
    <section className="creator-metric"><span className="metric-label">Views · Median</span><strong>{compactNumber(views.median)}</strong>
      <svg className="metric-chart views-chart" viewBox="0 0 186 56" role="img" aria-label={'最近12条视频播放量，最低 ' + views.min + '，中位数 ' + views.median + '，最高 ' + views.max}>{views.samples.map((value, i) => <rect key={i} x={3 + i * 15} y={54 - value / views.max * 48} width="10" height={value / views.max * 48} rx="2" fill={value === views.max ? '#ef8a47' : '#cbd2d6'}><title>视频 {i + 1} · {value.toLocaleString()} views</title></rect>)}</svg>
      <div className="metric-range"><span>最低 {compactNumber(views.min)}</span><span>最高 {compactNumber(views.max)}</span></div>
    </section>
    <section className="creator-metric"><span className="metric-label">Engagement Rate</span><strong>{creator.engagementRate}%</strong>
      <div className="engagement-formula" role="img" aria-label="（点赞 + 收藏 + 评论）除以播放量，乘以100%"><div className="formula-fraction"><div><span title={'点赞 ' + engagement.likes}><Icon name="heart" size={13}/>点赞</span><i>+</i><span title={'收藏 ' + engagement.saves}><Icon name="bookmark" size={13}/>收藏</span><i>+</i><span title={'评论 ' + engagement.comments}><Icon name="comment" size={13}/>评论</span></div><div><Icon name="play" size={13}/>播放量</div></div><span>×100%</span></div><small>最近 12 条视频 · 汇总计算</small>
    </section>
    <AudienceFit audience={audience}/>
  </div>;
}
