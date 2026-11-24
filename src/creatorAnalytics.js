// Deterministic illustrative analytics; no network or real audience data.
const hash = text => [...text].reduce((sum, c) => (sum * 31 + c.codePointAt(0)) >>> 0, 7);
const normalize = values => {
  const total = values.reduce((a, b) => a + b, 0);
  const result = values.map(v => Math.floor(v / total * 100));
  result[result.length - 1] += 100 - result.reduce((a, b) => a + b, 0);
  return result;
};
const interests = ['Outdoor', 'Camping', 'Tech', 'Home', 'Lifestyle', 'Parenting', 'Wellness', 'Beauty', 'Sports'];
export const verticalNames = { Outdoor: '户外', Camping: '露营', Tech: '科技', Home: '家居', Lifestyle: '生活方式', Parenting: '母婴', Wellness: '健康', Beauty: '美妆', Sports: '运动' };
export function creatorAnalytics(creator, campaign, brief) {
  const seed = hash(creator.id);
  const domestic = ['小红书', '抖音'].includes(creator.platform);
  const country = domestic ? 'CN' : ['US', 'UK', 'AU', 'SG'][seed % 4];
  const language = domestic ? '中文' : 'English';
  // Fixed sample period keeps this prototype reproducible across refreshes.
  const followerHistory = ['05', '06', '07', '08', '09', '10'].map((month, i) => ({ month: `${month}月`, value: Math.round(creator.followers * [0.83, 0.87, 0.86, 0.92, 0.96, 1][i]) }));
  const videos = Array.from({ length: 12 }, (_, i) => Math.round(creator.followers * (0.12 + (hash(`${creator.id}:${i}:video`) % 170) / 100)));
  const sorted = [...videos].sort((a, b) => a - b);
  const totalViews = videos.reduce((a, b) => a + b, 0);
  const interactions = Math.round(totalViews * creator.engagementRate / 100);
  const likes = Math.round(interactions * 0.72), saves = Math.round(interactions * 0.18);
  const text = `${brief.title} ${brief.description} ${campaign.background} ${campaign.product}`;
  const keywords = { Outdoor: /户外|自驾|outdoor/i, Camping: /露营|营地|camp/i, Tech: /科技|电脑|设备|储能|tech/i, Home: /家居|卧室|新家|床|home/i, Lifestyle: /日常|生活|周末|lifestyle/i, Parenting: /亲子|父母|家长|宝宝|母婴|孩子|parent/i, Wellness: /营养|健康|维生素|wellness/i, Beauty: /美妆|护肤|beauty/i, Sports: /运动|健身|sport/i };
  const targetInterests = normalize(interests.map(t => keywords[t].test(text) ? 12 : 1));
  const actualInterests = normalize(interests.map(t => creator.verticals.includes(t) ? 12 + seed % 4 : 1));
  const targetAge = /父母|家长|亲子|新婚/.test(text) ? [10, 50, 30, 10] : /学生|校园/.test(text) ? [60, 25, 10, 5] : [25, 45, 22, 8];
  const actualAge = normalize([18 + seed % 16, 32 + seed % 20, 18 + seed % 11, 8 + seed % 9]);
  const marketShare = country === campaign.market ? 65 + seed % 20 : 12 + seed % 20;
  const dimensions = [
    { label: '年龄', labels: ['18–24', '25–34', '35–44', '45+'], actual: actualAge, target: targetAge },
    { label: '地区', labels: [campaign.market, '其他地区'], actual: [marketShare, 100 - marketShare], target: [85, 15] },
    { label: '兴趣', labels: interests.map(t => verticalNames[t]), actual: actualInterests, target: targetInterests },
  ].map(d => ({ ...d, overlap: d.actual.reduce((sum, value, i) => sum + Math.min(value, d.target[i]), 0) }));
  const bio = creator.bio || (domestic ? `记录${creator.verticals.map(t => verticalNames[t] || t).join('、')}的日常灵感。分享真实体验与实用好物。` : `${creator.verticals.join(', ')} inspiration and everyday discoveries. Sharing honest reviews and moments worth keeping.`);
  return { country, language, bio, followerHistory, views: { samples: videos, min: sorted[0], median: Math.round((sorted[5] + sorted[6]) / 2), max: sorted.at(-1) }, engagement: { views: totalViews, likes, saves, comments: interactions - likes - saves }, audience: { score: Math.round(dimensions.reduce((sum, d) => sum + d.overlap, 0) / dimensions.length), dimensions } };
}
