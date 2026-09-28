const profiles = [
  ['OutdoorMia', 328000, 'KOL', 'Mid-tier', ['Outdoor', 'Camping', 'Lifestyle'], 4.8],
  ['TechWithLeo', 1250000, 'KOL', 'Head', ['Tech', 'Outdoor'], 3.6],
  ['WeekendWithJune', 18600, 'KOC', 'Long-tail', ['Camping', 'Lifestyle'], 6.2],
  ['HomeByLuna', 216000, 'KOL', 'Mid-tier', ['Home', 'Lifestyle'], 5.1],
  ['EverydayWithAmy', 14200, 'KOC', 'Long-tail', ['Parenting', 'Lifestyle'], 7.1],
  ['FamilyWithEmma', 1080000, 'KOL', 'Head', ['Parenting', 'Wellness'], 3.9],
  ['SimpleDaysKai', 62000, 'KOC', 'Mid-tier', ['Home', 'Lifestyle', 'Wellness'], 5.6],
  ['TinyTrailNotes', 42000, 'KOL', 'Long-tail', ['Outdoor', 'Camping', 'Tech'], 5.3],
];
export const creatorId = (platform, username) => `${platform}:${username.replace(/^@/, '').toLowerCase()}`;
export function avatarFor(name) {
  const seed = [...name].reduce((n, c) => n + c.charCodeAt(0), 0);
  const colors = ['#dce4df', '#e8ded4', '#dde1eb', '#e7dce5', '#e4e5d6'];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="${colors[seed % colors.length]}"/><path d="M12 82c0-34 56-34 56 0" fill="#818b85"/><ellipse cx="40" cy="34" rx="16" ry="19" fill="#f0cdb3"/><path d="M24 33c-5-27 39-30 34 3-5-3-8-9-9-14-5 9-17 5-25 11" fill="#514c46"/><circle cx="34" cy="34" r="1.2" fill="#514c46"/><circle cx="46" cy="34" r="1.2" fill="#514c46"/><path d="M36 42q4 3 8 0" fill="none" stroke="#ae7765" stroke-width="1.5"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
export function profileUrlFor(platform, username) {
  const name = encodeURIComponent(username.replace(/^@/, ''));
  return ({ TikTok: `https://www.tiktok.com/@${name}`, YouTube: `https://www.youtube.com/@${name}`, Instagram: `https://www.instagram.com/${name}/`, '小红书': `https://www.xiaohongshu.com/user/profile/${name}`, '抖音': `https://www.douyin.com/user/${name}` })[platform];
}
function inferVerticals(brief, campaign) {
  const text = `${brief.title} ${brief.description} ${campaign.product}`;
  if (/露营|户外|储能|camp|outdoor/i.test(text)) return ['Outdoor', 'Camping', 'Tech'];
  if (/儿童|亲子|家长|宝宝|维生素|pentavite/i.test(text)) return ['Parenting', 'Wellness', 'Lifestyle'];
  if (/家居|床|卧室|新家|home/i.test(text)) return ['Home', 'Lifestyle'];
  if (/科技|设备|tech/i.test(text)) return ['Tech', 'Lifestyle'];
  return ['Lifestyle', 'Home', 'Outdoor'];
}
export function recommendCreators(campaign, brief) {
  const verticals = inferVerticals(brief, campaign);
  const salt = [...brief.title].reduce((n, c) => n + c.charCodeAt(0), 0);
  return campaign.platform.flatMap(platform => profiles.map(([name, followers, creatorType, tier, tags, engagementRate], index) => {
    const username = `@oran_demo_${name.toLowerCase()}`;
    const match = Math.min(98, 73 + tags.filter(t => verticals.includes(t)).length * 7 + (salt + index) % 5);
    return { id: creatorId(platform, username), platform, username, displayName: name, avatar: avatarFor(name), profileUrl: profileUrlFor(platform, username), followers, creatorType, tier, verticals: tags, engagementRate, briefMatch: match, source: 'ai',
      reason: `示例账号侧重 ${tags.join(' / ')} 内容，可围绕「${brief.title}」呈现 ${campaign.product} 的使用场景。已将 ${campaign.market} 市场及 ${platform} 内容形式纳入模拟匹配。` };
  })).sort((a, b) => b.briefMatch - a.briefMatch);
}
const contextFor = (campaign, brief) => JSON.stringify([campaign.platform, campaign.market, campaign.product, campaign.background, brief.title, brief.description]);
export function prepareMatching(campaign, previous = {}) {
  return Object.fromEntries(campaign.briefs.map(brief => {
    const context = contextFor(campaign, brief);
    const old = previous[brief.id];
    if (old?.context === context) return [brief.id, old];
    const candidates = old?.candidateCreators.filter(c => campaign.platform.includes(c.platform) && (c.source === 'manual' || old.selectedCreatorIds.includes(c.id))) || [];
    return [brief.id, { context, candidateCreators: candidates, selectedCreatorIds: old?.selectedCreatorIds.filter(id => candidates.some(c => c.id === id)) || [], completed: false, recommended: false }];
  }));
}
export function mergeRecommendations(entry, creators) {
  const map = new Map(entry.candidateCreators.map(c => [c.id, c]));
  creators.forEach(c => { if (map.get(c.id)?.source !== 'manual') map.set(c.id, c); });
  return { ...entry, candidateCreators: [...map.values()], recommended: true };
}
export function toggleSelection(entry, id) {
  if (!entry.candidateCreators.some(c => c.id === id)) return entry;
  const selectedCreatorIds = entry.selectedCreatorIds.includes(id) ? entry.selectedCreatorIds.filter(v => v !== id) : [...entry.selectedCreatorIds, id];
  return { ...entry, selectedCreatorIds, completed: entry.completed && selectedCreatorIds.length > 0 };
}
export function addManualCreator(entry, creator) {
  return { ...entry, candidateCreators: entry.candidateCreators.some(c => c.id === creator.id) ? entry.candidateCreators : [...entry.candidateCreators, creator], selectedCreatorIds: [...new Set([...entry.selectedCreatorIds, creator.id])] };
}
export const allBriefsSelected = (campaign, matching) => campaign.briefs.length > 0 && campaign.briefs.every(b => matching[b.id]?.selectedCreatorIds.length > 0);

export function parseManualCreator({ url, username, activePlatform, campaign, brief }) {
  let platform = activePlatform;
  let profileUrl = '';
  let account = username.trim().replace(/^@/, '');
  if (!url.trim() && !account) return { error: '请填写主页链接或 username / account ID。' };
  if (url.trim()) {
    let parsed;
    try { parsed = new URL(url.trim()); } catch { return { error: '请输入完整的 https:// 达人主页链接。' }; }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return { error: '请使用不含登录信息的 HTTPS 主页链接。' };
    const domain = parsed.hostname.replace(/^www\./, '').toLowerCase();
    platform = ({ 'tiktok.com': 'TikTok', 'youtube.com': 'YouTube', 'instagram.com': 'Instagram', 'xiaohongshu.com': '小红书', 'douyin.com': '抖音' })[domain];
    if (!platform) return { error: '暂不支持此链接，请使用 TikTok、YouTube、Instagram、小红书或抖音的完整主页链接。' };
    if (!campaign.platform.includes(platform)) return { error: `此账号属于 ${platform}，不在当前 Campaign 的平台范围内。` };
    const path = parsed.pathname.split('/').filter(Boolean);
    const validPath = platform === 'TikTok' ? path.length === 1 && path[0].startsWith('@')
      : platform === 'YouTube' ? (path.length === 1 && path[0].startsWith('@')) || (path.length === 2 && ['channel', 'c', 'user'].includes(path[0]))
      : platform === '小红书' ? path.length === 3 && path[0] === 'user' && path[1] === 'profile'
      : platform === '抖音' ? path.length === 2 && path[0] === 'user'
      : path.length === 1 && !['p', 'reel', 'explore', 'accounts'].includes(path[0]);
    if (!validPath) return { error: '请填写账号主页链接，而不是视频、帖子或平台首页。' };
    let linkedAccount;
    try { linkedAccount = decodeURIComponent(path.at(-1)).replace(/^@/, ''); } catch { return { error: '主页链接中的账号格式无效。' }; }
    if (account && account.toLowerCase() !== linkedAccount.toLowerCase()) return { error: '链接中的账号与填写的 username / account ID 不一致，请核对或只填写其中一项。' };
    account = linkedAccount;
    profileUrl = `https://${parsed.hostname}${parsed.pathname}`;
  }
  if (!campaign.platform.includes(platform)) return { error: '账号平台不在当前 Campaign 内。' };
  if (!/^[\p{L}\p{N}_.-]{1,80}$/u.test(account)) return { error: '账号仅支持文字、数字、下划线、短横线和点，最多 80 个字符。' };
  return { creator: { id: creatorId(platform, account), platform, username: `@${account}`, displayName: account, avatar: avatarFor(account), profileUrl: profileUrl || profileUrlFor(platform, account), followers: 28600, creatorType: 'KOC', tier: 'Long-tail', verticals: inferVerticals(brief, campaign).slice(0, 2), engagementRate: 5.2, briefMatch: 86, source: 'manual', reason: `手动添加的示例账号。根据「${brief.title}」生成模拟标签与匹配度；未联网验证主页或账号指标。` } };
}
