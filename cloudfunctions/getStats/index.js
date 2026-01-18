const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const result = await db.collection('checkin_stats').doc('user_stats').get()

    if (!result.data) {
      return {
        success: true,
        data: {
          totalCheckins: 0,
          thisMonth: 0,
          maxStreak: 0,
          streakDays: 0
        }
      }
    }

    return {
      success: true,
      data: result.data
    }
  } catch (err) {
    console.error('获取统计失败', err)
    return {
      success: false,
      message: '获取统计失败'
    }
  }
}