export default typeof definePageConfig === 'function'
  ? definePageConfig({
    pages: [
      'pages/index/index',
      'pages/quote/index'
    ],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#10b981',
      navigationBarTitleText: '光伏报价',
      navigationBarTextStyle: 'white'
    }
  })
  : {
    pages: [
      'pages/index/index',
      'pages/quote/index'
    ],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#10b981',
      navigationBarTitleText: '光伏报价',
      navigationBarTextStyle: 'white'
    }
  }
