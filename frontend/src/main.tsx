import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App.tsx';
import { trackflowTheme } from './theme.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ConfigProvider theme={trackflowTheme}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>,
);
