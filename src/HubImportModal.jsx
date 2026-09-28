import React, { useState } from 'react';
import { Button, Icon, Modal } from './components.jsx';
import { projects } from './model.js';

export default function HubImportModal({ onClose, onImport }) {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const results = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  return <Modal title="从 ORAN HUB 导入" subtitle="选择已有营销方案，将内容带入当前模拟。" onClose={onClose}><div className="search-box"><Icon name="search" size={18}/><input autoComplete="off" aria-label="搜索 Hub 项目" placeholder="搜索营销方案或 MCCM 报告" value={query} onChange={e => setQuery(e.target.value)}/></div><div className="project-list" role="radiogroup" aria-label="Hub 历史项目">{results.map(p => <button role="radio" aria-checked={selected === p.id} className={`project-option ${selected === p.id ? 'selected' : ''}`} key={p.id} onClick={() => setSelected(p.id)}><span className="project-icon"><Icon name="file" size={23}/></span><span className="project-info"><strong>{p.name}</strong><span>{p.type} <i>·</i> {p.platform} / {p.market} <i>·</i> {p.briefs.length} 个 Brief</span><small>{p.date}</small></span><span className="radio-mark">{selected === p.id && <span/>}</span></button>)}{!results.length && <p className="empty-search">没有找到相关项目，请试试其他关键词。</p>}</div><div className="modal-footer"><span className="muted">示例项目 · Mock data</span><Button onClick={onClose}>取消</Button><Button variant="primary" disabled={!selected} onClick={() => onImport(projects.find(p => p.id === selected))}>导入方案<Icon name="arrow" size={16}/></Button></div></Modal>;
}
