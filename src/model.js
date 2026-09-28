export const emptyBrief = () => ({ id: crypto.randomUUID(), title: '', description: '' });
export const platformOptions = ['TikTok', 'Instagram', 'YouTube', '小红书', '抖音'];
export const emptySetup = () => ({ platform: [], market: '', product: '', background: '', briefs: [emptyBrief()] });
export const isComplete = (data) => Boolean(data.platform.length && data.market && data.product.trim() && data.background.trim() && data.briefs.length && data.briefs.every(b => b.title.trim() && b.description.trim()));
export function fileError(file) {
  if (!/\.(pdf|docx|txt)$/i.test(file.name)) return '请选择 PDF、DOCX 或 TXT 格式的文件。';
  if (file.size === 0) return '文件为空，请重新选择。';
  if (file.size > 20 * 1024 * 1024) return '文件超过 20 MB，请选择较小的文件。';
  return '';
}
export const projects = [
  { id: 'pentavite', name: 'Pentavite TikTok US 营销策略', type: 'MCCM 报告', date: '2026.09.15', platform: 'TikTok', market: 'US', product: 'Pentavite 儿童复合维生素', background: '面向美国年轻父母，以日常亲子生活为场景，介绍儿童营养补充的便利性。内容表达真实、轻松，避免医疗功效承诺，建立家长对品牌的认知与信任。', briefs: [
    ['忙碌早晨，也能照顾好小小的他', '以家长的晨间记录为线索，展示早餐、整理书包与日常营养补充的自然场景，突出简单易坚持的习惯。'],
    ['挑食宝宝的餐桌日记', '记录孩子面对不同食物的真实反应，分享家庭饮食搭配与营养管理心得，自然带出产品。'],
    ['妈妈包里有什么？', '通过周末出游的包内物品分享，介绍亲子出行准备与产品携带体验，强调生活感。'],
    ['和孩子一起完成一个小习惯', '用一周生活片段呈现亲子打卡，通过轻松互动传递品牌陪伴感，邀请观众分享家庭日常。']
  ] },
  { id: 'bluetti', name: 'Bluetti TikTok 品牌策略', type: '品牌策略', date: '2026.09.12', platform: 'TikTok', market: 'US', product: 'BLUETTI 便携式储能电源', background: '面向热爱露营和自驾的美国用户，以户外真实使用场景建立便携储能产品认知，突出可靠供电与轻松出行体验。', briefs: [
    ['把周末搬到户外', '记录一次双人露营，从搭帐篷到户外咖啡，展示储能电源如何融入周末生活。'],
    ['我的移动办公桌，在山里', '以远程办公者视角展示户外工作的一天，分享电脑与其他设备的供电体验。'],
    ['日落之后，露营才刚开始', '从营地灯光、音乐和晚餐三个场景出发，展现户外用电带来的舒适感。']
  ] },
  { id: 'home', name: '新婚家居营销策略', type: '营销方案', date: '2026.09.08', platform: '小红书', market: 'CN', product: '云眠 · 全棉家居床品', background: '面向正在布置新家的年轻新婚人群，以卧室搭配和真实睡眠体验为切入点，传递柔软、舒适、有质感的产品价值。', briefs: [
    ['新家第一床被，先看什么？', '以新婚夫妻布置卧室为场景，分享床品面料、触感与颜色的选择过程，让产品自然出现在新家日记中。'],
    ['让卧室成为最想回来的地方', '通过卧室改造前后对比，展示床品如何改变空间氛围，分享配色与日常打理心得。']
  ] }
];
export const importProject = (p) => ({ platform: Array.isArray(p.platform) ? [...p.platform] : [p.platform], market: p.market, product: p.product, background: p.background, briefs: p.briefs.map(([title, description]) => ({ id: crypto.randomUUID(), title, description })) });

// Deterministic prototype parsing: preserve the user's text, leave unknown facts empty.
export function parseDescription(text) {
  const platform = platformOptions.filter(p => text.toLowerCase().includes(p.toLowerCase()));
  const markets = [['US', /美国|\bUS\b/i], ['CN', /中国|\bCN\b/i], ['UK', /英国|\bUK\b/i], ['AU', /澳大利亚|澳洲|\bAU\b/i], ['SG', /新加坡|\bSG\b/i]];
  const market = markets.find(([, pattern]) => pattern.test(text))?.[0] || '';
  const product = text.match(/(?:品牌|产品|brand|product)\s*[:：]\s*([^\n，。,;；]+)/i)?.[1]?.trim()
    || ['Pentavite', 'Bluetti', '云眠'].find(p => text.toLowerCase().includes(p.toLowerCase())) || '';
  return { platform, market, product, background: text.trim(), briefs: [
    { ...emptyBrief(), title: '从真实生活场景切入', description: `围绕${product || '本次营销内容'}，用目标用户的日常场景呈现需求与使用体验。此内容方向为模拟建议，请结合原方案确认。` },
    { ...emptyBrief(), title: '分享选择与体验心得', description: `围绕原方案中的核心信息，制作选择过程或体验分享，邀请观众交流。此内容方向为模拟建议，请按实际产品调整。` }
  ] };
}
