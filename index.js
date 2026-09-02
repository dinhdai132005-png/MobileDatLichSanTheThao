import { registerRootComponent } from 'expo';
import App from './App';

// Expo SDK 57 yêu cầu gọi registerRootComponent thủ công
// Thay thế cho cách tự động đăng ký của các SDK cũ
registerRootComponent(App);
