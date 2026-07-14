export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '报价单',
      navigationBarBackgroundColor: '#10b981',
      navigationBarTextStyle: 'white',
      backgroundColor: '#f1f5f9',
    })
  : {
      navigationBarTitleText: '报价单',
      navigationBarBackgroundColor: '#10b981',
      navigationBarTextStyle: 'white',
      backgroundColor: '#f1f5f9',
    }