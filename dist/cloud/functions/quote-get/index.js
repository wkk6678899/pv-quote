// 云函数入口文件
const cloud = require('wx-server-sdk')

// 明确指定云环境 ID
cloud.init({
  env: 'cloud1-d2gi0e7gb6d4289df'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { quoteId } = event
    
    // 从云数据库查询
    const result = await db.collection('quotes')
      .where({
        quoteId: quoteId,
        _openid: wxContext.OPENID
      })
      .get()
    
    if (result.data.length === 0) {
      return {
        code: 404,
        msg: '报价单不存在',
        data: null
      }
    }
    
    return {
      code: 200,
      msg: 'success',
      data: result.data[0]
    }
  } catch (error) {
    return {
      code: 500,
      msg: error.message,
      data: null
    }
  }
}
