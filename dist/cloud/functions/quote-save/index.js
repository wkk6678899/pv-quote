// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const quoteData = event.quoteData
    
    // 保存到云数据库
    const result = await db.collection('quotes').add({
      data: {
        ...quoteData,
        _openid: wxContext.OPENID,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })
    
    return {
      code: 200,
      msg: 'success',
      data: {
        _id: result._id,
        quoteId: quoteData.quoteId
      }
    }
  } catch (error) {
    return {
      code: 500,
      msg: error.message,
      data: null
    }
  }
}
