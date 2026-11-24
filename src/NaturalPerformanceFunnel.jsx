import React from 'react';
import { compact, individualPerformance, rangeText, signed } from './simulationModel.js';
import './naturalPerformance.css';

export default function NaturalPerformanceFunnel({ currentCase: c, campaign }) {
  const performance = individualPerformance(c, campaign, { title: c.briefTitle, description: c.briefDescription });
  const rateLabel = performance.seconds ? `${performance.seconds}-second View Rate · ${performance.seconds} 秒观看率` : 'X-second View Rate · X 秒观看率';
  return <section className="individual-natural-performance" aria-label="Individual Natural Performance">
    <div className="natural-three-stages">
      <section className="natural-stage natural-viewing"><div className="natural-stage-copy"><h5>01 · 内容观看</h5><small>Estimated Views · 预计播放次数</small></div><div className="natural-stage-value"><strong>{rangeText(performance.views)}</strong><small>中位示意 {compact(performance.views.mid)}</small></div></section>
      <section className="natural-stage natural-quality"><div className="natural-stage-copy"><h5>02 · 观看质量</h5><small tabIndex={0} title={`观看时长 ≥ ${performance.seconds ?? 'X'} 秒的播放次数 / 总播放次数。${performance.seconds ? '当前秒数为 Prototype 配置。' : '当前平台的秒数阈值待配置。'}`}>{rateLabel}</small></div><div className="natural-stage-value"><strong className="natural-unavailable">Data unavailable</strong><small>缺少观看时长数据</small></div></section>
      <section className="natural-stage natural-engagement"><div className="natural-stage-copy"><h5>03 · 互动表现</h5><div className="natural-interactions">{Object.entries(performance.interactions).map(([label, value]) => <span key={label}>{label} <b>{value.toLocaleString('en-US')}</b></span>)}</div></div><div className="natural-stage-value" tabIndex={0} title="(Likes + Comments + Shares + Saves) / Views；使用中位演示值，不包含 Profile visits。"><strong>{performance.engagementRate}%</strong><small>Estimated Engagement Rate</small></div></section>
    </div>
    <p className="sim-footnote">数值为 Mock；色带宽度仅作示意，不代表真实流失比例。</p>
    <section className="natural-baseline"><h4>Vs Creator Baseline</h4><div className="natural-baseline-metrics"><div title={`相对历史播放中位数 ${compact(performance.baseline.views)}`}><span>Views</span><strong>{signed(performance.baseline.viewsLift)}</strong></div><div title="缺少预测及历史观看率，暂不计算 pp 变化"><span>{rateLabel}</span><strong className="natural-unavailable">Data unavailable</strong></div><div title="历史基线缺少 Shares，无法进行同口径 pp 比较"><span>Engagement Rate</span><strong className="natural-unavailable">Data unavailable</strong></div></div><p>对比达人近期可比内容的历史自然表现（Mock）。</p></section>
  </section>;
}
