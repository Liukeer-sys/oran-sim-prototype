import React, { useId } from 'react';
import AudienceFields from './AudienceFields.jsx';
import { Field, Icon, Select } from './components.jsx';
import { emptySettings, platformOptions, timingError } from './model.js';
import './campaignInformation.css';

export default function CampaignInformation({ data, onChange }) {
  const defaults = emptySettings();
  const audience = data.audience || defaults.audience;
  const timing = data.timing || defaults.timing;
  const setAudience = (key, value) => onChange('audience', { ...audience, [key]: value });
  const error = timingError(timing);
  const categoriesId = useId();
  const platformIcon = ['TikTok', '抖音'].includes(data.platform[0]) ? 'music' : data.platform[0] === 'YouTube' ? 'play' : data.platform[0] === 'Instagram' ? 'image' : 'file';
  return <section className="campaign-information campaign-reference-layout" aria-label="Campaign Information">
    <section className="campaign-section required-section" aria-label="Campaign Basics">
    <Icon name="clipboard" size={28} className="campaign-section-icon"/>
    <div className="campaign-section-heading"><h3>Campaign Basics <span className="section-badge required-badge">Required</span></h3><p>运行模拟所需的基础信息</p></div>
    <div className="campaign-basics-layout">
    <div className="campaign-basics-grid">
      <Field label="Brand Name *"><input required aria-label="Brand Name" value={data.brandName || ''} placeholder="品牌名称" onChange={e => onChange('brandName', e.target.value)}/></Field>
      <Field label="Product Name *"><input required aria-label="Product Name" value={data.product} placeholder="产品名称" onChange={e => onChange('product', e.target.value)}/></Field>
      <Field label="Product Category *"><span className="campaign-category-select"><input required list={categoriesId} aria-label="Product Category" value={data.productCategory || ''} placeholder="选择或输入产品品类" onChange={e => onChange('productCategory', e.target.value)}/><Icon name="chevron" size={15}/></span><datalist id={categoriesId}>{['营养健康', '户外储能', '家居床品', '美妆护肤', '运动户外', '母婴用品', '消费电子', '食品饮料', '其他'].map(category => <option key={category} value={category}/>)}</datalist></Field>
      <Field label="Target Market *"><Select required aria-label="Target Market" value={data.market} onChange={e => onChange('market', e.target.value)}><option value="">请选择市场</option>{[['US', 'US 美国'], ['CN', 'CN 中国'], ['UK', 'UK 英国'], ['AU', 'AU 澳大利亚'], ['SG', 'SG 新加坡']].map(([code, name]) => <option key={code} value={code}>{name}</option>)}</Select></Field>
    </div><div className="campaign-platform-panel">
      <Field label="Platform *"><span className={`campaign-platform-select ${data.platform.length ? 'has-platform' : ''}`}>{data.platform.length > 0 && <Icon name={platformIcon} size={18} className="platform-brand-icon"/>}<Select required aria-label="Platform" value={data.platform[0] || ''} onChange={e => onChange('platform', e.target.value ? [e.target.value] : [])}><option value="">请选择平台</option>{platformOptions.map(p => <option key={p}>{p}</option>)}</Select></span></Field>
      <p className="campaign-platform-note"><Icon name="info" size={14}/>一次模拟仅支持一个平台。</p>
    </div></div>
    </section>
    <section className="campaign-section optional-section" aria-label="Campaign Settings">
    <Icon name="sliders" size={28} className="campaign-section-icon"/>
    <div className="campaign-section-heading"><h3>Campaign Settings <span className="section-badge">Optional</span></h3><p>补充营销背景与目标，帮助 AI 更精准地生成方案</p></div>
    <div className="campaign-settings-grid">
      <fieldset className="campaign-audience"><legend>Target Audience <span title="选填；支持选择多个年龄段和性别"><Icon name="info" size={14}/></span></legend><AudienceFields audience={audience} onChange={setAudience} layout="rows"/><Field label={<>Additional Audience Notes <span title="补充未被上述字段覆盖的人群特征"><Icon name="info" size={14}/></span></>} className="audience-notes"><textarea aria-label="Additional Audience Notes" value={audience.description} rows={2} placeholder="Describe any additional audience characteristics not covered above. e.g. People who value lightweight gear and reliable power for weekend trips." onChange={e => setAudience('description', e.target.value)}/></Field></fieldset>
      <div className="campaign-context"><Field label="Campaign Context"><textarea aria-label="Campaign Context" rows={3} value={data.background} placeholder="Describe your marketing background, campaign goals, or other relevant context. e.g. The campaign aims to build brand awareness through creator-led demonstrations, authentic storytelling, and real-world use cases." onChange={e => onChange('background', e.target.value)}/></Field>
      <Field label="Performance Focus"><Select aria-label="Performance Focus" value={data.performanceFocus || defaults.performanceFocus} onChange={e => onChange('performanceFocus', e.target.value)}>{['Overall Performance', 'Views', 'Engagement'].map(focus => <option key={focus}>{focus}</option>)}</Select></Field>
      <div className="campaign-timing"><Field label="Campaign Timing"><Select aria-label="Campaign Timing" value={timing.mode} onChange={e => onChange('timing', { mode: e.target.value, start: timing.start, durationDays: 14 })}><option value="current">Current / As soon as possible</option><option value="date">指定开始日期</option></Select></Field>
        {timing.mode === 'date' && <div className="campaign-date-grid"><Field label="开始日期"><input type="date" aria-label="Campaign Start Date" required value={timing.start} onChange={e => onChange('timing', { mode: 'date', start: e.target.value, durationDays: 14 })}/></Field></div>}
        <p className="campaign-timing-note">模拟开始后 14 天的营销表现</p>
        {error && <p className="campaign-date-error" role="alert">{error}</p>}
      </div></div>
    </div></section>
  </section>;
}
