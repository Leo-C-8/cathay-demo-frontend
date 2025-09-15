const isLocalhost = window.location.hostname === 'localhost';

// 根據環境切換 API 基底網址
export const API_BASE_URL = isLocalhost
    ? 'http://localhost:8080'
    : 'https://cathay-demo-account-191169836402.asia-east1.run.app';