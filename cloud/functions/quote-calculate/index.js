// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const params = event.params || {}
    const result = calculateQuote(params)
    
    return {
      code: 200,
      msg: 'success',
      data: result
    }
  } catch (error) {
    return {
      code: 500,
      msg: error.message,
      data: null
    }
  }
}

// 计算报价
function calculateQuote(params) {
  const {
    customerName,
    installLocation,
    customerPhone,
    salesManager,
    salesManagerPhone,
    installHeight,
    installForm,
    layoutMode,
    gridVoltage,
    panelPower,
    panelSize,
    slope1Rows,
    slope1Cols,
    slope2Rows = 0,
    slope2Cols = 0,
    totalPanels,
    installArea,
    installPower,
    steelForm,
    paintType,
    acCable,
    dcCable
  } = params

  // 计算报价明细
  const items = calculateQuoteItems(params)
  
  // 计算总价
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
  
  // 计算发电量预估（安装功率 × 1000）
  const estimatedPower = installPower * 1000
  
  // 生成报价单号
  const quoteId = generateQuoteId()
  
  // 获取当前日期
  const quoteDate = formatDate(new Date())

  return {
    quoteId,
    projectInfo: {
      customerName,
      installLocation,
      customerPhone,
      salesManager,
      salesManagerPhone,
      installHeight,
      installForm,
      layoutMode,
      gridVoltage
    },
    pvSystem: {
      panelPower: parseInt(panelPower),
      panelLength: panelSize.length,
      panelWidth: panelSize.width,
      panelHeight: panelSize.height,
      slope1Rows,
      slope1Cols,
      slope2Rows,
      slope2Cols,
      totalPanels,
      installArea,
      installPower
    },
    steelStructure: {
      form: steelForm,
      paintType
    },
    electrical: {
      acCable,
      dcCable
    },
    items,
    totalAmount,
    estimatedPower,
    quoteDate
  }
}

// 计算报价明细
function calculateQuoteItems(params) {
  const {
    panelPower,
    totalPanels,
    installArea,
    installPower,
    steelForm,
    paintType,
    gridVoltage,
    acCable,
    dcCable
  } = params

  const items = []

  // 01. 光伏组件：单价 = 组件功率 × 0.9
  const panelUnitPrice = parseInt(panelPower) * 0.9
  items.push({
    seq: '01',
    category: '光伏系统',
    name: '光伏组件',
    spec: getPanelSpec(panelPower),
    unit: '块',
    quantity: totalPanels,
    unitPrice: panelUnitPrice,
    amount: totalPanels * panelUnitPrice
  })

  // 02. 逆变器：根据安装功率分段
  const inverterUnitPrice = getInverterPrice(installPower)
  items.push({
    seq: '02',
    category: '光伏系统',
    name: '逆变器',
    spec: getInverterSpec(installPower, gridVoltage),
    unit: '台',
    quantity: 1,
    unitPrice: inverterUnitPrice,
    amount: inverterUnitPrice
  })

  // 03. 配电箱：根据安装功率分段
  const配电箱UnitPrice = get配电箱Price(installPower)
  items.push({
    seq: '03',
    category: '光伏系统',
    name: '配电箱',
    spec: get配电箱Spec(gridVoltage, installPower),
    unit: '台',
    quantity: 1,
    unitPrice: 配电箱UnitPrice,
    amount: 配电箱UnitPrice
  })

  // 04. 交流线缆
  const acCablePrice = 35
  items.push({
    seq: '04',
    category: '光伏系统',
    name: '交流线缆',
    spec: 'YJV-3*6+2*4',
    unit: '米',
    quantity: acCable,
    unitPrice: acCablePrice,
    amount: acCable * acCablePrice,
    remark: `预计${acCable}米，方案确定后多退少补`
  })

  // 05. 直流线缆
  const dcCablePrice = 6
  items.push({
    seq: '05',
    category: '光伏系统',
    name: '直流线缆',
    spec: '光伏专用直流线',
    unit: '米',
    quantity: dcCable,
    unitPrice: dcCablePrice,
    amount: dcCable * dcCablePrice,
    remark: `预计红黑线各${dcCable}米，方案确定后多退少补`
  })

  // 06. 防水结构
  const waterproofPrice = 65
  items.push({
    seq: '06',
    category: '光伏系统',
    name: '防水结构',
    spec: 'M型 锌镁铝支架 +铝合金压块+铝合金盖板',
    unit: 'm²',
    quantity: installArea,
    unitPrice: waterproofPrice,
    amount: installArea * waterproofPrice
  })

  // 07. 辅料及安装
  const accessoryPrice = 45
  items.push({
    seq: '07',
    category: '光伏系统',
    name: '辅料及安装',
    spec: '光伏板和防水结构安装及辅料',
    unit: 'm²',
    quantity: installArea,
    unitPrice: accessoryPrice,
    amount: installArea * accessoryPrice
  })

  // 08. 线路安装
  const installPrice = 15
  items.push({
    seq: '08',
    category: '光伏系统',
    name: '线路安装',
    spec: '走线、逆变器、配电箱安装及辅材',
    unit: 'm²',
    quantity: installArea,
    unitPrice: installPrice,
    amount: installArea * installPrice
  })

  // 09. 施工及材料：根据钢结构形式
  const steelPrice = getSteelPrice(steelForm)
  items.push({
    seq: '09',
    category: '钢结构',
    name: '施工及材料',
    spec: '钢结构施工，材料100*100*2.5立柱，热镀锌钢材，辅料',
    unit: 'm²',
    quantity: installArea,
    unitPrice: steelPrice,
    amount: installArea * steelPrice,
    remark: getSteelRemark(steelForm)
  })

  // 10. 钢结构油漆
  const paintPrice = getPaintPrice(paintType)
  items.push({
    seq: '10',
    category: '钢结构',
    name: '钢结构油漆',
    spec: '油漆及人工',
    unit: 'm²',
    quantity: installArea,
    unitPrice: paintPrice,
    amount: installArea * paintPrice,
    remark: getPaintRemark(paintType)
  })

  // 11. 四可安装调试
  const gridPrice = getGridPrice(gridVoltage)
  items.push({
    seq: '11',
    category: '其他',
    name: '四可安装调试',
    spec: `${gridVoltage}V 电网规约四可设备及安装调试`,
    unit: '台',
    quantity: 1,
    unitPrice: gridPrice,
    amount: gridPrice
  })

  // 12. 运输及上楼
  const transportPrice = 1400
  items.push({
    seq: '12',
    category: '其他',
    name: '运输及上楼',
    spec: '材料运费及吊装费',
    unit: '次',
    quantity: 1,
    unitPrice: transportPrice,
    amount: transportPrice
  })

  // 13. 设计费
  const designPrice = 15
  items.push({
    seq: '13',
    category: '其他',
    name: '设计费',
    spec: '效果图、施工图',
    unit: 'm²',
    quantity: installArea,
    unitPrice: designPrice,
    amount: installArea * designPrice
  })

  // 14. 备案及并网
  const filingPrice = 1000
  items.push({
    seq: '14',
    category: '其他',
    name: '备案及并网',
    spec: '发改委备案及电网并网',
    unit: '次',
    quantity: 1,
    unitPrice: filingPrice,
    amount: filingPrice
  })

  return items
}

