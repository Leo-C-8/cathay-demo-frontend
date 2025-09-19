import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import UploadPage from "./UploadPage";
import { Box, Snackbar, Alert } from "@mui/material";

export default function App() {
  const [userName, setUserName] = useState(localStorage.getItem("userName") || null);
  const [jwtToken, setJwtToken] = useState(localStorage.getItem("jwtToken") || null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // 當 jwtToken 狀態改變時，將其儲存到 localStorage
  useEffect(() => {
    if (jwtToken) {
      localStorage.setItem("jwtToken", jwtToken);
    } else {
      localStorage.removeItem("jwtToken");
    }
  }, [jwtToken]);

  // 當 userName 狀態改變時，將其儲存到 localStorage
  useEffect(() => {
    if (userName) {
      localStorage.setItem("userName", userName);
    } else {
      localStorage.removeItem("userName");
    }
  }, [userName]);

  const handleLoginSuccess = (userName, token) => {
    setUserName(userName)
    setJwtToken(token);

    // 登入成功後顯示提示
    setSnackbar({
      open: true,
      message: `登入成功！歡迎使用，${userName}！`,
      severity: "success",
    });
  };

  const handleLogout = () => {
    setJwtToken(null);
    setSnackbar({
      open: true,
      message: "您已成功登出。",
      severity: "info",
    });
  };

  // 統一處理訊息提示的函式
  const handleShowMessage = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#f5f5f5"
    >
      {jwtToken ? (
        <UploadPage
          userName={userName}
          jwtToken={jwtToken}
          onLogout={handleLogout}
          onShowMessage={handleShowMessage} // 傳遞給 UploadPage
        />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}