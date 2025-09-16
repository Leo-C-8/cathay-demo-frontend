import React, { useState } from "react";
import { API_BASE_URL } from './config';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
} from "@mui/material";

export default function LoginPage({ onLoginSuccess }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  // 新增狀態來儲存確認密碼
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName: account, password }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const token = data.token;
      if (token) {
        onLoginSuccess(token);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async () => {
    setError(null);
    // 在前端檢查兩次密碼是否相符
    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致，請重新確認。");
      return; // 如果不符，停止執行
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/registry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // 只傳送帳號和密碼到後端
        body: JSON.stringify({ userName: account, password }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const token = data.token;
      if (token) {
        onLoginSuccess(token);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card sx={{ width: 400, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" align="center" gutterBottom>
          圖片壓縮系統
        </Typography>
        <Typography variant="subtitle1" align="center" gutterBottom>
          {isRegistering ? "註冊新帳號" : "請登入以繼續"}
        </Typography>
        <TextField
          label="帳號"
          variant="outlined"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="密碼"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />
        {/* 註冊模式下顯示確認密碼欄位 */}
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
          <Button
            variant="contained"
            color="primary"
            onClick={isRegistering ? handleRegister : handleLogin}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            {isRegistering ? "註冊" : "登入"}
          </Button>
        </Box>
        <Box mt={1} textAlign="center">
          <Button
            variant="contained"
            color="warning"
            onClick={() => setIsRegistering(!isRegistering)}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            {isRegistering ? "返回登入" : "沒有帳號？點此註冊"}
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}