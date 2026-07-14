export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '光伏报价计算',
      navigationBarBackgroundColor: '#10b981',
      navigationBarTextStyle: 'white',
      backgroundColor: '#f1f5f9',
    })
  : {
      navigationBarTitleText: '光伏报价计算',
      navigationBarBackgroundColor: '#10b981',
      navigationBarTextStyle: 'white',
      backgroundColor: '#f1f5f9',
    }