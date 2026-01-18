const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { taskId } = event

  try {
    const taskRes = await db.collection('checkin_tasks').doc(taskId).get()
    const task = taskRes.data

    const records = await db.collection('checkin_records')
      .where({
        taskId
      })
      .orderBy('checkTime', 'desc')
      .limit(50)
      .get()

    const recordsList = records.data.map(item => {
      const date = new Date(item.checkTime)
      return {
        _id: item._id,
        day: date.getDate(),
        month: `${date.getMonth() + 1}月`,
        time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        note: item.note || '',
        checkTime: item.checkTime
      }
    })

    return {
      success: true,
      data: {
        task,
        records: recordsList
      }
    }
  } catch (err) {
    console.error('获取打卡记录失败', err)
    return {
      success: false,
      message: '获取打卡记录失败'
    }
  }
}