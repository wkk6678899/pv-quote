import { PropsWithChildren, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { LucideTaroProvider } from 'lucide-react-taro';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { Preset } from './presets';

const App = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    // 初始化云开发环境
    // 注意：需要在微信开发者工具中开通云开发后，替换为你的环境ID
    if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
      Taro.cloud.init({
        env: 'pv-quote', // 替换为你的云开发环境ID
        traceUser: true
      });
      console.log('云开发初始化成功');
    }
  }, []);

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
