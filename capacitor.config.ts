import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.daily.tasks.printer',
  appName: 'طابعة المهام اليومية الذكية',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
