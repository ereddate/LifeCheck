const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { taskId } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const taskRes = await db.collection('checkin_tasks').doc(taskId).get()
    const task = taskRes.data

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastCheckTime = new Date(task.lastCheckTime)

    if (lastCheckTime >= today) {
      return {
        success: false,
        message: '今日已打卡'
      }
    }

    const transaction = await db.startTransaction()

    try {
      await transaction.collection('checkin_records').add({
        data: {
          taskId,
          openid,
          checkTime: db.serverDate(),
          note: '',
          createTime: db.serverDate()
        }
      })

      const newStreakDays = await calculateStreakDays(transaction, taskId, openid)

      await transaction.collection('checkin_tasks').doc(taskId).update({
        data: {
          totalCount: _.inc(1),
          streakDays: newStreakDays,
          lastCheckTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })

      await transaction.commit()

      await updateUserStats(openid)

      return {
        success: true,
        message: '打卡成功'
      }
    } catch (e) {
      await transaction.rollback()
      throw e
    }
  } catch (err) {
    console.error('打卡失败', err)
    return {
      success: false,
      message: '打卡失败'
    }
  }
}

async function calculateStreakDays(transaction, taskId, openid) {
  const records = await transaction.collection('checkin_records')
    .where({
      taskId,
      openid
    })
    .orderBy('checkTime', 'desc')
    .limit(365)
    .get()

  if (records.data.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streakDays = 0
  let currentDate = today

  for (const record of records.data) {
    const checkDate = new Date(record.checkTime)
    checkDate.setHours(0, 0, 0, 0)

    const diffDays = Math.floor((currentDate - checkDate) / (1000 * 60 * 60 * 24))

    if (diffDays === 0 || diffDays === 1) {
      streakDays++
      currentDate = checkDate
    } else if (diffDays > 1) {
      break
    }
  }

  return streakDays
}

async function updateUserStats(openid) {
  const statsRes = await db.collection('checkin_stats').doc('user_stats').get()

  const totalCheckins = await db.collection('checkin_records').count()

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisMonthCheckins = await db.collection('checkin_records')
    .where({
      checkTime: _.gte(monthStart)
    })
    .count()

  const tasks = await db.collection('checkin_tasks').get()
  let maxStreak = 0
  tasks.data.forEach(task => {
    if (task.streakDays > maxStreak) {
      maxStreak = task.streakDays
    }
  })

  const statsData = {
    totalCheckins: totalCheckins.total,
    thisMonth: thisMonthCheckins.total,
    maxStreak,
    updateTime: db.serverDate()
  }

  if (statsRes.data) {
    await db.collection('checkin_stats').doc('user_stats').update({
      data: statsData
    })
  } else {
    await db.collection('checkin_stats').add({
      data: {
        _id: 'user_stats',
        ...statsData,
        streakDays: 0,
        createTime: db.serverDate()
      }
    })
  }
}