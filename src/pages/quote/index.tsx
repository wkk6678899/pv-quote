import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useLoad } from '@tarojs/taro'
import { Network } from '@/network'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { FileDown, ArrowLeft } from 'lucide-react-taro'
import './index.css'

interface QuoteDetail {
  quoteId: string
  projectInfo: {
    customerName: string
    installLocation: string
    customerPhone: string
    salesManager: string
    salesManagerPhone: string
    installHeight: number
    installForm: string
    layoutMode: string
    gridVoltage: string
  }
  pvSystem: {
    panelPower: number
    panelLength: number
    panelWidth: number
    panelHeight: number
    slope1Rows: number
    slope1Cols: number
    slope2Rows: number
    slope2Cols: number
    totalPanels: number
    installArea: number
    installPower: number
  }
  steelStructure: {
    form: string
    paintType: string
  }
  electrical: {
    acCable: number
    dcCable: number
  }
  items: Array<{
    seq: string
    category: string
    name: string
    spec: string
    unit: string
    quantity: number
    unitPrice: number
    amount: number
    remark?: string
  }>
  totalAmount: number
  estimatedPower: number
  quoteDate: string
}

const QuotePage = () => {
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const quoteRef = useRef<HTMLDivElement>(null)

  useLoad(() => {
    const quoteId = router.params.id
    if (quoteId) {
      fetchQuoteDetail(quoteId)
    }
  })

  useEffect(() => {
    const quoteId = router.params.id
    if (quoteId) {
      fetchQuoteDetail(quoteId)
    }
  }, [router.params.id])

  const fetchQuoteDetail = async (quoteId: string) => {
    setLoading(true)
    try {
      // 使用云开发调用云函数
      const res = await Taro.cloud.callFunction({
        name: 'quote-get',
        data: {
          quoteId: quoteId
        }
      })
      console.log('云函数响应:', res.result)
      const result = res.result as { code: number; msg: string; data: QuoteDetail } | null
      if (result && result.code === 200) {
        setQuote(result.data)
      }
    } catch (error) {
      console.error('获取报价单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    if (!quote) return
    setDownloading(true)
    try {
      const res = await Network.request({
        url: `/api/quote/export/excel/${quote.quoteId}`,
        method: 'GET',
      })
      console.log('Excel导出响应:', res.data)
      if (res.data && res.statusCode === 200) {
        const data = res.data as { fileUrl: string; fileName: string }
        // 下载文件
        if (typeof window !== 'undefined') {
          window.open(data.fileUrl, '_blank')
        }
      }
    } catch (error) {
      console.error('导出Excel失败:', error)
    } finally {
      setDownloading(false)
    }
  }

  const formatMoney = (value: number) => {
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  if (loading) {
    return (
      <ScrollView className="bg-slate-50 min-h-screen">
        <View className="p-4">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </View>
      </ScrollView>
    )
  }

  if (!quote) {
    return (
      <ScrollView className="bg-slate-50 min-h-screen">
        <View className="p-4 flex flex-col items-center justify-center min-h-screen">
          <Text className="block text-slate-500">报价单不存在或已过期</Text>
          <Button onClick={() => Taro.navigateBack()} className="mt-4">
            返回
          </Button>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView className="bg-slate-50 min-h-screen">
      <View ref={quoteRef} className="p-4 pb-24">
        {/* 标题 */}
        <Card className="mb-4 bg-gradient-to-r from-emerald-500 to-blue-500 border-0">
          <CardContent className="py-4">
            <Text className="block text-center text-white text-lg font-bold">
              分布式光伏电站报价单
            </Text>
            <Text className="block text-center text-white text-opacity-80 text-xs mt-1">
              报价日期：{quote.quoteDate}
            </Text>
          </CardContent>
        </Card>

        {/* 客户信息和服务方信息 */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <View className="flex flex-row">
              <View className="flex-1">
                <Text className="block text-sm font-semibold text-slate-700 mb-2">客户信息</Text>
                <View className="gap-1">
                  <Text className="block text-xs text-slate-600">
                    联 系 人：{quote.projectInfo.customerName}
                  </Text>
                  <Text className="block text-xs text-slate-600">
                    客户电话：{quote.projectInfo.customerPhone}
                  </Text>
                  <Text className="block text-xs text-slate-600">
                    项目地址：{quote.projectInfo.installLocation}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-semibold text-slate-700 mb-2">服务方信息</Text>
                <View className="gap-1">
                  <Text className="block text-xs text-slate-600">
                    联 系 人：{quote.projectInfo.salesManager}
                  </Text>
                  <Text className="block text-xs text-slate-600">
                    联系电话：{quote.projectInfo.salesManagerPhone}
                  </Text>
                </View>
              </View>
            </View>
            <Separator className="my-3" />
            <View className="flex flex-row justify-between">
              <View>
                <Text className="block text-xs text-slate-500">
                  安装面积：{quote.pvSystem.installArea}㎡
                </Text>
                <Text className="block text-xs text-slate-500">
                  安装功率：{quote.pvSystem.installPower}Kw
                </Text>
              </View>
              <View>
                <Text className="block text-xs text-slate-500">
                  预计年发电量：
                </Text>
                <Text className="block text-xs text-emerald-600 font-medium">
                  {quote.estimatedPower}度左右
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 报价栏 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">
              以下为贵方询价产品明细，请详阅
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 表头 */}
            <View className="flex flex-row bg-slate-100 rounded-t-lg p-2">
              <Text className="block text-xs text-slate-600 font-medium w-8">序号</Text>
              <Text className="block text-xs text-slate-600 font-medium flex-1">产品名称</Text>
              <Text className="block text-xs text-slate-600 font-medium w-20 text-center">金额</Text>
              <Text className="block text-xs text-slate-600 font-medium flex-1 text-center">备注</Text>
            </View>

            {/* 列表 */}
            {quote.items.map((item, idx) => (
              <View key={idx} className="flex flex-row p-2 border-b border-slate-100">
                <Text className="block text-xs text-slate-700 w-6">{item.seq}</Text>
                <Text className="block text-xs text-slate-700 font-medium flex-1">{item.name}</Text>
                <Text className="block text-xs text-slate-700 font-medium w-16 text-right">
                  ¥{formatMoney(item.amount)}
                </Text>
                <Text className="block text-xs text-slate-500 flex-1 text-left ml-2">{item.remark || ''}</Text>
              </View>
            ))}

            {/* 总计 */}
            <View className="flex flex-row p-3 bg-emerald-50 rounded-b-lg mt-2">
              <Text className="block text-sm text-slate-700 font-semibold flex-1">价格总计</Text>
              <Text className="block text-sm text-emerald-600 font-bold text-right">
                ¥{formatMoney(quote.totalAmount)}
              </Text>
              <Text className="block text-xs text-slate-500 ml-2">不含税</Text>
            </View>
          </CardContent>
        </Card>

        {/* 报价说明 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">报价说明</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            <Text className="block text-xs text-slate-500">此报价不含税</Text>
            <Text className="block text-xs text-slate-500">（1）报价有效期：自报价之日起10天。</Text>
            <Text className="block text-xs text-slate-500">（2）结算方式：预付30%的定金，货到之日付30%，安装完成之日付30%，电站并网成功起3日内付清10%尾款。</Text>
            <Text className="block text-xs text-slate-500">（3）交货时间：与合同签订后10个工作日内。</Text>
            <Text className="block text-xs text-slate-500">（4）付款方式：一般产品为30%预付款，储能及特殊型号产品预付款方式请垂询。</Text>
          </CardContent>
        </Card>
      </View>

      {/* 底部操作栏 */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e2e8f0',
          zIndex: 100,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            onClick={() => Taro.navigateBack()}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft size={16} color="#64748b" className="mr-1" />
            <Text className="text-sm">返回</Text>
          </Button>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            onClick={handleDownloadExcel}
            disabled={downloading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <FileDown size={16} color="#fff" className="mr-1" />
            <Text className="text-sm">下载Excel</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}

export default QuotePage
