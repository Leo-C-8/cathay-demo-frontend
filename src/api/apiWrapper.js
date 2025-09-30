import { API_BASE_URL_ACCOUNT, API_BASE_URL_IMAGE } from "./config";

// --- 錯誤處理輔助函數 ---

/**
 * 統一處理 API 響應，解析 JSON、檢查狀態碼，並處理 403 登入過期錯誤。
 * @returns {Promise<any>}
 */
function handleResponse(response, onLogout, onShowMessage) {
    return response.text().then((text) => {
        // 嘗試解析 JSON，如果解析失敗 data 為 null
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
            // 偵測到 403 Forbidden 錯誤，視為授權過期
            if (response.status === 403) {
                onLogout(); // 呼叫 App 元件的登出函式
                onShowMessage("您的登入狀態已過期，請重新登入。", "error");

                // 拋出一個帶有標記的 Error 物件，讓呼叫處可以識別並避免後續錯誤
                const authError = new Error("AuthorizationExpired");
                authError.isAuthError = true;
                return Promise.reject(authError);
            }

            // 處理其他錯誤
            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    }).catch(error => {
        // 如果 JSON.parse 失敗，也會在這裡被捕獲
        if (error.isAuthError) return Promise.reject(error);
        // 如果是 JSON 解析錯誤
        if (error instanceof SyntaxError) {
            return Promise.reject("無法解析伺服器響應內容 (非 JSON 格式)");
        }
        return Promise.reject(error);
    });
}

// --- Fetch Wrapper 封裝 (用於一般 GET/POST 請求，例如登入、取得清單) ---

export const fetchWrapper = {
    get(url, jwtToken, onLogout, onShowMessage) {
        const requestOptions = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwtToken}`,
            },
        };
        return fetch(`${API_BASE_URL_IMAGE}${url}`, requestOptions).then((response) =>
            handleResponse(response, onLogout, onShowMessage)
        );
    },

    post(url, body, jwtToken, onLogout, onShowMessage) {
        const headers = {};
        if (jwtToken) {
            headers.Authorization = `Bearer ${jwtToken}`;
        }

        // 登入和註冊使用 Account API URL
        const baseUrl = url.includes('auth') ? API_BASE_URL_ACCOUNT : API_BASE_URL_IMAGE;

        // 檢查是否為 FormData
        const isFormData = body instanceof FormData;

        // 如果不是 FormData，才需要設定 Content-Type
        if (!isFormData) {
            headers["Content-Type"] = "application/json";
        }

        const requestOptions = {
            method: "POST",
            headers,
            body: isFormData ? body : JSON.stringify(body),
        };

        return fetch(`${baseUrl}${url}`, requestOptions).then((response) =>
            handleResponse(response, onLogout, onShowMessage)
        );
    },
};

// --- XHR 上傳進度封裝 (用於檔案上傳) ---

/**
 * 使用 XMLHttpRequest 處理檔案上傳並追蹤進度。
 * @param {File} file - 要上傳的檔案物件
 * @param {string} jwtToken - JWT 權杖
 * @param {Function} onProgress - 進度更新回調 (progress: number)
 * @param {Function} onComplete - 完成時回調 (xhr: XMLHttpRequest)
 * @param {Function} onError - 錯誤發生時回調 (error: Error)
 */
export function uploadWithProgress(file, jwtToken, onProgress, onComplete, onError) {
    const formData = new FormData();
    formData.append("image", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL_IMAGE}/images/upload`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${jwtToken}`);

    // 監聽上傳進度
    xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
        }
    });

    // 監聽請求狀態改變
    xhr.onreadystatechange = () => {
        // 狀態為 4 (DONE) 且 status 已知
        if (xhr.readyState === 4) {
            if (xhr.status === 403) {
                // 權杖過期，特殊處理
                onError(new Error("AuthorizationExpired"));
            } else if (xhr.status >= 200 && xhr.status < 300) {
                // 上傳成功
                onComplete(xhr);
            } else {
                // 上傳失敗
                onError(new Error(`上傳失敗: HTTP ${xhr.status} - ${xhr.responseText}`));
            }
        }
    };

    // 監聽網路錯誤
    xhr.addEventListener("error", () => {
        onError(new Error("網路連線錯誤或伺服器無回應。"));
    });

    xhr.send(formData);
}