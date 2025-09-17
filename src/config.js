const isLocalhost = window.location.hostname === 'localhost';

export const API_BASE_URL_ACCOUNT = isLocalhost
    ? 'http://localhost:8080'
    : 'https://cathay-demo-account-191169836402.asia-east1.run.app';

export const API_BASE_URL_IMAGE = isLocalhost
    ? 'http://localhost:8081'
    : 'https://cathay-demo-image-191169836402.asia-east1.run.app';