# syntax=docker/dockerfile:1
FROM node:14.21.3-slim

LABEL fly_launch_runtime="Node.js"

# 設定工作目錄
WORKDIR /app

# 設定 production 環境變數
ENV NODE_ENV=production

# 複製必要檔案並安裝相依
COPY .npmrc package.json ./
RUN npm install --omit=dev

# 複製整個應用程式碼（包含 server.js、templates、static 資源等）
COPY . .

# 開放 port
EXPOSE 3000

# 預設啟動指令
CMD [ "npm", "run", "start" ]
