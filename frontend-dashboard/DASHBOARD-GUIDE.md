# COPD Navigator Dashboard 使用指南

## 📊 双界面架构

本项目现在支持两个不同的仪表板界面：

### 1️⃣ Patient Dashboard（患者界面）
**文件**：`patient.html`  
**访问URL**：`http://localhost:8000/patient.html`

**功能**：
- 🗺️ 根据邮编查找附近GP诊所
- 📍 交互式地图显示诊所位置
- ⭐ 按距离、评分筛选诊所
- 📊 查看个人健康指标趋势
- 🌤️ 天气和健康建议
- 📞 一键拨打电话/导航

**目标用户**：COPD患者及其家属

---

### 2️⃣ Manager Dashboard（管理员界面）
**文件**：`manager.html`  
**访问URL**：`http://localhost:8000/manager.html`

**功能**：
- 📈 全国GP诊所性能监控
- 🎯 按地区/ICB/性能筛选
- 📊 COPD质量指标分析
- 🏆 高性能诊所排名
- 📉 干预覆盖率和评审合规性趋势
- 🗺️ 全国范围地图可视化

**目标用户**：NHS管理人员、区域协调员、质量改进团队

---

## 🔄 页面跳转流程

```
index.html (自动跳转)
    ↓
role-select.html (角色选择页面)
    ↓
   ├─→ patient.html (患者仪表板)
   └─→ manager.html (管理员仪表板)
```

### 页面间导航

- **入口页面** (`index.html`)：自动重定向到角色选择页
- **角色选择** (`role-select.html`)：提供两个漂亮的卡片选择界面
- **Patient → Manager**：右上角"Manager View →"链接
- **Manager → Patient**：右上角"← Patient View"链接
- **返回选择页**：Manager页面有"Switch Role"链接

---

## 🚀 快速开始

### 运行应用

```bash
cd frontend-dashboard
python -m http.server 8000
```

### 访问地址

1. **主入口**：`http://localhost:8000/` 或 `http://localhost:8000/index.html`
   - 自动跳转到角色选择页

2. **角色选择页**：`http://localhost:8000/role-select.html`
   - 美观的卡片式选择界面

3. **患者界面**：`http://localhost:8000/patient.html`
   - 直接访问患者仪表板

4. **管理员界面**：`http://localhost:8000/manager.html`
   - 直接访问管理员仪表板

---

## 📁 文件结构

```
frontend-dashboard/
├── index.html              # 跳转页面（自动重定向）
├── role-select.html        # 角色选择页面 ⭐ 新增
├── patient.html            # 患者仪表板 ⭐ 重命名自 index.html
├── manager.html            # 管理员仪表板 ⭐ 新增
├── assets/
│   └── css/
│       └── styles.css      # 共享样式
├── js/
│   ├── main.js            # 患者页面主逻辑
│   ├── map.js             # 地图模块（共享）
│   └── utils.js           # 工具函数（共享）
└── data/
    └── dashboard-data.js   # 数据文件（共享）
```

---

## 🎨 设计差异

### Patient Dashboard
- 🎯 以用户为中心的设计
- 🏠 突出"离我最近"的信息
- 💙 温暖友好的色调
- 📱 简化的交互流程

### Manager Dashboard
- 📊 数据密集型布局
- 🌍 全局视图和趋势分析
- 📈 关注性能指标和合规性
- 🔍 更多筛选和过滤选项

---

## 🔧 进一步开发建议

### Manager Dashboard 待实现功能

1. **高级分析**
   - 按时间段对比（月度/季度/年度）
   - 地区性能排名
   - 趋势预测

2. **导出功能**
   - Excel报表导出
   - PDF分析报告
   - 数据可视化截图

3. **警报系统**
   - 低性能诊所标记
   - 合规性警告
   - 异常值检测

4. **协作功能**
   - 添加备注和标记
   - 改进行动计划
   - 团队共享视图

### 共享功能优化

1. **数据加载优化**
   - 按需加载数据
   - 缓存机制
   - 懒加载图表

2. **样式分离**
   - `common.css` - 共享样式
   - `patient.css` - 患者专用
   - `manager.css` - 管理员专用

3. **代码模块化**
   - 将 `main.js` 拆分为模块
   - 创建 `manager-main.js` 独立逻辑
   - 提取共享组件

---

## 📝 URL 参数扩展（可选）

如果未来需要更细粒度的控制，可以添加URL参数：

```
patient.html?postcode=EC1A1BB       # 预设邮编
manager.html?region=london          # 预设地区
manager.html?view=performance       # 切换视图模式
```

---

## 🔐 权限控制（未来）

建议添加简单的访问控制：

1. **Session Storage检查**
   ```javascript
   if (!sessionStorage.getItem('managerAuth')) {
     window.location.href = 'role-select.html';
   }
   ```

2. **URL Token验证**
   ```
   manager.html?token=xxx
   ```

3. **服务器端认证**
   - 集成NHS SSO
   - 基于角色的访问控制（RBAC）

---

## 📞 支持

如有问题，请联系 Group4 团队成员。

**最后更新**：2025年10月

