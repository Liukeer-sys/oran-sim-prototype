import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Icon, Modal } from './components.jsx';
import HubImportModal from './HubImportModal.jsx';
import { emptyBrief, fileError, importProject, isComplete, parseDescription, projects, platformOptions } from './model.js';
import './simulation.css';

function EditableValue({ label, displayLabel = label, value, onChange, multiline = false, options, className = '', missingText = '待补充', placeholder = '', helper = '' }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const missing = !value.trim();
  return <div className={`editable-value ${className} ${missing ? 'missing' : ''}`}>
    <span className="result-label">{displayLabel}</span>
    {editing ? <div className="inline-editor">
      {options ? <select ref={ref} aria-label={label} value={value} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)}><option value="">待补充</option>{options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
        : multiline ? <textarea ref={ref} aria-label={label} placeholder={placeholder} rows={3} value={value} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)} />
        : <input ref={ref} aria-label={label} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={e => { if (e.key === 'Enter') setEditing(false); }} />}
      <span className="edit-hint">{helper ? `${helper} · ` : ''}修改自动保留</span>
    </div> : <button className="editable-text" aria-label={`编辑 ${label}`} onClick={() => setEditing(true)}><span>{missing ? missingText : options?.find(([key]) => key === value)?.[1] || value}</span><span className="edit-affordance">{missing ? '+' : '编辑'}</span></button>}
  </div>;
}

function PlatformPicker({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const triggerRef = useRef(null);
  const groupRef = useRef(null);
  useEffect(() => { if (editing) groupRef.current?.querySelector('button')?.focus(); }, [editing]);
  const finish = () => { setEditing(false); requestAnimationFrame(() => triggerRef.current?.focus()); };
  return <div className={`editable-value platform-picker ${value.length ? '' : 'missing'}`}>
    <span className="result-label">Platform <span className="platform-multiple-hint">可多选</span></span>
    {editing ? <div className="platform-editor" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); finish(); } }}>
      <div ref={groupRef} className="platform-options" role="group" aria-label="选择发布平台（可多选）">{platformOptions.map(platform => <button key={platform} type="button" aria-pressed={value.includes(platform)} onClick={() => onChange(value.includes(platform) ? value.filter(p => p !== platform) : [...value, platform])}>{platform}{value.includes(platform) && <Icon name="check" size={13}/>}</button>)}</div>
      <div className="platform-editor-footer"><span>{value.length ? `已选 ${value.length} 个平台` : '请至少选择一个平台'}</span><Button variant="text-button" onClick={finish}>完成</Button></div>
    </div> : <button ref={triggerRef} className="editable-text platform-summary" aria-label="编辑 Platform" onClick={() => setEditing(true)}><span className="platform-tags">{value.length ? value.map(platform => <span className="platform-tag" key={platform}>{platform}</span>) : '待补充发布平台'}</span><span className="edit-affordance">{value.length ? '编辑' : '+'}</span></button>}
  </div>;
}

