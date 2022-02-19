import fetch from "node-fetch"
import fs from "fs"
import { URLSearchParams } from "url"
import Twitter from "twitter"
import { JSDOM } from "jsdom";
import dotenv from "dotenv";
dotenv.config()

import { Client, Intents, MessageEmbed } from 'discord.js'
//const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"))
const token = process.env.TOKEN

const id = "1176567688589709312" //twitter user id
//to get user's id, run this:
//twitterClient.get("users/show.json", {screen_name: "ShadowDecoy" }, (err, username, raw) => { console.log("The requested username's id is: ", username.id_str)})



console.log("hello world")
const twitterClient = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
})

// Create a new client instance
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS] });
discordClient.login(token);

function htmlDecode(input) {
    var doc = new JSDOM(input)
    return doc.window.document.body.textContent;
}

async function DiscordGetLastPosted(channel) {
    let messages = await channel.messages.fetch({ limit: 100})
    messages = messages
        .filter(message => message.embeds.length > 0) 
        .filter(message => message.embeds[0]?.description?.includes("[link](") ?? false)
        .map(message => {
            let msg = message.embeds[0]
            let link = msg.description.split("\n")
            link = link[link.length - 1].split("[link](")[1]
            link = link.slice(0, link.length - 1).trim()
            msg.link = link
            return msg
        })
        //.forEach(message => console.log(message))

    let links = messages.map(message => message.link)
    let lastTweet = links[0]

    return lastTweet
}

async function postTweet(channel, tweet) {
    //twitterClient.get(`statuses/show.json`, {id: tweet.id, include_ext_alt_text: false, include_entities: false})
    let text = htmlDecode(tweet.full_text)
    const desc = `${text}\n\n${tweet.created_at.replaceAll("+0000", "")} | [link](${`https://twitter.com/ShadowDecoy/status/${tweet.id_str}`})`
    
    const tweetEmbed = new MessageEmbed()
        .setColor("#a57562")
        .setTitle("wake up babe, new deranged tweet")
        .setDescription(desc)

    //TODO add images
    if (typeof tweet.entities.media !== "undefined") {
        let pics = tweet.extended_entities.media
        tweetEmbed.setAuthor(
            {
                name: `tweet has ${pics.length} picture${pics.length > 1 ? "s" : ""}`, 
                iconURL: 'https://cdn.discordapp.com/attachments/704792091955429426/944671296464252928/pic_frame.png', 
                url: `https://twitter.com/ShadowDecoy/status/${tweet.id_str}` 
            }
        )
        .setImage(pics[0].media_url_https)
    }

    channel.send({embeds: [tweetEmbed]})
    console.log("sent tweet ", tweet.id_str)
}

const url = `statuses/user_timeline.json`
discordClient.once('ready', async () => { 
    console.log('Ready!');
    const channel = discordClient.channels.cache.get('901192640987529247');
    let lastposted = await DiscordGetLastPosted(channel)
    
    console.log("last posted tweet: ", lastposted)
    let lastid = lastposted.split("/")
    lastid = lastid[lastid.length - 1].toString()

    
    const params = {
        user_id: id,
        since_id: lastid,
        count: 100,
        include_rts: false,
        tweet_mode: "extended",
        exclude_replies: true
    }
    twitterClient.get(url, params, (error, tweets, response) => {
        console.log(tweets.length)
        if (tweets.length > 0) {
            console.log("last: ", lastid, "this:", tweets[0].id_str, "this txt: ", tweets[0].full_text)
            tweets = tweets.reverse().filter(tweet => tweet.id_str !== lastid)
            tweets.forEach((element, i) => {
                setTimeout(() => postTweet(channel, element), 5000 * i)
            });
            setTimeout(() => {process.exit()}, (tweets.length + 2) * 5000)
            //postTweet(channel, tweets[2])
        } else {
            console.log("discord channel is up to date. no more tweets to send")
            process.exit()
        }
        

        //let test = tweets[tweets.length - 1]
        //console.log(test)
        //postTweet(channel, test)
    })

    // channel.send('I lived, bitch.');
});


// let accessToken = JSON.parse(fs.readFileSync("./auth.json", "utf-8")).accessToken
// if (accessToken === "") {
    
// }

// let messages = await channel.messages.fetch({ limit: 30 })
//     console.log(`Received ${messages.size} messages`);
//     messages = messages.filter(message => message.embeds.length > 0)
//         .map(message => {
//             let msg = message.embeds[0]
//             let link = msg.description.split("\n")
//             link = link[link.length - 1].split("[link](")[1]
//             link = link.slice(0, link.length - 1).trim()
//             msg.link = link
//             return msg
//         })
//         //.forEach(message => console.log(message))

//     let links = messages.map(message => message.link)
//     let lastTweet = links[0]





// 
// fetch(url, {method: "GET", headers: {"Authorization": `Bearer ${bearerToken}`}})
//     .then(response => response.json())
//     .then(json => console.log(json))