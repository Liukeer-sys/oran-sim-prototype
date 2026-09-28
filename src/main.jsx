import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Icon } from './components.jsx';
import { emptySetup, isComplete } from './model.js';
import { prepareMatching, allBriefsSelected } from './creatorModel.js';
import './styles.css';
import SimulationSetup from './SimulationSetup.jsx';
import CreatorMatching from './CreatorMatching.jsx';
import SimulationWorkspace from './SimulationWorkspace.jsx';
import { simulationKey } from './simulationModel.js';

const products = [['HUB', 'hub'], ['GEN', 'spark'], ['MED', 'med'], ['SIM', 'sim']];
function Header() {
  return <header className="header"><a href="#sim" className="brand" aria-label="ORAN AI 首页"><span className="brand-mark"><i/><i/><i/></span>ORAN AI</a><div className="header-tools"><span><Icon name="gift"/>邀请好友</span><span><Icon name="database"/>记忆库</span><span><Icon name="globe"/>EN</span><div className="credits"><span>升级</span><b>ϟ</b>1531</div><span className="avatar">C</span></div></header>;
}
function Sidebar({ page, collapsed, setCollapsed }) {
  return <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}><div className="nav-item app-square"><Icon name="grid"/><span>应用广场</span></div><nav aria-label="产品导航">{products.map(([name, icon]) => <a key={name} href={`#${name.toLowerCase()}`} className={`nav-item ${page === name.toLowerCase() || (['matching', 'result'].includes(page) && name === 'SIM') ? 'active' : ''}`} aria-current={page === name.toLowerCase() ? 'page' : undefined} title={`ORAN ${name}`}><Icon name={icon}/><span>ORAN {name}</span>{name === 'SIM' && <small>NEW</small>}</a>)}</nav><div className="tool-title"><span>工具箱</span><Icon name="chevron" size={16}/></div><div className="tool-items">{[['图片生成', 'image'], ['视频生成', 'video'], ['复刻视频', 'copy'], ['TikTok爆款视频匹配', 'film']].map(([name, icon]) => <div className="nav-item" key={name} title="原网站工具 · 本原型未接入"><Icon name={icon}/><span>{name}</span></div>)}</div><button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? '展开侧栏' : '收起侧栏'}><Icon name="collapse"/><span>{collapsed ? '展开' : '收起'}</span></button></aside>;
}
function App() {
  const getPage = () => { const hash = window.location.hash.slice(1); return ['hub', 'gen', 'med', 'sim', 'matching', 'result'].includes(hash) ? hash : 'sim'; };
  const [page, setPage] = useState(getPage);
  const [collapsed, setCollapsed] = useState(() => ['matching', 'result'].includes(getPage()));
  const [data, setData] = useState(emptySetup);
  const [matching, setMatching] = useState({});
  const [matchingCampaign, setMatchingCampaign] = useState(null);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const canSimulate = matchingCampaign && allBriefsSelected(matchingCampaign, matching);
  useEffect(() => { if (page === 'result' && canSimulate) setSimulationStarted(true); }, [page, canSimulate]);
  useEffect(() => {
    // Simulation continues in the same workspace, retaining the current sidebar state.
    if (page !== 'result') setCollapsed(page === 'matching');
  }, [page]);
  function openMatching() {
    if (!isComplete(data)) return;
    setMatching(previous => prepareMatching(data, previous));
    setMatchingCampaign(data);
    window.location.hash = 'matching';
  }
  useEffect(() => { const listener = () => { setPage(getPage()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); }, []);
  return <><Header/><Sidebar page={page} collapsed={collapsed} setCollapsed={setCollapsed}/><main className={`${collapsed ? 'sidebar-small' : ''} ${['matching', 'result'].includes(page) ? 'matching-main' : ''}`}><div className="workspace-meta"><span>营销内容模拟</span><span className="prototype-tag">PROTOTYPE</span></div><div className="content" hidden={page !== 'sim'}><SimulationSetup data={data} setData={setData} onConfirm={openMatching}/></div>{matchingCampaign && <div hidden={page !== 'matching'}><CreatorMatching campaign={matchingCampaign} matching={matching} setMatching={setMatching} enabled={page === 'matching'}/></div>}
    {['matching', 'result'].includes(page) && !matchingCampaign && <div className="placeholder"><h1>请先确认营销内容</h1><p>从 Simulation Setup 导入方案并确认 Content Brief 后，即可开始匹配。</p><Button onClick={() => { window.location.hash = 'sim'; }}>返回编辑方案</Button></div>}
    {simulationStarted && canSimulate && <div hidden={page !== 'result'}><SimulationWorkspace key={simulationKey(matchingCampaign, matching)} campaign={matchingCampaign} matching={matching} enabled={page === 'result'}/></div>}
    {page === 'result' && matchingCampaign && !canSimulate && <div className="placeholder"><h1>请先完成达人选择</h1><p>每个 Brief 至少选择一位达人后才能继续。</p><Button onClick={() => { window.location.hash = 'matching'; }}>返回达人匹配</Button></div>}
    {['hub', 'gen', 'med'].includes(page) && <div className="placeholder product-placeholder"><h1>ORAN {page.toUpperCase()}</h1><p>{page === 'hub' ? '输入品牌与地区信息，一键生成洞察报告' : page === 'gen' ? '上传商品图开始对话，或直接输入问题' : '创建新投放任务'}</p><div className="reference-notice"><Icon name={products.find(([name]) => name.toLowerCase() === page)[1]} size={26}/><p>此处为产品导航占位</p><span>现有产品源码尚未接入，本次原型仅实现 ORAN SIM。</span><Button onClick={() => { window.location.hash = 'sim'; }}>前往 ORAN SIM<Icon name="arrow" size={17}/></Button></div></div>}</main></>;
}
createRoot(document.getElementById('root')).render(<App/>);
