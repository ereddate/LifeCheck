# 人生打卡小程序

基于微信云开发的打卡小程序，帮助用户养成好习惯，记录每一个重要时刻。

## 功能特性

- 创建打卡任务（每日/每周/每月）
- 执行打卡并记录打卡历史
- 查看打卡统计和连续打卡天数
- 个人中心展示统计数据
- 云函数处理打卡逻辑
- 云数据库存储数据

## 项目结构

```
.
├── app.js                 # 小程序入口文件
├── app.json               # 小程序配置文件
├── app.wxss               # 全局样式文件
├── project.config.json    # 项目配置文件
├── sitemap.json           # 站点地图配置
├── pages/                 # 页面目录
│   ├── index/             # 首页（打卡列表）
│   ├── detail/            # 打卡详情页
│   ├── add/               # 添加打卡页面
│   └── mine/              # 我的页面
├── cloudfunctions/        # 云函数目录
│   ├── doCheckin/         # 执行打卡云函数
│   ├── getStats/          # 获取统计数据云函数
│   └── getRecords/        # 获取打卡记录云函数
└── images/                # 图片资源目录
    └── tabbar/            # 底部导航栏图标
```

## 云数据库集合结构

### checkin_tasks（打卡任务表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 任务ID |
| title | string | 打卡标题 |
| type | string | 打卡类型（daily/weekly/monthly） |
| description | string | 描述 |
| remindTime | string | 提醒时间 |
| targetDays | number | 目标天数 |
| totalCount | number | 总打卡次数 |
| streakDays | number | 连续打卡天数 |
| lastCheckTime | date | 最后打卡时间 |
| createTime | date | 创建时间 |
| updateTime | date | 更新时间 |

### checkin_records（打卡记录表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 记录ID |
| taskId | string | 任务ID |
| openid | string | 用户openid |
| checkTime | date | 打卡时间 |
| note | string | 备注 |
| createTime | date | 创建时间 |

### checkin_stats（统计数据表）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 统计ID（固定为'user_stats'） |
| totalCheckins | number | 总打卡数 |
| thisMonth | number | 本月打卡数 |
| maxStreak | number | 最长连续天数 |
| streakDays | number | 当前连续天数 |
| updateTime | date | 更新时间 |

## 配置说明

### 1. 修改 app.js

将云开发环境ID替换为你自己的：

```javascript
wx.cloud.init({
  env: 'your-env-id',  // 替换为你的云开发环境ID
  traceUser: true
})
```

### 2. 修改 project.config.json

将appid替换为你自己的小程序appid：

```json
{
  "appid": "your-appid"  // 替换为你的小程序appid
}
```

### 3. 创建云开发环境

1. 在微信开发者工具中，点击"云开发"按钮
2. 创建云开发环境
3. 记录环境ID，填入 app.js 中

### 4. 初始化云数据库

在云开发控制台中创建以下集合：

1. checkin_tasks（打卡任务）
2. checkin_records（打卡记录）
3. checkin_stats（统计数据）

### 5. 部署云函数

在微信开发者工具中：
1. 右键点击 cloudfunctions/doCheckin 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 依次部署其他云函数

### 6. 添加底部导航栏图标

在 images/tabbar/ 目录下添加以下图标文件：

- home.png（首页图标）
- home-active.png（首页选中图标）
- add.png（添加图标）
- add-active.png（添加选中图标）
- mine.png（我的图标）
- mine-active.png（我的选中图标）

图标尺寸建议：81px * 81px

## 使用说明

1. 创建打卡任务：点击底部"添加"标签，填写打卡信息
2. 执行打卡：在首页点击打卡卡片进入详情页，点击"立即打卡"按钮
3. 查看记录：在打卡详情页可以查看历史打卡记录
4. 查看统计：在"我的"页面查看个人统计数据

## 技术栈

- 微信小程序原生开发
- 微信云开发
- 云函数
- 云数据库

## 注意事项

1. 确保已开通微信云开发服务
2. 云函数需要上传并部署后才能使用
3. 数据库集合需要手动创建
4. 底部导航栏图标需要自行添加

## 开发建议

1. 可以根据需要添加更多打卡类型
2. 可以添加打卡提醒功能（需要订阅消息权限）
3. 可以添加打卡分享功能
4. 可以添加成就系统激励用户坚持打卡