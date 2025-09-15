import { API_BASE_URL_ACCOUNT } from "./config";

export const fetchWrapper = {
    get,
    post,
};

function handleResponse(response, onLogout, onShowMessage) {
    return response.text().then((text) => {
        // 嘗試解析 JSON，如果失敗則回傳原始文字
        const data = text && JSON.parse(text);

        if (!response.ok) {
            // 偵測到 403 Forbidden 錯誤
            if (response.status === 403) {
                onLogout(); // 呼叫 App 元件的登出函式
                onShowMessage("您的登入狀態已過期，請重新登入。", "error");
                // 拋出一個自定義錯誤，以便在呼叫處停止執行
                return Promise.reject("登入狀態過期");
            }

            // 處理其他非 403 的錯誤
            const error = (data && data.message) || response.statusText;
            return Promise.reject(error);
        }

        return data;
    });
}

function get(url, jwtToken, onLogout, onShowMessage) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
        },
    };
    return fetch(`${API_BASE_URL_ACCOUNT}${url}`, requestOptions).then((response) =>
        handleResponse(response, onLogout, onShowMessage)
    );
}

function post(url, body, jwtToken, onLogout, onShowMessage) {
    const isFormData = body instanceof FormData;
    const headers = {};

    if (jwtToken) {
        headers.Authorization = `Bearer ${jwtToken}`;
    }
    // 如果不是 FormData，才需要設定 Content-Type
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

    const requestOptions = {
        method: "POST",
        headers,
        body: isFormData ? body : JSON.stringify(body),
    };

    return fetch(`${API_BASE_URL_ACCOUNT}${url}`, requestOptions).then((response) =>
        handleResponse(response, onLogout, onShowMessage)
    );
}