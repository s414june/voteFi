const path = require("path")
const fastify = require("fastify")({ logger: true })

const fastifyView = require("@fastify/view")
const fastifyStatic = require("@fastify/static")
const fastifyFormbody = require("@fastify/formbody")

const PORT = process.env.PORT || 8080

// === 資料儲存區 ===
const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55]

// voteData: { topic: { votes: {num: count}, voters: {num: [username]} } }
const voteData = {}

// votedUsers: { topic: Map(username → option) }
const votedUsers = {}

// === Plugin 註冊 ===

let assignedAliases = new Set()
const cuteNames = [
	"熊貓",
	"草莓",
	"檸檬",
	"狐狸",
	"兔兔",
	"綠茶",
	"喵喵",
	"咖啡",
	"貓熊",
	"櫻桃",
	"哈密瓜",
	"冰淇淋",
	"小太陽",
	"雲朵",
	"蜂蜜",
	"椰子",
	"藍莓",
	"貓掌",
	"香蕉",
	"抹茶",
]

fastify.register(fastifyFormbody)
fastify.register(fastifyStatic, {
	root: path.join(__dirname, "public"),
	prefix: "/public/",
})
fastify.register(fastifyView, {
	engine: {
		handlebars: require("handlebars"),
	},
	root: path.join(__dirname, "src/pages"),
	layout: "",
})

fastify.get("/api/register", async (req, reply) => {
	let alias
	for (const name of cuteNames) {
		if (!assignedAliases.has(name)) {
			alias = name
			break
		}
	}
	if (!alias) {
		alias = `匿名${assignedAliases.size - cuteNames.length + 1}`
	}
	assignedAliases.add(alias)
	return { alias }
})

// === 首頁 ===
fastify.get("/", async (req, reply) => {
	return reply.view("index.hbs")
})

// === GET /api/topics - 取得所有主題 ===
fastify.get("/api/topics", async (req, reply) => {
	return Object.keys(voteData)
})

// === POST /api/create-topic - 建立新主題 ===
fastify.post("/api/create-topic", async (req, reply) => {
	const topic = (req.body.topic || "").trim()
	if (!topic) {
		return reply.code(400).send({ success: false, message: "主題不得為空" })
	}

	if (voteData[topic]) {
		return { success: false, message: "主題已存在" }
	}

	voteData[topic] = {
		votes: {},
		voters: {},
	}
	votedUsers[topic] = new Map()

	fibonacci.forEach((n) => {
		voteData[topic].votes[n] = 0
		voteData[topic].voters[n] = []
	})

	return { success: true }
})

// === POST /api/vote - 投票（可修改）===
fastify.post("/api/vote", async (req, reply) => {
	const { alias, topic, option } = req.body

	if (!alias || !topic || option == null) {
		return reply.code(400).send("缺少欄位")
	}

	if (!voteData[topic] || !(option in voteData[topic].votes)) {
		return reply.code(400).send("主題或選項不存在")
	}

	const prevOption = votedUsers[topic].get(alias)

	if (prevOption != null && prevOption === option) {
		return reply.send("你已投同一選項")
	}

	// 如果有舊票 → 移除
	if (prevOption != null) {
		voteData[topic].votes[prevOption]--
		voteData[topic].voters[prevOption] = voteData[topic].voters[
			prevOption
		].filter((name) => name !== alias)
	}

	// 新票加入
	voteData[topic].votes[option]++
	voteData[topic].voters[option].push(alias)
	votedUsers[topic].set(alias, option)

	return reply.send("投票成功（已更新）")
})

// === GET /api/votes - 回傳所有統計資料與姓名清單 ===
fastify.get("/api/votes", async (req, reply) => {
	return voteData
})

// === 啟動伺服器 ===
const start = async () => {
	try {
		await fastify.listen({ port: PORT, host: "0.0.0.0" })
		console.log(`🚀 Fastify server running on http://localhost:${PORT}`)
	} catch (err) {
		fastify.log.error(err)
		process.exit(1)
	}
}
start()
