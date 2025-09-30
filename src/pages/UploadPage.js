import React, { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    LinearProgress,
    IconButton,
    Alert,
    CircularProgress, // 導入載入動畫
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchWrapper, uploadWithProgress } from "../api/apiWrapper";
import { API_BASE_URL_IMAGE } from '../api/config';

// 主要組件：圖片上傳與管理頁面
export default function UploadPage({ userName, jwtToken, onLogout, onShowMessage = () => { } }) {
    // 狀態管理
    const [file, setFile] = useState(null);                     // 當前選擇的檔案
    const [previewUrl, setPreviewUrl] = useState(null);         // 圖片預覽 URL
    const [uploadProgress, setUploadProgress] = useState(0);    // 上傳進度 (0-100)
    const [isUploading, setIsUploading] = useState(false);      // 是否正在上傳
    const [isLoading, setIsLoading] = useState(false);          // 是否正在載入圖片清單
    const [imageList, setImageList] = useState([]);             // 圖片清單數據
    const [imageCount, setImageCount] = useState(0);            // 圖片總數量
    const [error, setError] = useState(null);                   // 錯誤訊息
    // 輪詢狀態：是否有圖片仍在後台處理中 (壓縮/縮圖)
    const [shouldPoll, setShouldPoll] = useState(false);

    // 取得圖片清單的函式 (使用 useCallback 確保函式在依賴不變時保持穩定)
    const fetchImageList = useCallback(async () => {
        setIsLoading(true); // 設定載入狀態為 true
        try {
            const data = await fetchWrapper.get(
                "/images/list",
                jwtToken,
                onLogout,
                onShowMessage
            );

            // 根據後端回應結構，更新圖片清單和總數
            const files = data.files || [];
            setImageList(files);
            setImageCount(data.imageCount || 0);

            // 檢查清單中是否有任何圖片的縮圖狀態不是 "completed"
            const pending = files.some(item => item.thumbnailStatus !== "completed");
            setShouldPoll(pending); // 設定是否需要啟動輪詢

        } catch (err) {
            // 如果是授權過期錯誤，交由 fetchWrapper 處理登出
            if (err.isAuthError) return;

            setError(err.message);
            onShowMessage("無法取得圖片清單。", "error");
        } finally {
            setIsLoading(false); // 結束載入狀態
        }
    }, [jwtToken, onLogout, onShowMessage]);

    // **Effect 1: 頁面載入時，初次載入圖片清單**
    useEffect(() => {
        fetchImageList();
        // eslint-disable-next-line
    }, [fetchImageList]);

    // **Effect 2: 圖片壓縮狀態輪詢機制 (每 5 秒檢查一次)**
    useEffect(() => {
        let intervalId = null;

        if (shouldPoll) {
            // 如果 shouldPoll 為 true (表示有圖片正在處理)，則設定計時器
            intervalId = setInterval(() => {
                fetchImageList(); // 重新取得清單以檢查狀態
            }, 5000); // 每 5 秒檢查一次
        }

        // 清理函數：組件卸載或 shouldPoll 變為 false 時，停止輪詢
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [shouldPoll, fetchImageList]); // 依賴 shouldPoll 狀態和 fetchImageList 函式

    // **Effect 3: 處理圖片預覽 URL**
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        // 創建本地 URL 用於圖片預覽
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        // 清理函數：在組件卸載或檔案變更時釋放 URL 資源
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    // 處理檔案選擇
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith("image/")) {
            setFile(selectedFile);
            setError(null);
        } else {
            setFile(null);
            setPreviewUrl(null);
            setError("請選擇一個圖片檔案。");
            onShowMessage("請選擇一個圖片檔案。", "error");
        }
        setUploadProgress(0);
    };

    // 清除已選擇的檔案
    const handleClearFile = () => {
        setFile(null);
        setPreviewUrl(null);
        setUploadProgress(0);
        setError(null);
    };

    // 處理圖片上傳
    const handleUpload = () => {
        if (!file || isUploading) {
            onShowMessage("請先選擇一個檔案或等待當前上傳完成。", "info");
            return;
        }

        setError(null);
        setIsUploading(true); // 設定正在上傳狀態
        onShowMessage("上傳中...", "info");

        // 使用 uploadWithProgress 進行帶進度條的上傳
        uploadWithProgress(
            file,
            jwtToken,
            // onProgress: 更新進度條
            (progress) => setUploadProgress(progress),
            // onComplete: 上傳完成處理
            () => {
                setIsUploading(false); // 結束上傳
                onShowMessage("圖片上傳成功！正在處理縮圖...", "success");
                handleClearFile();
                fetchImageList(); // 重新載入清單，並啟動輪詢檢查壓縮狀態
            },
            // onError: 錯誤處理
            (err) => {
                setIsUploading(false); // 結束上傳
                if (err.message === "AuthorizationExpired") {
                    onLogout(); // 觸發登出
                    onShowMessage("您的登入狀態已過期，請重新登入。", "error");
                    return;
                }
                onShowMessage("上傳失敗。", "error");
                setError(err.message);
            }
        );
    };

    // 處理圖片下載
    const handleDownload = async (fileName, originalFileName, folderName) => {
        try {
            // 發送 POST 請求下載圖片
            const res = await fetch(`${API_BASE_URL_IMAGE}/images/download`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${jwtToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fileName, folderName }),
            });

            if (res.status === 403) {
                onLogout();
                onShowMessage("您的登入狀態已過期，請重新登入。", "error");
                return;
            }

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            }

            // 將回應內容轉換為 Blob 並創建下載連結
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', originalFileName); // 設定下載的檔案名稱
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl); // 釋放 URL 資源
            onShowMessage("圖片下載成功！", "success");

        } catch (err) {
            onShowMessage("下載過程中發生錯誤。", "error");
            setError(err.message);
        }
    };

    // 圖片刪除
    const handleDelete = async (fileName) => {
        // 使用瀏覽器內建確認視窗 (建議替換為自定義 Modal)
        if (!window.confirm("確定要刪除這張圖片嗎？(此操作無法復原)")) {
            return;
        }

        try {
            // 發送 DELETE 請求
            const url = `${API_BASE_URL_IMAGE}/images/delete/${fileName}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    "Authorization": `Bearer ${jwtToken}`,
                },
            });

            if (res.status === 403) {
                onLogout();
                onShowMessage("您的登入狀態已過期，請重新登入。", "error");
                return;
            }

            if (res.status === 204) {
                onShowMessage("圖片刪除成功！", "success");
                fetchImageList(); // 刪除成功後重新載入清單
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch (err) {
            onShowMessage("刪除過程中發生錯誤。", "error");
            setError(err.message);
        }
    };

    // 輔助函式：格式化位元組大小為可讀格式 (e.g., KB, MB)
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // 渲染組件
    return (
        <Card sx={{ minWidth: 1000, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
                {/* 標題與登出按鈕 */}
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" gutterBottom>
                        圖片上傳與管理 {userName ? `｜使用者：${userName}` : ''}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={onLogout}
                        // 自定義登出按鈕樣式
                        sx={{
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 100, 100, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 100, 100, 0.4)',
                            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                            color: '#8B0000',
                            textTransform: 'none',
                            transition: '0.3s',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 100, 100, 0.3)',
                            },
                        }}
                    >
                        登出
                    </Button>
                </Box>
                <Divider sx={{ my: 2 }} />

                {/* 上傳區塊 */}
                <Typography variant="h6">上傳圖片</Typography>
                <Box mt={2} mb={2}>
                    {/* 選擇檔案按鈕 */}
                    <Button
                        variant="contained"
                        component="label"
                        disabled={isUploading} // 上傳中禁用
                        // 自定義選擇檔案按鈕樣式
                        sx={{
                            borderRadius: 2,
                            backgroundColor: 'rgba(100, 180, 255, 0.2)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(100, 180, 255, 0.4)',
                            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                            color: '#003366',
                            textTransform: 'none',
                            transition: '0.3s',
                            '&:hover': {
                                backgroundColor: 'rgba(100, 180, 255, 0.3)',
                            },
                        }}
                    >
                        {isUploading ? "請稍候..." : "選擇檔案"}
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                            accept="image/*"
                            disabled={isUploading} // 上傳中禁用 input
                        />
                    </Button>

                    {/* 已選擇檔案名稱及清除按鈕 */}
                    {file && (
                        <Box display="flex" alignItems="center" mt={1}>
                            <Typography variant="body1">
                                已選擇: <strong>{file.name}</strong>
                            </Typography>
                            <IconButton size="small" onClick={handleClearFile} sx={{ ml: 1 }} disabled={isUploading}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    )}

                    {/* 圖片預覽區域 */}
                    {previewUrl && (
                        <Box sx={{ mt: 2, border: '1px dashed #ccc', p: 1, borderRadius: 1, textAlign: 'center' }}>
                            <img src={previewUrl} alt="預覽圖片" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                            <Typography variant="caption" display="block" color="text.secondary">
                                圖片預覽
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* 開始上傳按鈕 */}
                <Button
                    variant="contained"
                    onClick={handleUpload}
                    fullWidth
                    disabled={!file || isUploading} // 沒有檔案或上傳中時禁用
                    // 自定義開始上傳按鈕樣式
                    sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(60, 180, 120, 0.12)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(60, 180, 120, 0.3)',
                        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
                        color: '#006400',
                        textTransform: 'none',
                        transition: '0.3s',
                        '&:hover': {
                            backgroundColor: 'rgba(60, 180, 120, 0.2)',
                        },
                    }}
                >
                    {isUploading ? "正在上傳..." : "開始上傳"}
                </Button>

                {/* 上傳進度條 */}
                {uploadProgress > 0 && uploadProgress <= 100 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">上傳進度: {uploadProgress}%</Typography>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                    </Box>
                )}

                {/* 錯誤訊息提示 */}
                {error && (
                    <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
                        {error}
                    </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                {/* 圖片清單標題 */}
                <Typography variant="h6">
                    圖片清單
                    <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>
                        (總數量: {imageCount})
                    </Box>
                </Typography>

                {/* 載入狀態 */}
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                        <Typography variant="body1" sx={{ ml: 2, color: 'text.secondary' }}>載入圖片中...</Typography>
                    </Box>
                ) : imageList.length === 0 && !error ? ( // 無圖片狀態
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        目前沒有已上傳的圖片。
                    </Typography>
                ) : ( // 顯示清單
                    <List>
                        {imageList.map((item, index) => {
                            const isCompleted = item.thumbnailStatus === "completed"; // 檢查壓縮是否完成
                            // 根據狀態顯示壓縮後檔案大小或 "壓縮中"
                            const compressedSizeText = (item.fileSize > 0 && isCompleted)
                                ? formatBytes(item.fileSize)
                                : "壓縮中";
                            const originalSizeText = formatBytes(item.originalFileSize);

                            return (
                                <React.Fragment key={index}>
                                    <ListItem alignItems="center" sx={{ py: 1.5 }}>
                                        <ListItemText
                                            primary={item.originalFileName} // 顯示原始檔案名稱
                                            secondary={
                                                <Box component="span">
                                                    {/* 上傳日期與縮圖狀態 */}
                                                    <Typography
                                                        component="span"
                                                        variant="body2"
                                                        color="text.primary"
                                                    >
                                                        上傳日期: {new Date(item.uploadDate).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                                                        縮圖狀態: {isCompleted ? "✅ 完成" : "⏳ 處理中"}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            {/* 下載原圖按鈕 */}
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                onClick={() => handleDownload(item.fileName, item.originalFileName, "original")}
                                                // 樣式調整
                                                sx={{
                                                    height: 58,
                                                    minWidth: 150,
                                                    textTransform: 'none',
                                                    py: 0.5
                                                }}
                                                startIcon={<DownloadIcon />}
                                            >
                                                {/* 按鈕文字：原圖與大小 */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Typography variant="body2" component="div">
                                                        原圖
                                                    </Typography>
                                                    <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                                                        ({originalSizeText})
                                                    </Typography>
                                                </Box>
                                            </Button>
                                            {/* 下載縮圖按鈕 */}
                                            <Button
                                                variant="outlined"
                                                color="success"
                                                onClick={() => handleDownload(item.fileName, item.originalFileName, "thumbnail")}
                                                disabled={!isCompleted} // 只有完成才可下載縮圖
                                                // 樣式調整
                                                sx={{
                                                    height: 58,
                                                    minWidth: 150,
                                                    textTransform: 'none',
                                                    py: 0.5
                                                }}
                                                // 處理中顯示載入動畫，完成顯示下載圖標
                                                startIcon={isCompleted ? <DownloadIcon /> : <CircularProgress size={16} />}
                                            >
                                                {/* 按鈕文字：縮圖與大小 */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Typography variant="body2" component="div">
                                                        縮圖
                                                    </Typography>
                                                    <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                                                        ({compressedSizeText})
                                                    </Typography>
                                                </Box>
                                            </Button>
                                            {/* 刪除按鈕 */}
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleDelete(item.fileName)}
                                                // 樣式調整
                                                sx={{
                                                    height: 58,
                                                    minWidth: 150,
                                                    textTransform: 'none',
                                                    py: 0.5
                                                }}
                                                startIcon={<DeleteIcon />}
                                            >
                                                {/* 按鈕文字：刪除與警告 */}
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Typography variant="body2" component="div">
                                                        刪除
                                                    </Typography>
                                                    <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                                                        (無法復原)
                                                    </Typography>
                                                </Box>
                                            </Button>
                                        </Box>
                                    </ListItem>
                                    {/* 清單項目分隔線 */}
                                    {index < imageList.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                )}
            </CardContent>
        </Card>
    );
}