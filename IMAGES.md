# 图片资源说明

## 底部导航栏图标

本小程序需要在 `images/tabbar/` 目录下添加以下图标文件：

### 首页图标
- `home.png` - 首页未选中状态
- `home-active.png` - 首页选中状态

### 添加图标
- `add.png` - 添加未选中状态
- `add-active.png` - 添加选中状态

### 我的图标
- `mine.png` - 我的未选中状态
- `mine-active.png` - 我的选中状态

## 图标规格

- **尺寸**：81px × 81px
- **格式**：PNG
- **背景**：透明
- **颜色**：
  - 未选中：灰色 (#999999)
  - 选中：绿色 (#07C160)

## 获取图标的方式

### 方式一：使用在线图标库
推荐使用以下网站获取图标：
- iconfont（阿里巴巴矢量图标库）：https://www.iconfont.cn/
- Flaticon：https://www.flaticon.com/
- IconFinder：https://www.iconfinder.com/

### 方式二：使用设计工具
可以使用以下工具制作图标：
- Figma
- Sketch
- Adobe XD
- Photoshop

### 方式三：使用示例图标

如果你暂时没有图标，可以先使用纯色方块代替，或者暂时注释掉 app.json 中的 iconPath 配置。

## 图标设计建议

### 首页图标
建议使用：
- 房子图标 🏠
- 列表图标 📋
- 日历图标 📅

### 添加图标
建议使用：
- 加号图标 ➕
- 笔图标 ✏️
- 星星图标 ⭐

### 我的图标
建议使用：
- 用户图标 👤
- 个人中心图标 👤
- 设置图标 ⚙️

## 注意事项

1. 图标文件名必须与 app.json 中配置的文件名完全一致
2. 图标尺寸必须为 81px × 81px，否则可能显示异常
3. 建议使用 PNG 格式，支持透明背景
4. 图标颜色要清晰可见，建议使用高对比度的颜色
5. 如果图标显示异常，请检查文件路径和文件名是否正确

## 临时解决方案

如果暂时没有图标，可以修改 app.json，暂时移除 iconPath 和 selectedIconPath 配置：

```json
{
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#07C160",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "打卡"
      },
      {
        "pagePath": "pages/add/add",
        "text": "添加"
      },
      {
        "pagePath": "pages/mine/mine",
        "text": "我的"
      }
    ]
  }
}
```

这样底部导航栏将只显示文字，不显示图标。