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
  Avatar,
  Paper,
} from "@mui/material";

import Logo from '../images/Logo.png';

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
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 5,
      }}
    >
      {/* 標誌 (Logo) 區塊 */}
      <Box mb={4} sx={{ textAlign: "center" }}>
        <Avatar
          src={Logo}
          alt="Logo"
          sx={{
            width: 120,
            height: 120,
            boxShadow: '0 0 0 5px rgba(255, 255, 255, 0.5), 0 0 20px rgba(0, 150, 255, 0.5)',
            transition: '0.3s',
            '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.7), 0 0 30px rgba(0, 150, 255, 0.8)',
            }
          }}
        />
      </Box>

      {/* 登入/註冊卡片 */}
      <Card
        sx={{
          width: 400,
          maxWidth: '90%',
          maxHeight: '90%',
          borderRadius: 4,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
          p: 1,
        }}
      >
        <CardContent>
          {/* 標題 */}
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, color: '#333' }}
          >
            圖片壓縮
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            gutterBottom
            sx={{ mb: 3, color: '#666' }}
          >
            {isRegistering ? "創建您的新帳號" : "請登入以開始使用"}
          </Typography>

          {/* 帳號輸入框 */}
          <TextField
            label="帳號 (UserName)"
            variant="outlined"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            fullWidth
            margin="normal"
            size="medium"
          />
          {/* 密碼輸入框 */}
          <TextField
            label="密碼 (Password)"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            size="medium"
          />
          {/* 確認密碼輸入框 (僅在註冊模式下顯示) */}
          {isRegistering && (
            <TextField
              label="確認密碼 (Confirm Password)"
              type="password"
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              margin="normal"
              size="medium"
            />
          )}

          <Box mt={3}>
            {/* 登入/註冊主按鈕 */}
            <Button
              variant="contained"
              onClick={isRegistering ? handleRegister : handleLogin}
              fullWidth
              size="medium"
              sx={{
                borderRadius: 2,
                backgroundColor: 'rgba(50, 150, 255, 0.7)',
                backdropFilter: 'blur(5px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                color: 'white',
                fontWeight: 700,
                textTransform: 'none',
                transition: '0.3s',
                '&:hover': {
                  backgroundColor: 'rgba(50, 150, 255, 0.9)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.5)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {isRegistering ? "完成註冊並登入" : "登入"}
            </Button>
          </Box>

          <Box mt={2} textAlign="center">
            <Button
              variant="text"
              onClick={() => setIsRegistering(!isRegistering)}
              fullWidth
              size="medium"
              sx={{
                borderRadius: 2,
                color: isRegistering ? '#4B0082' : '#007ACC',
                fontWeight: 500,
                textTransform: 'none',
                transition: '0.3s',
                '&:hover': {
                    backgroundColor: 'rgba(150, 100, 255, 0.1)',
                },
              }}
            >
              {isRegistering ? "已有帳號？返回登入" : "沒有帳號？點此註冊"}
            </Button>
          </Box>

          {/* 錯誤訊息提示 */}
          {error && (
            <Alert
              severity="error"
              sx={{ mt: 3, whiteSpace: "pre-wrap", borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Paper>
  );
}