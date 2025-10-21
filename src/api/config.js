const isLocalhost = window.location.hostname === 'localhost';

export const API_BASE_URL_ACCOUNT = isLocalhost
    ? 'http://localhost:8080'
    : 'http://account-service';

export const API_BASE_URL_IMAGE = isLocalhost
    ? 'http://localhost:8081'
    : 'http://image-service';