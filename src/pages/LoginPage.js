import { useState } from "react";
import { fetchWrapper } from "../api/apiWrapper";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
} from "@mui/material";

// 主要組件：登入/註冊頁面
export default function LoginPage({ onLoginSuccess, onLogout, onShowMessage }) {
  // 狀態管理
  const [account, setAccount] = useState("");                 // 帳號
  const [password, setPassword] = useState("");               // 密碼
  const [confirmPassword, setConfirmPassword] = useState(""); // 確認密碼 (僅註冊用)
  const [error, setError] = useState(null);                   // 錯誤訊息
  const [isRegistering, setIsRegistering] = useState(false);  // 是否處於註冊模式

  // 處理登入邏輯
  const handleLogin = async () => {
    setError(null);
    try {
      // 呼叫登入 API
      const data = await fetchWrapper.post(
        "/auth/login",
        { userName: account, password },
        null, // 登入請求不需要 JWT Token
        onLogout,
        onShowMessage
      );

      const userName = data.userName;
      const token = data.token;
      // 登入成功，將用戶名和 token 傳遞給上層組件
      if (token && userName) {
        onLoginSuccess(userName, token);
      }
    } catch (err) {
      // 顯示 API 錯誤訊息
      setError(err.message);
    }
  };

  // 處理註冊邏輯
  const handleRegister = async () => {
    setError(null);
    // 檢查兩次密碼是否一致
    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致，請重新確認。");
      return;
    }

    try {
      // 呼叫註冊 API
      const data = await fetchWrapper.post(
        "/auth/registry",
        { userName: account, password },
        null, // 註冊請求不需要 JWT Token
        onLogout,
        onShowMessage
      );

      const userName = data.userName;
      const token = data.token;
      // 註冊成功後自動觸發登入
      if (token && userName) {
        onLoginSuccess(userName, token);
      }
    } catch (err) {
      // 顯示 API 錯誤訊息
      setError(err.message);
    }
  };

  // 渲染組件
  return (
    <Card sx={{ width: 400, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" align="center" gutterBottom>
          圖片壓縮服務
        </Typography>
        <Typography variant="subtitle1" align="center" gutterBottom>
          {isRegistering ? "註冊新帳號" : "請登入以繼續"}
        </Typography>
        {/* 帳號輸入框 */}
        <TextField
          label="帳號"
          variant="outlined"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          fullWidth
          margin="normal"
        />
        {/* 密碼輸入框 */}
        <TextField
          label="密碼"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        {/* 確認密碼輸入框 (僅在註冊模式下顯示) */}
        {isRegistering && (
          <TextField
            label="確認密碼"
            type="password"
            variant="outlined"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
        )}
        <Box mt={2}>
          {/* 登入/註冊主按鈕 */}
          <Button
            variant="contained"
            onClick={isRegistering ? handleRegister : handleLogin} // 根據模式切換處理函式
            fullWidth
            // 自定義樣式
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
            {isRegistering ? "註冊" : "登入"}
          </Button>

        </Box>
        <Box mt={1} textAlign="center">
          {/* 模式切換按鈕 (註冊/返回登入) */}
          <Button
            variant="contained"
            onClick={() => setIsRegistering(!isRegistering)}
            fullWidth
            // 自定義樣式
            sx={{
              borderRadius: 2,
              backgroundColor: 'rgba(200, 150, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(200, 150, 255, 0.4)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
              color: '#4B0082',
              textTransform: 'none',
              transition: '0.3s',
              '&:hover': {
                backgroundColor: 'rgba(200, 150, 255, 0.3)',
              },
            }}
          >
            {isRegistering ? "返回登入" : "沒有帳號？點此註冊"}
          </Button>

        </Box>
        {/* 錯誤訊息提示 */}
        {error && (
          <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}