export default function SimulationSetup({ data, setData, onConfirm }) {
  const [stage, setStage] = useState('entry');
  const [composing, setComposing] = useState(false);
  const [description, setDescription] = useState('');
  const [modal, setModal] = useState(false);
  const [pending, setPending] = useState(null);
  const [source, setSource] = useState(null);
  const [parsingSource, setParsingSource] = useState(null);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const timers = useRef([]);
  const fileRef = useRef(null);
  const textRef = useRef(null);
  const headingRef = useRef(null);
  const closeModal = useCallback(() => setModal(false), []);
  const closePending = useCallback(() => setPending(null), []);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { if (composing && stage === 'entry') textRef.current?.focus(); }, [composing, stage]);
  useEffect(() => { if (stage === 'review') headingRef.current?.focus(); }, [stage]);

  function startParsing(request) {
    clearTimers(); setPending(null); setError(''); setStep(0); setParsingSource(request.origin); setStage('parsing');
    timers.current.push(setTimeout(() => setStep(1), 650));
    timers.current.push(setTimeout(() => setStep(2), 1350));
    timers.current.push(setTimeout(() => {
      setData(request.result); setSource(request.origin); setStage('review');
    }, 2200));
  }
  function submit(request) {
    setModal(false);
    if (source) setPending(request);
    else startParsing(request);
  }
  function uploadFile(file) {
    if (!file) return;
    const message = fileError(file); setError(message);
    if (!message) submit({ result: importProject(projects[2]), origin: { kind: 'file', name: file.name } });
  }
  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const updateBrief = (id, key, value) => setData(prev => ({ ...prev, briefs: prev.briefs.map(b => b.id === id ? { ...b, [key]: value } : b) }));
  const missingCount = Number(!data.platform.length) + ['market', 'product', 'background'].filter(key => !data[key].trim()).length + data.briefs.reduce((n, b) => n + Number(!b.title.trim()) + Number(!b.description.trim()), 0);
  const steps = [parsingSource?.kind === 'file' ? '正在模拟上传并读取方案' : '正在理解营销方案', '识别平台、市场与产品信息', '整理 Content Brief 与内容方向'];

  return <>
    <div className="page-heading"><h1>ORAN SIM</h1><p>导入营销内容方案，匹配达人并预测自然传播表现</p></div>
    <section className={`setup-card progressive-card stage-${stage}`} aria-label="Simulation Setup">
      {stage === 'entry' && <div className="entry-body">
        <div className="entry-intro"><span className="ai-symbol"><Icon name="spark" size={23}/></span><div><h2>从你的营销想法开始</h2><p>带入一份方案，AI 将为你整理模拟所需的内容。</p></div></div>
        <div className="entry-imports">
          <Button className="entry-source" onClick={() => setModal(true)}><Icon name="hub" size={24}/><span><strong>从 ORAN HUB 导入</strong><small>已有营销方案 / MCCM 报告</small></span><Icon name="arrow" size={18}/></Button>
          <Button className="entry-source" onClick={() => fileRef.current.click()}><Icon name="upload" size={24}/><span><strong>上传营销方案</strong><small>PDF、DOCX、TXT · 最大 20 MB</small></span><Icon name="arrow" size={18}/></Button>
        </div>
        <div className={`description-entry ${composing ? 'expanded' : ''}`}>
          {!composing ? <button className="description-trigger" onClick={() => setComposing(true)}><Icon name="spark" size={22}/><span><strong>直接粘贴/描述营销方案</strong><small>一个想法、一段 Brief，或完整的内容计划都可以</small></span><Icon name="plus" size={20}/></button>
            : <><label htmlFor="marketing-description">直接粘贴/描述营销方案</label><textarea id="marketing-description" ref={textRef} value={description} onChange={e => setDescription(e.target.value)} placeholder={'例如：品牌：云眠。希望在小红书面向中国新婚人群推广全棉床品，通过卧室布置和真实体验，传递柔软舒适的产品感受。'} rows={5}/><div className="composer-footer"><span>不必整理格式，先说说你的想法</span><Button variant="primary" disabled={!description.trim()} onClick={() => submit({ result: parseDescription(description), origin: { kind: 'text', name: '粘贴 / 描述的营销方案' } })}>AI 解析方案<Icon name="arrow" size={17}/></Button></div></>}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {source && <Button variant="text-button" className="return-result" onClick={() => { setError(''); setStage('review'); }}>返回已有解析结果<Icon name="arrow" size={16}/></Button>}
      </div>}

      {stage === 'parsing' && <div className="parsing-body" role="status" aria-live="polite" aria-busy="true">
        <div className="parsing-orb"><Icon name="spark" size={30}/></div><h2>AI 正在整理你的方案</h2><p className="parsing-source">{parsingSource.name}</p>
        <ol className="parsing-steps">{steps.map((text, index) => <li key={text} className={index < step ? 'done' : index === step ? 'current' : ''}>{index < step ? <Icon name="check" size={16}/> : index === step ? <span className="spinner"/> : <span className="step-dot"/>}{text}</li>)}</ol>
        <p className="parsing-disclaimer">模拟 AI 解析 · 无实际模型调用{parsingSource.kind === 'file' && '，文件不会上传'}</p>
        <Button variant="text-button" onClick={() => { clearTimers(); setStage(source ? 'review' : 'entry'); }}>取消解析</Button>
      </div>}

      {stage === 'review' && <>
        <div className="review-body">
          <div className="review-heading"><div><span className="review-eyebrow"><Icon name="check" size={15}/>模拟解析完成</span><h2 ref={headingRef} tabIndex={-1}>确认你的营销内容</h2></div><Button variant="text-button" onClick={() => { setError(''); setStage('entry'); }}>重新导入</Button></div>
          <p className="review-description">{source.kind === 'file' ? '以下为预设示例，并非对文件的真实解析。' : source.kind === 'text' ? '基础信息由简单规则提取，Brief 为模拟建议，请核对。' : '已从 Hub 示例项目整理内容，请核对。'}点击任意内容即可修改。</p>
          <span className="result-source"><Icon name={source.kind === 'file' ? 'file' : source.kind === 'hub' ? 'hub' : 'spark'} size={15}/>{source.name}</span>
          <div className="result-facts">
            <PlatformPicker value={data.platform} onChange={value => update('platform', value)}/>
            <EditableValue label="Market" value={data.market} onChange={value => update('market', value)} options={[[ 'US', 'US 美国'], ['CN', 'CN 中国'], ['UK', 'UK 英国'], ['AU', 'AU 澳大利亚'], ['SG', 'SG 新加坡']]}/>
            <EditableValue label="Brand / Product" value={data.product} onChange={value => update('product', value)}/>
          </div>
          <EditableValue label="Background · 产品及营销背景" value={data.background} onChange={value => update('background', value)} multiline className="result-background"/>
          <div className="result-brief-heading"><h3>Content Brief <span className="count">{data.briefs.length}</span></h3><span>每个 Brief 对应一个内容方向</span></div>
          <div className="result-briefs">{data.briefs.map((brief, index) => <article className="result-brief" key={brief.id}>
            <div className="brief-heading"><span>Brief {String(index + 1).padStart(2, '0')}</span><Button variant="icon-button" aria-label={`删除 Brief ${index + 1}`} disabled={data.briefs.length === 1} onClick={() => update('briefs', data.briefs.filter(b => b.id !== brief.id))}><Icon name="trash" size={16}/></Button></div>
            <EditableValue label={`Brief ${index + 1} 标题`} displayLabel="内容标题" missingText="待补充标题：用一句话概括这个内容创意" placeholder="例如：新家第一床被，先看什么？" helper="填写内容主题或拟发布的标题" value={brief.title} onChange={value => updateBrief(brief.id, 'title', value)} className="brief-result-title"/>
            <EditableValue label={`Brief ${index + 1} 描述`} displayLabel="素材内容概述" missingText="待补充素材描述：准备拍什么、怎么呈现、传递什么信息？" placeholder="例如：拍摄新婚夫妻布置卧室的过程，以面料触感、配色和实际使用体验为线索，自然展示床品的柔软与舒适。" helper="简述视频或图文的场景、表现形式与核心信息，无需完整脚本" value={brief.description} onChange={value => updateBrief(brief.id, 'description', value)} multiline className="brief-result-description"/>
          </article>)}</div>
          <Button variant="text-button" className="add-result-brief" onClick={() => update('briefs', [...data.briefs, emptyBrief()])}><Icon name="plus" size={17}/>添加 Content Brief</Button>
        </div>
        <footer className="setup-footer"><span className="completion-hint">{isComplete(data) ? `内容已就绪 · ${data.briefs.length} 个 Brief` : `${missingCount} 项待补充 · 点击对应内容完善`}</span><Button variant="primary" disabled={!isComplete(data)} onClick={onConfirm}>确认内容，匹配达人<Icon name="arrow" size={18}/></Button></footer>
      </>}
      <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" hidden onChange={e => { uploadFile(e.target.files?.[0]); e.target.value = ''; }}/>
    </section>
    <p className="prototype-note">Simulation Setup <span>·</span> 原型预览 · AI 解析为模拟演示</p>
    {modal && <HubImportModal onClose={closeModal} onImport={project => submit({ result: importProject(project), origin: { kind: 'hub', name: project.name } })}/>}
    {pending && <Modal title="替换当前方案？" subtitle="重新解析将替换已有结果及修改。取消后可继续编辑原方案。" onClose={closePending}><div className="replace-preview"><Icon name="file"/>{pending.origin.name}</div><div className="modal-footer"><Button onClick={() => { setPending(null); setStage('review'); }}>保留当前内容</Button><Button variant="primary" onClick={() => startParsing(pending)}>替换并解析</Button></div></Modal>}
  </>;
}
