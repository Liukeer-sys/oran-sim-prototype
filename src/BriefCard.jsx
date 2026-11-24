import React, { useId, useState } from 'react';
import { Button, Field, Icon, Select } from './components.jsx';
import AudienceFields from './AudienceFields.jsx';
import { changeBriefAudienceMode, cloneAudience, contentFormats } from './model.js';
import './briefCard.css';

export default function BriefCard({ brief, index, campaignAudience, onChange, onDelete, canDelete }) {
  const [collapsed, setCollapsed] = useState(false);
  const panelId = useId();
  const complete = Boolean(brief.title.trim() && brief.description.trim());
  const hidden = collapsed && complete;
  const prefix = `Brief ${index + 1}`;
  const update = (key, value) => onChange({ ...brief, [key]: value });
  const custom = brief.audienceMode === 'custom';
  return <article className={`result-brief brief-setup-card brief-horizontal-card ${hidden ? 'is-collapsed' : ''}`}>
    <div className="brief-heading"><span className="brief-number-badge">{prefix.replace(/\d+$/, n => n.padStart(2, '0'))}</span><div className="brief-heading-actions"><Button variant="text-button" aria-label={`${hidden ? '展开' : '折叠'} ${prefix}`} aria-expanded={!hidden} aria-controls={panelId} disabled={!complete} title={complete ? '折叠或展开此 Brief' : '补全标题与描述后可折叠'} onClick={() => setCollapsed(!hidden)}>{hidden ? '展开' : '折叠'}<Icon name="chevron" size={14}/></Button><Button variant="icon-button" aria-label={`删除 ${prefix}`} disabled={!canDelete} onClick={onDelete}><Icon name="trash" size={16}/></Button></div></div>
    {hidden && <p className="brief-collapsed-title">{brief.title}</p>}
    <div id={panelId} className="brief-card-fields" hidden={hidden}>
      <section className="brief-field-section required-section" aria-label={`${prefix} Content Direction`}>
      <div className="brief-section-heading"><Icon name="target" size={20}/><h4>Content Direction</h4><span className="section-badge required-badge">Required</span></div>
      <Field label="Brief Title *"><input required aria-label={`${prefix} 标题`} value={brief.title} placeholder="用一句话概括内容方向，例如：新家第一床被，先看什么？" onChange={e => update('title', e.target.value)}/></Field>
      <Field label="Brief Description *"><textarea required aria-label={`${prefix} 描述`} rows={3} value={brief.description} placeholder="描述内容主题、主要场景和表达思路，例如：通过布置卧室展示床品的触感与配色。无需完整视频脚本。" onChange={e => update('description', e.target.value)}/></Field>
      </section>
      <section className="brief-field-section optional-section" aria-label={`${prefix} Additional Settings`}>
      <div className="brief-section-heading"><Icon name="sliders" size={20}/><h4>Additional Settings</h4><span className="section-badge">Optional</span></div>
      <div className="brief-card-options"><Field label="Content Format"><Select aria-label={`${prefix} Content Format`} value={brief.contentFormat || ''} onChange={e => update('contentFormat', e.target.value)}><option value="">Select format（选填）</option>{contentFormats.map(format => <option key={format}>{format}</option>)}</Select></Field>
        <Field label="Target Audience"><Select aria-label={`${prefix} Target Audience`} value={brief.audienceMode || 'campaign'} onChange={e => onChange(changeBriefAudienceMode(brief, e.target.value, campaignAudience))}><option value="campaign">Use Campaign Audience</option><option value="custom">Customize for this Brief</option></Select></Field></div>
      {custom ? <div className="campaign-information brief-audience-editor"><AudienceFields audience={brief.customAudience || cloneAudience(campaignAudience)} labelPrefix={`${prefix} Audience`} onChange={(key, value) => update('customAudience', { ...cloneAudience(brief.customAudience || campaignAudience), [key]: value })}/><p>仅应用于当前 Brief，不影响 Campaign 或其他 Brief。</p></div> : <p className="brief-audience-hint"><Icon name="info" size={14}/>自动沿用 Campaign 的目标受众；可单独为该 Brief 重新设置。</p>}
      </section>
    </div>
  </article>;
}
