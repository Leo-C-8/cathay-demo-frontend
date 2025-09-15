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
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setError(null);
    try {
      console.log(`URL: ${API_BASE_URL}`)
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

  return (
    <Card sx={{ width: 400, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" align="center" gutterBottom>
          圖片壓縮系統
        </Typography>
        <Typography variant="subtitle1" align="center" gutterBottom>
          請登入以繼續
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
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogin}
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            登入
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