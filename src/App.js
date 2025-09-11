import React, { useState } from "react";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
} from "@mui/material";

export default function App() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setError(null); // 清空之前的錯誤
    setResponse(null); // 清空之前的回應
    try {
      const res = await fetch("https://cathay-demo-account-191169836402.asia-east1.run.app/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ account, password }),
      });

      if (!res.ok) {
        // HTTP 狀態碼不是 200
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      <Card sx={{ width: 400, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Login
          </Typography>

          <TextField
            label="Account"
            variant="outlined"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleLogin}
            fullWidth
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Login
          </Button>

          {/* 錯誤訊息 */}
          {error && (
            <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
              {error}
            </Alert>
          )}

          {/* 成功回應 */}
          {response && (
            <Alert severity="success" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(response, null, 2)}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}