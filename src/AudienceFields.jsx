import React from 'react';
import { Field } from './components.jsx';

export default function AudienceFields({ audience, onChange, labelPrefix = 'Target Audience', layout = 'grid' }) {
  const ages = Array.isArray(audience.age) ? audience.age : audience.age ? [audience.age] : [];
  const genders = Array.isArray(audience.gender) ? audience.gender : audience.gender === 'all' ? ['female', 'male'] : audience.gender ? [audience.gender] : [];
  const toggle = (key, values, value) => onChange(key, values.includes(value) ? values.filter(v => v !== value) : [...values, value]);
  return <div className={`campaign-audience-grid ${layout === 'rows' ? 'audience-row-layout' : ''}`}>
    <fieldset className="audience-chip-field"><legend>Age</legend><div className="audience-chips" role="group" aria-label={`${labelPrefix} Age`}>{['18–24', '25–34', '35–44', '45–54', '55+'].map(age => <button key={age} type="button" aria-pressed={ages.includes(age)} onClick={() => toggle('age', ages, age)}>{age}</button>)}</div></fieldset>
    <fieldset className="audience-chip-field"><legend>Gender</legend><div className="audience-chips" role="group" aria-label={`${labelPrefix} Gender`}><button type="button" aria-pressed={genders.includes('female') && genders.includes('male')} onClick={() => onChange('gender', genders.includes('female') && genders.includes('male') ? [] : ['female', 'male'])}>All</button>{[['female', 'Female'], ['male', 'Male']].map(([value, label]) => <button key={value} type="button" aria-pressed={genders.includes(value)} onClick={() => toggle('gender', genders, value)}>{label}</button>)}</div></fieldset>
    <Field label={layout === 'rows' ? 'Region' : '地区'} className="audience-region-field"><input aria-label={`${labelPrefix} Region`} value={audience.region || ''} placeholder="例如：美国加州" onChange={e => onChange('region', e.target.value)}/></Field>
    <Field label={layout === 'rows' ? 'Interests' : '兴趣标签'} className="audience-interests-field"><input aria-label={`${labelPrefix} Interests`} value={audience.interests || ''} placeholder="露营、科技（逗号分隔）" onChange={e => onChange('interests', e.target.value)}/></Field>
  </div>;
}
