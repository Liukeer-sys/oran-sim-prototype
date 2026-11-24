# ORAN SIM 字号层级

所有页面复用 `src/typography.css`，新增样式使用变量，不新增零散字号。

| 变量 | 字号 | 用途 |
| --- | --- | --- |
| `--text-caption` | 10px | 辅助说明、图表标注、状态提示 |
| `--text-secondary` | 12px | 次级字段、紧凑输入、说明文字 |
| `--text-body` | 14px | 一级字段标题、正文、按钮和标签 |
| `--text-heading` | 18px | 分组标题、卡片标题、指标数值 |
| `--text-title` | 24px | 页面内大标题、强调数值 |
| `--text-display-small` | 32px | 窄屏产品标题 |
| `--text-display` | 38px | 产品主标题 |

Campaign Information 中，Brand Name、Platform、Target Audience、Campaign Context、Performance Focus、Campaign Timing 同为 14px；Age、Gender、地区、兴趣及开始日期为 12px。必填和选填通过分组及星号区分，不额外增加字号。
