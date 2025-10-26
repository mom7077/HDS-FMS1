# COPD Navigator Dashboard

> 英国COPD患者GP诊所查找仪表板 - 帮助COPD患者快速定位附近优质诊所

## 📋 项目简介

这是一个为独居COPD（慢性阻塞性肺病）患者设计的轻量级单页应用，帮助他们：
- 根据邮编查找附近的GP诊所
- 对比诊所质量指标（成就率、干预率、年度评审率等）
- 查看天气和健康建议
- 快速联系和导航到诊所

## ✨ 功能特性

- 🗺️ **交互式地图**：基于Leaflet的英国地图，可视化显示GP诊所位置
- 🔍 **智能筛选**：按邮编、距离、评分筛选诊所
- 📊 **数据可视化**：使用ECharts展示COPD质量指标趋势
- 🌤️ **天气建议**：根据温度、湿度、AQI提供呼吸健康建议
- 📱 **一键联系**：直接拨打电话或打开Google地图导航
- 📈 **实时KPI**：动态显示附近GP数量、平均评分、平均干预率

## 🛠️ 技术栈

- **前端**：HTML5 + CSS3 + 原生JavaScript（无框架依赖）
- **地图库**：Leaflet.js 1.9.4
- **图表库**：Apache ECharts 5.5.0
- **数据处理**：Python 3.x (pandas, numpy)
- **数据源**：NHS Digital COPD质量数据

## 📁 项目结构

```
dashboard/
├── frontend-dashboard/           # 前端应用目录
│   ├── index.html               # 主页面
│   ├── assets/
│   │   └── css/
│   │       └── styles.css       # 样式文件
│   ├── data/
│   │   ├── dashboard-data.js    # 生成的静态数据
│   │   └── weather_lookup.json  # 天气查找表
│   ├── js/
│   │   ├── main.js             # 主逻辑
│   │   ├── map.js              # 地图模块
│   │   └── utils.js            # 工具函数
│   ├── scripts/
│   │   └── build_dashboard_data.py  # 数据预处理脚本
│   └── GP_COPD_dashboard_PRD.md     # 产品需求文档
├── Full_Data.csv                # 原始NHS数据
└── README.md                    # 本文档
```

## 🚀 快速开始

### 方法一：直接运行（推荐）

如果已经有生成好的 `dashboard-data.js` 文件：

1. **克隆项目**
   ```bash
   git clone https://github.com/mom7077/HDS-FMS1.git
   cd dashboard/frontend-dashboard
   ```

2. **打开应用**
   
   直接用浏览器打开 `index.html` 文件：
   - Windows: 双击 `index.html` 或右键 → 打开方式 → 浏览器
   - Mac: 双击 `index.html`
   - Linux: `xdg-open index.html`

   或使用本地服务器（推荐）：
   ```bash
   # 使用Python内置服务器
   cd frontend-dashboard
   python -m http.server 8000
   # 访问 http://localhost:8000
   ```

   ```bash
   # 或使用Node.js的http-server
   npx http-server frontend-dashboard -p 8000
   # 访问 http://localhost:8000
   ```

### 方法二：从源数据生成

如果需要重新处理数据：

1. **安装Python依赖**
   ```bash
   pip install pandas numpy
   ```

2. **准备数据**
   
   确保项目根目录有 `Full_Data.csv` 文件（NHS COPD数据）

3. **运行数据处理脚本**
   ```bash
   cd frontend-dashboard/scripts
   python build_dashboard_data.py
   ```
   
   这将生成 `frontend-dashboard/data/dashboard-data.js` 文件

4. **运行应用**
   ```bash
   cd ..
   python -m http.server 8000
   ```
   
   在浏览器访问 `http://localhost:8000`

## 📖 使用说明

### 1. 搜索GP诊所

- 在顶部筛选栏输入邮编（例如：`EC1A 1BB`、`SW1A 0AA`、`M1 1AE`）
- 选择搜索半径（5km / 10km / 20km）
- 选择最低评分（全部 / 4★+ / 4.5★+）
- 点击"Apply"应用筛选

### 2. 查看地图和列表

- **地图**：彩色气泡表示GP位置，颜色代表评分等级
  - 绿色：高评分（≥4.5）
  - 蓝色：中评分（≥4.0）
  - 灰色：一般评分（<4.0）
- **侧边栏**：显示最近的3家GP诊所及详细信息
- **点击气泡或列表项**：查看诊所详情

### 3. 联系和导航

- **Call按钮**：直接拨打诊所电话
- **Navigate按钮**：在Google地图中打开导航路线

### 4. 查看健康指标

- **KPI指标条**：显示附近GP总数、平均评分、平均干预率
- **健康摘要图表**：显示区域COPD指标趋势
  - Achievement %：成就率
  - Intervention Coverage：干预覆盖率
  - Annual COPD Review：年度评审率

### 5. 天气建议

右上角显示当前天气和针对COPD患者的健康建议

## 🎨 配色方案

- **主色**：蓝色 `#2563eb`（专业、医疗感）
- **强调色**：浅蓝 `#3b82f6`（交互反馈）
- **成功色**：绿色 `#10b981`（NHS、高质量）
- **警告色**：红色 `#ef4444`（警告、注意）
- **背景色**：浅灰白 `#f5f7fa`（简约舒适）

## 🌐 浏览器支持

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## 📊 数据说明

### 数据来源
- NHS Digital QoF (Quality and Outcomes Framework)
- Practice location data
- COPD indicators (2021-22)

### 关键指标
- **Achievement %**：诊所COPD指标成就率
- **Prevalence %**：COPD患病率
- **Intervention %**：干预覆盖率（COPD008）
- **Review %**：年度评审率（COPD010）
- **PCA Rate**：主要护理评估率
- **Register**：注册患者数
- **List Size**：诊所规模

### 示例邮编
- `EC1A 1BB` - 伦敦中心（Central London）
- `SW1A 0AA` - 威斯敏斯特（Westminster）
- `M1 1AE` - 曼彻斯特（Manchester）

## 🔧 开发说明

### 修改样式
编辑 `frontend-dashboard/assets/css/styles.css`，使用CSS变量快速调整配色：

```css
:root {
  --color-accent: #2563eb;    /* 主色调 */
  --color-bg: #f5f7fa;        /* 背景色 */
  --color-border: #e5e7eb;    /* 边框颜色 */
  /* ... */
}
```

### 修改数据处理逻辑
编辑 `frontend-dashboard/scripts/build_dashboard_data.py`

### 添加新功能
- 主逻辑：`js/main.js`
- 地图功能：`js/map.js`
- 工具函数：`js/utils.js`

## 📝 待办事项

- [ ] 添加移动端响应式优化
- [ ] 接入实时天气API
- [ ] 添加诊所预约功能
- [ ] 支持多语言（英文/中文切换）
- [ ] 添加用户偏好保存
- [ ] 优化大数据量性能

## ⚠️ 免责声明

本项目仅用于学习和演示目的，所有数据均来自公开的NHS数据源。本应用不提供医疗建议，请在实际就医时咨询专业医疗人员。

## 📄 许可证

本项目采用 MIT 许可证。

## 👥 贡献者

- **Tung (momo7077)** - 项目开发与维护

## 📧 联系方式

如有问题或建议，请通过以下方式联系：
- Email: 19913211869@163.com
- GitHub: [@mom7077](https://github.com/mom7077)

---

**最后更新**：2025年10月

**Made with ❤️ for COPD patients**

