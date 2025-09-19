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
    const [imageList, setImageList] = useState([]);
    const [error, setError] = useState(null);

    // 頁面載入時，自動取得圖片清單
    useEffect(() => {
        fetchImageList();
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
            setImageList(data.files || []);
        } catch (err) {
            setError(err.message);
            onShowMessage("無法取得圖片清單。", "error");
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
        <Card sx={{ width: 600, borderRadius: 2, boxShadow: 3 }}>
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
                        backgroundColor: 'rgba(60, 180, 120, 0.12)', // 更暗的透明綠
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(60, 180, 120, 0.3)',
                        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
                        color: '#006400', // 深綠文字
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
                <Typography variant="h6">圖片清單</Typography>
                {imageList.length === 0 && !error ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        目前沒有已上傳的圖片。
                    </Typography>
                ) : (
                    <List>
                        {imageList.map((item, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <ListItemText
                                        primary={item.originalFileName}
                                        secondary={`
                      大小: ${formatBytes(item.fileSize)} |
                      上傳日期: ${new Date(item.uploadDate).toLocaleDateString()} |
                      縮圖狀態: ${item.thumbnailStatus === "completed" ? "✅ 完成" : "⏳ 處理中"}
                    `}
                                    />
                                    <Button
                                        variant="outlined"
                                        color="success"
                                        href={item.thumbnailDownloadLink}
                                        disabled={item.thumbnailStatus !== "completed"}
                                        target="_blank"
                                    >
                                        下載縮圖
                                    </Button>
                                </ListItem>
                                {index < imageList.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
}