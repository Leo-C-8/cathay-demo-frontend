import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { API_BASE_URL_IMAGE } from './config';

export default function UploadPage({ userName, jwtToken, onLogout, onShowMessage = () => { } }) {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    // 圖片清單陣列
    const [imageList, setImageList] = useState([]);
    // 圖片總數 (新增)
    const [imageCount, setImageCount] = useState(0);
    const [error, setError] = useState(null);

    // 頁面載入時，自動取得圖片清單
    useEffect(() => {
        fetchImageList();
        // eslint-disable-next-line
    }, []);

    // 處理圖片預覽URL的創建和清理
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

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

    const handleClearFile = () => {
        setFile(null);
        setPreviewUrl(null);
        setUploadProgress(0);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) {
            onShowMessage("請先選擇一個檔案。", "info");
            return;
        }

        setError(null);
        onShowMessage("上傳中...", "info");

        const formData = new FormData();
        formData.append("image", file);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", `${API_BASE_URL_IMAGE}/images/upload`, true);
            xhr.setRequestHeader("Authorization", `Bearer ${jwtToken}`);

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(progress);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status === 403) {
                    onLogout();
                    onShowMessage("您的登入狀態已過期，請重新登入。", "error");
                    return;
                }

                if (xhr.status === 200) {
                    onShowMessage("圖片上傳成功！正在處理縮圖...", "success");
                    handleClearFile();
                    fetchImageList();
                } else {
                    onShowMessage(`上傳失敗: HTTP ${xhr.status}`, "error");
                    setError(`HTTP ${xhr.status}: ${xhr.responseText}`);
                }
            });

            xhr.addEventListener("error", () => {
                onShowMessage("上傳過程中發生錯誤。", "error");
                setError("Network error or server connection failed.");
            });

            xhr.send(formData);

        } catch (err) {
            onShowMessage("上傳失敗。", "error");
            setError(err.message);
        }
    };

    const fetchImageList = async () => {
        try {
            const res = await fetch(`${API_BASE_URL_IMAGE}/images/list`, {
                headers: {
                    "Authorization": `Bearer ${jwtToken}`,
                },
            });

            if (res.status === 403) {
                onLogout();
                onShowMessage("您的登入狀態已過期，請重新登入。", "error");
                return;
            }

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            }

            const data = await res.json();
            // 根據您的 ImageInfoListDto 結構，取得 files 和 imageCount
            setImageList(data.files || []); // 更新圖片清單
            setImageCount(data.imageCount || 0); // 更新圖片總數
        } catch (err) {
            setError(err.message);
            onShowMessage("無法取得圖片清單。", "error");
        }
    };

    const handleDownload = async (fileName, originalFileName, folderName) => {
        try {
            const url = `${API_BASE_URL_IMAGE}/images/download`;
            const res = await fetch(url, {
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

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', originalFileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            onShowMessage("圖片下載成功！", "success");

        } catch (err) {
            onShowMessage("下載過程中發生錯誤。", "error");
            setError(err.message);
        }
    };

    // 圖片刪除
    const handleDelete = async (fileName) => {
        if (!window.confirm("確定要刪除這張圖片嗎？")) {
            return;
        }

        try {
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

    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <Card sx={{ width: 800, borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" gutterBottom>
                        圖片上傳與管理 {userName ? `｜使用者：${userName}` : ''}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={onLogout}
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
                    <Button
                        variant="contained"
                        component="label"
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
                        選擇檔案
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </Button>

                    {file && (
                        <Box display="flex" alignItems="center" mt={1}>
                            <Typography variant="body1">
                                已選擇: <strong>{file.name}</strong>
                            </Typography>
                            <IconButton size="small" onClick={handleClearFile} sx={{ ml: 1 }}>
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

                <Button
                    variant="contained"
                    onClick={handleUpload}
                    fullWidth
                    disabled={!file}
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
                    開始上傳
                </Button>

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">上傳進度: {uploadProgress}%</Typography>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
                        {error}
                    </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                {/* 圖片清單 */}
                <Typography variant="h6">
                    圖片清單
                    <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>
                        (總數量: {imageCount}) {/* 顯示總數量 */}
                    </Box>
                </Typography>
                {imageList.length === 0 && !error ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        目前沒有已上傳的圖片。
                    </Typography>
                ) : (
                    <List>
                        {imageList.map((item, index) => {
                            // 判斷壓縮大小顯示內容 (使用小寫 'completed')
                            const isCompleted = item.thumbnailStatus === "completed";
                            const compressedSizeText = (item.fileSize > 0 && isCompleted)
                                ? formatBytes(item.fileSize)
                                : "壓縮中";

                            // 準備原始尺寸資訊
                            const originalSizeText = formatBytes(item.originalFileSize);

                            return (
                                <React.Fragment key={index}>
                                    <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                                        <ListItemText
                                            primary={item.originalFileName}
                                            // 移除尺寸資訊，只保留日期和狀態
                                            secondary={
                                                <Box component="span">
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
                                        {/* 下載與刪除按鈕，並將大小資訊放在按鈕內 */}
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                onClick={() => handleDownload(item.fileName, item.originalFileName, "original")}
                                                // 讓按鈕內容換行，增加高度
                                                sx={{ height: 'auto', minWidth: 100, textTransform: 'none', py: 0.5 }}
                                            >
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Typography variant="body2" component="div">
                                                        下載原圖
                                                    </Typography>
                                                    <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                                                        ({originalSizeText}) {/* 原始大小 */}
                                                    </Typography>
                                                </Box>
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="success"
                                                onClick={() => handleDownload(item.fileName, item.originalFileName, "thumbnail")}
                                                disabled={!isCompleted} // 只有完成才可下載縮圖
                                                // 讓按鈕內容換行，增加高度
                                                sx={{ height: 'auto', minWidth: 100, textTransform: 'none', py: 0.5 }}
                                            >
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <Typography variant="body2" component="div">
                                                        下載縮圖
                                                    </Typography>
                                                    <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
                                                        ({compressedSizeText}) {/* 壓縮大小/壓縮中 */}
                                                    </Typography>
                                                </Box>
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleDelete(item.fileName)}
                                                size="small" // 刪除按鈕維持單行
                                                sx={{ height: 40 }}
                                            >
                                                刪除
                                            </Button>
                                        </Box>
                                    </ListItem>
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