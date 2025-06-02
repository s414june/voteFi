// server.js
const WebSocket = require("ws")

const wss = new WebSocket.Server({ port: 8080 })
console.log("✅ WebSocket server running on ws://localhost:8080")

// 初始化費氏數列票數
const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55]
let voteCounts = {}
let votedUsers = new Set() // 儲存已投票的 username

fibonacci.forEach((num) => (voteCounts[num] = 0))

// 廣播目前票數給所有連線用戶
function broadcastUpdate() {
	const message = JSON.stringify({
		action: "update",
		counts: voteCounts,
	})
	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message)
		}
	})
}

// 處理新連線
wss.on("connection", (ws) => {
	console.log("🟢 Client connected")

	ws.on("message", (message) => {
		try {
			const data = JSON.parse(message)

			// 初始化票數
			if (data.action === "init") {
				ws.send(
					JSON.stringify({
						action: "update",
						counts: voteCounts,
					})
				)
				return
			}

			// 處理投票
			if (data.action === "vote") {
				const option = parseInt(data.option)
				const username = (data.username || "").trim()

				// 驗證資料
				if (!fibonacci.includes(option)) {
					console.log(`❌ 無效選項：${option}`)
					return
				}
				if (!username || votedUsers.has(username)) {
					console.log(`⚠️ 已投票或未填寫名稱：${username}`)
					return
				}

				// 記票
				voteCounts[option]++
				votedUsers.add(username)
				console.log(`✅ ${username} 投給 ${option}`)
				broadcastUpdate()
			}
		} catch (err) {
			console.error("❌ Error parsing message", err)
		}
	})

	ws.on("close", () => {
		console.log("🔴 Client disconnected")
	})
})