// 获取组件规格
function getPanelSpec(power) {
  const specs = {
    '650': '隆基650W 单晶硅 双玻',
    '540': '隆基540W 单晶硅 双玻',
    '345': '隆基345W 单晶硅 双玻'
  }
  return specs[power] || `${power}W 单晶硅 双玻`
}

// 获取逆变器价格（根据安装功率分段）
function getInverterPrice(power) {
  if (power <= 20) return 2800
  if (power <= 30) return 3500
  return 5000
}

// 获取逆变器规格
function getInverterSpec(power, voltage) {
  let kw = 10
  if (power > 20 && power <= 30) kw = 20
  if (power > 30) kw = 30
  return `固德威 ${kw}Kw ${voltage}V`
}

// 获取配电箱价格（根据安装功率分段）
function get配电箱Price(power) {
  if (power <= 20) return 500
  if (power <= 30) return 900
  return 1500
}

// 获取配电箱规格
function get配电箱Spec(voltage, power) {
  let kw = 15
  if (power > 20 && power <= 30) kw = 30
  if (power > 30) kw = 50
  return `${voltage}V ${kw}KWw`
}

// 获取钢结构价格
function getSteelPrice(form) {
  const prices = {
    'flat': 195,      // 平焊
    'overlap': 145,   // 叠焊
    'tile-flat': 110  // 瓦面平铺
  }
  return prices[form] || 195
}

// 获取钢结构备注
function getSteelRemark(form) {
  const remarks = {
    'flat': '平焊',
    'overlap': '叠焊',
    'tile-flat': '瓦面平铺'
  }
  return remarks[form] || '平焊'
}

// 获取油漆价格
function getPaintPrice(type) {
  const prices = {
    'magnetic': 30,      // 磁漆
    'fluorocarbon': 100, // 氟碳漆
    'none': 0            // 不喷漆
  }
  return prices[type] || 0
}

// 获取油漆备注
function getPaintRemark(type) {
  const remarks = {
    'magnetic': '磁漆',
    'fluorocarbon': '氟碳漆',
    'none': '不喷漆'
  }
  return remarks[type] || '不喷漆'
}

// 获取并网价格
function getGridPrice(voltage) {
  return voltage === '380' ? 950 : 500
}

// 生成报价单号
function generateQuoteId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}${random}`.toUpperCase()
}

// 格式化日期
function formatDate(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}/${month}/${day}`
}
