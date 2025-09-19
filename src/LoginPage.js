import React, { useState } from "react";
import { API_BASE_URL_ACCOUNT } from "./config";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL_ACCOUNT}/auth/login`, {
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
      const userName = data.userName;
      const token = data.token;
      if (token) {
        onLoginSuccess(userName, token);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegister = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError("兩次輸入的密碼不一致，請重新確認。");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL_ACCOUNT}/auth/registry`, {
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

  return (
    <Card sx={{ width: 400, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" align="center" gutterBottom>
          圖片壓縮
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
            onClick={isRegistering ? handleRegister : handleLogin}
            fullWidth
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
          <Button
            variant="contained"
            onClick={() => setIsRegistering(!isRegistering)}
            fullWidth
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
        {error && (
          <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
            {error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}