const { Client, Events, GatewayIntentBits } = require("discord.js")
require("dotenv/config")
const { OpenAI } = require("openai")

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
  })

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

client.once(Events.ClientReady, (clientUser) => {
    console.log(`Logged in as ${clientUser.user.tag}`)
})

client.login(process.env.TOKEN)

const BOT_CHANNEL_ID = "CHANNEL_ID"  // change this to the channel id you want the bot to read messages from
const PAST_MESSAGES = 5

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return
    if (message.channel.id !== BOT_CHANNEL_ID) return

    console.log(message.content) // test that the bot reads the messges

    message.channel.sendTyping()

    let messages = Array.from(await message.channel.messages.fetch({
        limit: PAST_MESSAGES,
        before: message.id
    }))
    messages = messages.map(m=>m[1])
    messages.unshift(message)

    let users = [...new Set([...messages.map(m=> m.member.displayName), client.user.username])]

    let lastUser = users.pop()

    let prompt = `The following is a conversation between ${users.join(", ")}, and ${lastUser}. Complete the answers being sassy and very mean towards ${lastUser}. \n\n` //play around with this to alter behavior - see video

    for (let i = messages.length - 1; i>=0; i--) {
        const m = messages[i]
        prompt +=  `${m.member.displayName}: ${m.content}\n`
    }
    prompt += `${client.user.username}:`
    console.log("prompt:", prompt)

    const response = await openai.completions.create({
        prompt,
        model: "gpt-3.5-turbo-instruct",
        max_tokens: 500,
        stop: ["\n"]
    })

    console.log("response:", response.choices[0].text)
    await message.channel.send(response.choices[0].text)
})