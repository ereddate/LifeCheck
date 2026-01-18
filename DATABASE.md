# 云数据库初始化说明

## 集合创建步骤

### 1. checkin_tasks 集合

在云开发控制台 -> 数据库 -> 创建集合，输入集合名称：`checkin_tasks`

**权限设置**：所有用户可读，仅创建者可写

**索引建议**：
- 字段：createTime，类型：降序

### 2. checkin_records 集合

在云开发控制台 -> 数据库 -> 创建集合，输入集合名称：`checkin_records`

**权限设置**：所有用户可读，仅创建者可写

**索引建议**：
- 字段：taskId，类型：普通索引
- 字段：checkTime，类型：降序

### 3. checkin_stats 集合

在云开发控制台 -> 数据库 -> 创建集合，输入集合名称：`checkin_stats`

**权限设置**：所有用户可读，仅创建者可写

**初始数据**：
```json
{
  "_id": "user_stats",
  "totalCheckins": 0,
  "thisMonth": 0,
  "maxStreak": 0,
  "streakDays": 0,
  "updateTime": {
    "$date": {
      "$numberLong": "0"
    }
  },
  "createTime": {
    "$date": {
      "$numberLong": "0"
    }
  }
}
```

## 权限说明

为了安全起见，建议设置以下权限：

### checkin_tasks
- 读权限：所有用户可读
- 写权限：仅创建者可写

### checkin_records
- 读权限：所有用户可读
- 写权限：仅创建者可写

### checkin_stats
- 读权限：所有用户可读
- 写权限：仅创建者可写

## 数据库安全规则

如果需要更细粒度的权限控制，可以在云开发控制台设置数据库安全规则：

```json
{
  "read": "auth != null",
  "write": "auth != null"
}
```

## 测试数据

可以手动添加一些测试数据来验证功能：

### 测试打卡任务
```json
{
  "title": "早起打卡",
  "type": "daily",
  "description": "每天早上7点前起床",
  "remindTime": "07:00",
  "targetDays": 30,
  "totalCount": 0,
  "streakDays": 0,
  "lastCheckTime": null,
  "createTime": {
    "$date": {
      "$numberLong": "1700000000000"
    }
  },
  "updateTime": {
    "$date": {
      "$numberLong": "1700000000000"
    }
  }
}
```

## 注意事项

1. 集合名称必须与代码中的名称完全一致
2. 权限设置要合理，避免数据泄露
3. 建议在生产环境中设置更严格的安全规则
4. 定期备份数据库数据