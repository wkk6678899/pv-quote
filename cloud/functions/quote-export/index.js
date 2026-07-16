// 云函数入口文件
const cloud = require('wx-server-sdk')
const ExcelJS = require('exceljs')

// 明确指定云环境 ID
cloud.init({
  env: 'cloud1-d2gi0e7gb6d4289df'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { quoteId } = event
    
    // 从数据库获取报价单（用 quoteId 字段查询，不是 _id）
    const db = cloud.database()
    const quoteResult = await db.collection('quotes').where({
      quoteId: quoteId
    }).get()
    
    if (!quoteResult.data || quoteResult.data.length === 0) {
      return {
        code: 404,
        msg: '报价单不存在',
        data: null
      }
    }
    
    const quote = quoteResult.data[0]
    
    // 生成 Excel
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('报价单')
    
    // 设置列宽
    worksheet.columns = [
      { width: 8 },   // 序号
      { width: 12 },  // 类别
      { width: 20 },  // 名称
      { width: 25 },  // 规格
      { width: 8 },   // 单位
      { width: 10 },  // 数量
      { width: 12 },  // 单价
      { width: 15 },  // 金额
      { width: 20 }   // 备注
    ]
    
    // 标题行
    worksheet.mergeCells('A1:I1')
    const titleCell = worksheet.getCell('A1')
    titleCell.value = '分布式光伏电站报价单'
    titleCell.font = { bold: true, size: 16 }
    titleCell.alignment = { horizontal: 'center' }
    
    // 项目信息
    worksheet.mergeCells('A2:I2')
    worksheet.getCell('A2').value = `报价单号：${quote.quoteId}    报价日期：${quote.quoteDate}`
    worksheet.getCell('A2').font = { size: 10 }
    
    worksheet.mergeCells('A3:I3')
    worksheet.getCell('A3').value = `客户：${quote.projectInfo.customerName}    电话：${quote.projectInfo.customerPhone}    地址：${quote.projectInfo.installLocation}`
    worksheet.getCell('A3').font = { size: 10 }
    
    // 空行
    worksheet.addRow([])
    
    // 表头
    const headerRow = worksheet.addRow(['序号', '类别', '名称', '规格', '单位', '数量', '单价（元）', '金额（元）', '备注'])
    headerRow.font = { bold: true }
    headerRow.alignment = { horizontal: 'center' }
    headerRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    
    // 数据行
    quote.items.forEach(item => {
      const row = worksheet.addRow([
        item.seq,
        item.category,
        item.name,
        item.spec,
        item.unit,
        item.quantity,
        item.unitPrice,
        item.amount,
        item.remark || ''
      ])
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })
    
    // 合计行
    const totalRow = worksheet.addRow(['', '', '', '', '', '', '合计', quote.totalAmount, ''])
    totalRow.font = { bold: true }
    totalRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    
    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer()
    
    // 上传到云存储
    const fileName = `quotes/${quote.quoteId}.xlsx`
    const uploadResult = await cloud.uploadFile({
      cloudPath: fileName,
      fileContent: buffer
    })
    
    return {
      code: 200,
      msg: 'success',
      data: {
        fileID: uploadResult.fileID,
        fileName: `报价单_${quote.quoteId}.xlsx`
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
