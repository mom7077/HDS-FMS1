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

