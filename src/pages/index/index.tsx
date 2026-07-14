import { useState, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { User, Phone, Sun, Settings, Cable } from 'lucide-react-taro'
import './index.css'

// 项目信息数据类型
interface ProjectInfo {
  // 项目信息
  customerName: string
  installLocation: string
  customerPhone: string
  salesManager: string
  salesManagerPhone: string
  installHeight: number
  installForm: string
  layoutMode: string
  gridVoltage: string
  // 光伏系统
  panelPower: string
  slope1Rows: number
  slope1Cols: number
  slope2Rows: number
  slope2Cols: number
  // 钢结构
  steelForm: string
  paintType: string
  // 电气系统
  acCable: number
  dcCable: number
}

// 下拉选项
const INSTALL_FORM_OPTIONS = [
  { value: 'steel-single', label: '钢结构-单坡' },
  { value: 'steel-hip', label: '钢结构-人字坡' },
  { value: 'tile', label: '瓦面安装' },
]

const LAYOUT_MODE_OPTIONS = [
  { value: 'vertical', label: '竖向排布' },
  { value: 'horizontal', label: '横向排布' },
]

const GRID_VOLTAGE_OPTIONS = [
  { value: '220', label: '220V' },
  { value: '380', label: '380V' },
]

const PANEL_POWER_OPTIONS = [
  { value: '345', label: '345W' },
  { value: '540', label: '540W' },
  { value: '650', label: '650W' },
]

const STEEL_FORM_OPTIONS = [
  { value: 'flat', label: '平焊' },
  { value: 'overlap', label: '叠焊' },
  { value: 'tile-flat', label: '瓦面平铺' },
]

const PAINT_TYPE_OPTIONS = [
  { value: 'none', label: '不喷漆' },
  { value: 'magnetic', label: '磁漆' },
  { value: 'fluorocarbon', label: '氟碳漆' },
]

// 组件尺寸映射
const PANEL_SIZE_MAP: Record<string, { length: number; width: number; height: number }> = {
  '345': { length: 1689, width: 996, height: 35 },
  '540': { length: 2279, width: 1134, height: 35 },
  '650': { length: 2382, width: 1134, height: 30 },
}

const IndexPage = () => {

  const [form, setForm] = useState<ProjectInfo>({
    customerName: '',
    installLocation: '',
    customerPhone: '',
    salesManager: '',
    salesManagerPhone: '',
    installHeight: 0,
    installForm: 'steel-double',
    layoutMode: 'vertical',
    gridVoltage: '380',
    panelPower: '650',
    slope1Rows: 0,
    slope1Cols: 0,
    slope2Rows: 0,
    slope2Cols: 0,
    steelForm: 'overlap',
    paintType: 'magnetic',
    acCable: 0,
    dcCable: 0,
  })

  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useLoad(() => {
    console.log('光伏报价表单页面加载完成')
  })

  // 判断是否显示2坡安装数量
  const showSlope2 = useMemo(() => {
    return form.installForm === 'steel-double' || form.installForm === 'steel-hip'
  }, [form.installForm])

  // 自动计算组件尺寸
  const panelSize = useMemo(() => {
    return PANEL_SIZE_MAP[form.panelPower] || PANEL_SIZE_MAP['650']
  }, [form.panelPower])

  // 自动计算总安装数量
  const totalPanels = useMemo(() => {
    const slope1 = form.slope1Rows * form.slope1Cols
    const slope2 = showSlope2 ? form.slope2Rows * form.slope2Cols : 0
    return slope1 + slope2
  }, [form.slope1Rows, form.slope1Cols, form.slope2Rows, form.slope2Cols, showSlope2])

  // 自动计算安装面积
  const installArea = useMemo(() => {
    return (panelSize.length * panelSize.width * totalPanels) / 1000000
  }, [panelSize, totalPanels])

  // 自动计算安装功率
  const installPower = useMemo(() => {
    return (totalPanels * Number(form.panelPower)) / 1000
  }, [totalPanels, form.panelPower])

  // 表单验证
  const validateForm = (): string[] => {
    const errs: string[] = []
    if (!form.customerName.trim()) errs.push('客户姓名不能为空')
    if (!form.installLocation.trim()) errs.push('安装地点不能为空')
    if (!form.customerPhone.trim()) errs.push('客户电话不能为空')
    if (!form.salesManager.trim()) errs.push('销售经理不能为空')
    if (!form.salesManagerPhone.trim()) errs.push('销售经理电话不能为空')
    if (form.installHeight <= 0) errs.push('安装高度必须大于0')
    if (form.slope1Rows <= 0) errs.push('1坡安装数量-行必须大于0')
    if (form.slope1Cols <= 0) errs.push('1坡安装数量-列必须大于0')
    if (showSlope2 && form.slope2Rows <= 0) errs.push('2坡安装数量-行必须大于0')
    if (showSlope2 && form.slope2Cols <= 0) errs.push('2坡安装数量-列必须大于0')
    if (form.acCable <= 0) errs.push('交流线长度必须大于0')
    if (form.dcCable <= 0) errs.push('直流线长度必须大于0')
    return errs
  }

  // 生成报价单
  const handleGenerateQuote = async () => {
    const errs = validateForm()
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    setLoading(true)

    try {
      const requestData = {
        ...form,
        panelSize,
        totalPanels,
        installArea: Math.round(installArea * 100) / 100,
        installPower: Math.round(installPower * 100) / 100,
      }
      console.log('请求参数:', requestData)

      // 使用云开发调用云函数
      const res = await Taro.cloud.callFunction({
        name: 'quote-calculate',
        data: {
          params: requestData
        }
      })
      console.log('云函数响应:', res.result)

      const result = res.result as { code: number; msg: string; data: any } | null
      if (result && result.code === 200) {
        const quoteData = result.data
        
        // 保存报价单到云数据库
        const saveRes = await Taro.cloud.callFunction({
          name: 'quote-save',
          data: {
            quoteData: quoteData
          }
        })
        console.log('保存响应:', saveRes.result)

        const saveResult = saveRes.result as { code: number; msg: string; data: any } | null
        if (saveResult && saveResult.code === 200) {
          // 跳转到报价单页面
          const quoteId = quoteData.quoteId
          Taro.navigateTo({ url: `/pages/quote/index?id=${quoteId}` })
        } else {
          console.error('保存报价单失败:', saveRes.result)
          setErrors(['保存报价单失败，请重试'])
        }
      } else {
        console.error('生成报价单失败:', res.result)
        setErrors(['生成报价单失败，请重试'])
      }
    } catch (error) {
      console.error('请求失败:', error)
      setErrors(['网络请求失败，请重试'])
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof ProjectInfo, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const getLabel = (options: { value: string; label: string }[], value: string) => {
    return options.find(o => o.value === value)?.label || value
  }

  return (
    <ScrollView className="bg-slate-50 min-h-screen">
      <View className="p-4 pb-24">
        {/* 错误提示 */}
        {errors.length > 0 && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="py-3">
              <Text className="block text-sm text-red-600 font-medium mb-1">请修正以下问题：</Text>
              {errors.map((err, idx) => (
                <Text key={idx} className="block text-xs text-red-500">• {err}</Text>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 项目信息 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-700 flex flex-row items-center gap-2">
              <User size={18} color="#10b981" />
              <Text className="block">项目信息</Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-1">
              <Text className="block text-sm text-slate-500">客户姓名</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  value={form.customerName}
                  placeholder="请输入客户姓名"
                  onInput={(e) => updateField('customerName', e.detail.value)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">安装地点</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  value={form.installLocation}
                  placeholder="请输入安装地点"
                  onInput={(e) => updateField('installLocation', e.detail.value)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            <View className="gap-1">
              <View className="flex flex-row items-center gap-1">
                <Phone size={14} color="#64748b" />
                <Text className="block text-sm text-slate-500">客户电话</Text>
              </View>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  type="number"
                  value={form.customerPhone ? String(form.customerPhone) : ''}
                  placeholder="请输入客户电话"
                  onInput={(e) => updateField('customerPhone', e.detail.value)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            <Separator />

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">销售经理</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  value={form.salesManager}
                  placeholder="请输入销售经理姓名"
                  onInput={(e) => updateField('salesManager', e.detail.value)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">销售经理电话</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  type="number"
                  value={form.salesManagerPhone ? String(form.salesManagerPhone) : ''}
                  placeholder="请输入销售经理电话"
                  onInput={(e) => updateField('salesManagerPhone', e.detail.value)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            <Separator />

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">安装高度 (m)</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  type="number"
                  value={form.installHeight ? String(form.installHeight) : ''}
                  placeholder="请输入安装高度"
                  onInput={(e) => updateField('installHeight', Number(e.detail.value) || 0)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">安装形式</Text>
              <Select value={form.installForm} onValueChange={(v) => updateField('installForm', v)}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="选择安装形式">
                    {getLabel(INSTALL_FORM_OPTIONS, form.installForm)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {INSTALL_FORM_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">排布方式</Text>
              <Select value={form.layoutMode} onValueChange={(v) => updateField('layoutMode', v)}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="选择排布方式">
                    {getLabel(LAYOUT_MODE_OPTIONS, form.layoutMode)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_MODE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">并网电压 (V)</Text>
              <Select value={form.gridVoltage} onValueChange={(v) => updateField('gridVoltage', v)}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="选择并网电压">
                    {getLabel(GRID_VOLTAGE_OPTIONS, form.gridVoltage)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GRID_VOLTAGE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>
          </CardContent>
        </Card>

        {/* 光伏系统 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-700 flex flex-row items-center gap-2">
              <Sun size={18} color="#f59e0b" />
              <Text className="block">光伏系统</Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-1">
              <Text className="block text-sm text-slate-500">组件功率 (W)</Text>
              <Select value={form.panelPower} onValueChange={(v) => updateField('panelPower', v)}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="选择组件功率">
                    {getLabel(PANEL_POWER_OPTIONS, form.panelPower)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PANEL_POWER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>

            <Separator />

            {/* 自动计算的组件尺寸 */}
            <View className="bg-slate-50 rounded-lg p-3 gap-2">
              <Text className="block text-xs text-slate-400 mb-1">组件尺寸（自动计算）</Text>
              <View className="flex flex-row justify-between">
                <Text className="block text-sm text-slate-500">长</Text>
                <Text className="block text-sm text-slate-700 font-medium">{panelSize.length} mm</Text>
              </View>
              <View className="flex flex-row justify-between">
                <Text className="block text-sm text-slate-500">宽</Text>
                <Text className="block text-sm text-slate-700 font-medium">{panelSize.width} mm</Text>
              </View>
              <View className="flex flex-row justify-between">
                <Text className="block text-sm text-slate-500">高</Text>
                <Text className="block text-sm text-slate-700 font-medium">{panelSize.height} mm</Text>
              </View>
            </View>

            <Separator />

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">1坡安装数量 - 行 (行)</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  type="number"
                  value={form.slope1Rows ? String(form.slope1Rows) : ''}
                  placeholder="请输入行数"
                  onInput={(e) => updateField('slope1Rows', Number(e.detail.value) || 0)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">1坡安装数量 - 列 (列)</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  type="number"
                  value={form.slope1Cols ? String(form.slope1Cols) : ''}
                  placeholder="请输入列数"
                  onInput={(e) => updateField('slope1Cols', Number(e.detail.value) || 0)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            {/* 条件显示：2坡安装数量 */}
            {showSlope2 && (
              <>
                <Separator />
                <View className="gap-1">
                  <Text className="block text-sm text-slate-500">2坡安装数量 - 行 (行)</Text>
                  <View className="bg-slate-100 rounded-lg px-3 py-2">
                    <Input
                      type="number"
                      value={form.slope2Rows ? String(form.slope2Rows) : ''}
                      placeholder="请输入行数"
                      onInput={(e) => updateField('slope2Rows', Number(e.detail.value) || 0)}
                      className="w-full bg-transparent"
                    />
                  </View>
                </View>

                <View className="gap-1">
                  <Text className="block text-sm text-slate-500">2坡安装数量 - 列 (列)</Text>
                  <View className="bg-slate-100 rounded-lg px-3 py-2">
                    <Input
                      type="number"
                      value={form.slope2Cols ? String(form.slope2Cols) : ''}
                      placeholder="请输入列数"
                      onInput={(e) => updateField('slope2Cols', Number(e.detail.value) || 0)}
                      className="w-full bg-transparent"
                    />
                  </View>
                </View>
              </>
            )}

            <Separator />

            {/* 自动计算的汇总数据 */}
            <View className="bg-emerald-50 rounded-lg p-3 gap-2">
              <Text className="block text-xs text-emerald-600 mb-1">汇总数据（自动计算）</Text>
              <View className="flex flex-row justify-between">
                <Text className="block text-sm text-slate-500">总安装数量</Text>
                <Text className="block text-sm text-emerald-700 font-bold">{totalPanels} 块</Text>
              </View>
              <View className="flex flex-row justify-between">
                <Text className="block text-sm text-slate-500">安装面积</Text>
                <Text className="block text-sm text-emerald-700 font-bold">{Math.round(installArea * 100) / 100} m²</Text>
              </View>
              <View className="flex flex-row justify-between">
                <Text className="block text-sm text-slate-500">安装功率</Text>
                <Text className="block text-sm text-emerald-700 font-bold">{Math.round(installPower * 100) / 100} kW</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 钢结构 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-700 flex flex-row items-center gap-2">
              <Settings size={18} color="#6366f1" />
              <Text className="block">钢结构</Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-1">
              <Text className="block text-sm text-slate-500">钢结构形式</Text>
              <Select value={form.steelForm} onValueChange={(v) => updateField('steelForm', v)}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="选择钢结构形式">
                    {getLabel(STEEL_FORM_OPTIONS, form.steelForm)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STEEL_FORM_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">喷漆</Text>
              <Select value={form.paintType} onValueChange={(v) => updateField('paintType', v)}>
                <SelectTrigger size="sm" className="w-full">
                  <SelectValue placeholder="选择喷漆类型">
                    {getLabel(PAINT_TYPE_OPTIONS, form.paintType)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PAINT_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </View>
          </CardContent>
        </Card>

        {/* 电气系统 */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-700 flex flex-row items-center gap-2">
              <Cable size={18} color="#0ea5e9" />
              <Text className="block">电气系统</Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="gap-1">
              <Text className="block text-sm text-slate-500">交流线 (m)</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  type="number"
                  value={form.acCable ? String(form.acCable) : ''}
                  placeholder="请输入交流线长度"
                  onInput={(e) => updateField('acCable', Number(e.detail.value) || 0)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="block text-sm text-slate-500">直流线 (m)</Text>
              <View className="bg-slate-100 rounded-lg px-3 py-2">
                <Input
                  type="number"
                  value={form.dcCable ? String(form.dcCable) : ''}
                  placeholder="请输入直流线长度"
                  onInput={(e) => updateField('dcCable', Number(e.detail.value) || 0)}
                  className="w-full bg-transparent"
                />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 底部生成按钮 */}
      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e2e8f0',
          zIndex: 100,
        }}
      >
        <Button
          onClick={handleGenerateQuote}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3"
        >
          {loading ? '生成中...' : '生成报价单'}
        </Button>
      </View>
    </ScrollView>
  )
}

export default IndexPage