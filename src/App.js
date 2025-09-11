import React, { useState } from "react";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Divider,
} from "@mui/material";

const API_BASE_URL = "https://cathay-demo-account-191169836402.asia-east1.run.app";

export default function App() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [jwtToken, setJwtToken] = useState(localStorage.getItem("jwtToken") || null);

  const handleLogin = async () => {
    setError(null);
    setResponse(null);
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
      setResponse(data);

      // 取得 JWT 並儲存
      const token = data.token;
      if (token) {
        localStorage.setItem("jwtToken", token);
        setJwtToken(token);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFetchProtectedData = async () => {
    setError(null);
    setResponse(null);

    // 從 localStorage 取得 JWT
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setError("No JWT token found. Please log in first.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/test/jwt`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    setJwtToken(null);
    setAccount("");
    setPassword("");
    setResponse(null);
    setError(null);
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
            Login & JWT Demo
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

          <Box mt={2} display="flex" flexDirection="column" gap={1}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogin}
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Login
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleFetchProtectedData}
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Fetch Protected Data
            </Button>
            {jwtToken && (
              <Button
                variant="text"
                color="error"
                onClick={handleLogout}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Logout
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {jwtToken && (
            <Box mt={2}>
              <Typography variant="subtitle1" gutterBottom>
                Current JWT Token:
              </Typography>
              <Box
                sx={{
                  bgcolor: "#e8f5e9",
                  p: 1.5,
                  borderRadius: 2,
                  wordBreak: "break-all",
                  whiteSpace: "pre-wrap",
                }}
              >
                {jwtToken}
              </Box>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
              {error}
            </Alert>
          )}

          {response && (
            <Alert severity="success" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>
              <Typography variant="body1">API Response:</Typography>
              {JSON.stringify(response, null, 2)}
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
