import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import UploadPage from "./pages/UploadPage";
import { Box, Snackbar, Alert } from "@mui/material";

export default function App() {
  // 狀態管理：使用者名稱和 JWT 權杖。從 localStorage 讀取初始值。
  const [userName, setUserName] = useState(localStorage.getItem("userName") || null);
  const [jwtToken, setJwtToken] = useState(localStorage.getItem("jwtToken") || null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // 處理登入成功 (包含註冊成功)
  const handleLoginSuccess = (newUserName, token) => {
    // 設定狀態並儲存到 localStorage
    setUserName(newUserName);
    setJwtToken(token);
    localStorage.setItem("userName", newUserName);
    localStorage.setItem("jwtToken", token);

    // 登入成功後顯示提示
    setSnackbar({
      open: true,
      message: `登入成功！歡迎使用，${newUserName}！`,
      severity: "success",
    });
  };

  // 處理登出
  const handleLogout = () => {
    // 清除狀態並移除 localStorage 項目
    setUserName(null);
    setJwtToken(null);
    localStorage.removeItem("userName");
    localStorage.removeItem("jwtToken");

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
      {/* 根據 jwtToken 狀態切換頁面 */}
      {jwtToken ? (
        <UploadPage
          userName={userName}
          jwtToken={jwtToken}
          onLogout={handleLogout}
          onShowMessage={handleShowMessage}
        />
      ) : (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout} // 傳遞給 LoginPage 以便在 fetchWrapper 中使用
          onShowMessage={handleShowMessage} // 傳遞給 LoginPage
        />
      )}

      {/* 訊息提示框 */}
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