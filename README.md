# 圖片壓縮服務與管理平台 (Image Compression Service)

## 專案簡介

這是一個前後端分離的 Web 應用程式，專門提供使用者上傳圖片、進行後台壓縮處理，並提供即時下載原圖與壓縮後縮圖的管理介面。

**核心功能:**

1.  **使用者認證:** 提供帳號登入與註冊功能。
2.  **圖片上傳:** 使用者可上傳圖片檔案。
3.  **後台壓縮:** 圖片上傳後，後端服務會非同步（Async）處理圖片壓縮與縮圖生成。
4.  **即時狀態:** 前端透過**輪詢機制**，即時更新壓縮進度與狀態。
5.  **圖片管理:** 提供下載（原圖與縮圖）及刪除功能。

## 技術棧與 GCP 架構 (Technology Stack & GCP Architecture)

### 前端 (Client-Side)

| 技術 | 描述 |
| :--- | :--- |
| **React** | 採用 React 框架構建單頁應用程式 (SPA)，提供動態且響應式的使用者介面。 |
| **Material-UI (MUI)** | 用於美觀且標準化的 UI 組件庫。 |
| **JavaScript/JSX** | 實現所有前端邏輯、狀態管理（`useState`, `useEffect`）和 API 互動。 |
| **非同步輪詢** | 使用 `useEffect` 和 `setInterval` 實作自動刷新機制，追蹤後台壓縮狀態。 |

### 後端服務與資料流 (Backend Services & Data Flow)

後端架構基於 Google Cloud Platform (GCP) 的無伺服器（Serverless）服務，實現高效、高彈性的處理能力。

| GCP 技術 | 後端技術 | 述                                                                                           |
| :--- | :--- |:--------------------------------------------------------------------------------------------|
| **Cloud Run** | **Spring Boot + Spring Security** | 託管主要 RESTful API 服務。處理使用者認證 (**Spring Security** 確保安全)、圖片清單查詢、圖片上傳接收等核心業務邏輯。                |
| **Cloud Storage** | N/A | 用於**儲存原始圖片及壓縮後的縮圖**。圖片上傳後直接存入此處，並由壓縮服務存取。                                                   |
| **Cloud SQL** | N/A | 提供代管的關聯式資料庫服務（ PostgreSQL），**儲存使用者帳號資訊及圖片的元數據 (Metadata)**，如檔案名稱、路徑、上傳時間、壓縮狀態等。             |
| **Pub/Sub** | N/A | **訊息佇列服務**。當圖片成功上傳到 Cloud Storage 後，透過 Pub/Sub 發送「新圖片上傳」事件訊息，作為觸發非同步壓縮的起點。                  |
| **Eventarc** | N/A | **事件路由服務**。負責將 Cloud Storage 發生的事件（例如：新檔案建立）路由到 Pub/Sub，以及將 Pub/Sub 的訊息路由到 Cloud Functions。 |
| **Cloud Functions (Java)** | **Java 圖片處理庫** | **非同步壓縮服務**。由 Eventarc/Pub/Sub 訊息觸發，執行輕量級、具成本效益的圖片壓縮與縮圖生成，完成後更新 Cloud SQL 中的狀態。             |

## 部署與 CI/CD 流程

本專案採用 **GitOps** 模式，部署流程完全自動化，利用 **Google Cloud Platform (GCP)** 服務進行管理。

### 1. 部署環境

* **Google Cloud Run (GCR):** 作為主要的無伺服器 (Serverless) 執行環境，託管 Spring Boot API 服務。它提供了自動擴展和零停機部署的能力。

### 2. 持續整合與交付 (CI/CD)

整個部署流程由 **GitHub** 和 **Cloud Build** 自動觸發：

| 步驟 | 服務 | 描述                                                                                                             |
| :--- | :--- |:---------------------------------------------------------------------------------------------------------------|
| 1\. 程式碼提交 | **GitHub** | 開發者將程式碼推送到 `main` 分支。                                                                                          |
| 2\. CI/CD 觸發 | **Cloud Build Trigger** | GitHub 的 Push 事件會觸發預先設定好的 Cloud Build 服務。                                                                      |
| 3\. 映像檔建置 | **Cloud Build** | Cloud Build 讀取專案根目錄的`cloudbuild.yaml`,`Dockerfile`，執行程式碼編譯、打包依賴項，並建立一個新的 **Docker 容器映像檔**。 |
| 4\. 映像檔推送 | **Artifact Registry** | 建立完成的 Docker 映像檔會被推送到 GCP 的映像檔儲存庫中。                                                                            |
| 5\. 服務部署 | **Cloud Build 部署至 Cloud Run** | Cloud Build 接著執行最後一步指令，將最新版本的容器映像檔部署到指定的 **Cloud Run 服務**。                                                     |
| 6\. 自動刷新 | **Cloud Run** | Cloud Run 服務會立即切換到新的映像檔版本，完成零停機的自動部署。                                                                          |