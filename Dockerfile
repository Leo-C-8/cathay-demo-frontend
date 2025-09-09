# --- 第一階段：建置 React App，使用 Node.js 22 ---
FROM node:22.15.0-alpine AS build

# 設定工作目錄
WORKDIR /app

# 複製依賴說明檔
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製其他檔案
COPY . .

# 執行 build，產生靜態檔案
RUN npm run build

# --- 第二階段：用 Nginx 提供靜態檔案 ---
FROM nginx:alpine

# 複製 build 後的靜態網站
COPY --from=build /app/build /usr/share/nginx/html

# 複製 nginx 模板
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 開啟預設 port
EXPOSE 8080

# 啟動 Nginx
# CMD ["nginx", "-g", "daemon off;"]
CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
