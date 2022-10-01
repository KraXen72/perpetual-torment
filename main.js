import Twitter from "twitter"
import { JSDOM } from "jsdom";
import dotenv from "dotenv";
dotenv.config()

import { Client, Intents, MessageEmbed, MessageAttachment } from 'discord.js'
//const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"))
const token = process.env.TOKEN

const id = "1176567688589709312" //twitter user id
const username = "ShadowDecoy"
const channel_id = '901192640987529247'
const tcoRegExp = new RegExp(/https:\/\/t\.co\/[a-zA-Z0-9_.-]{10}/, "g")
const tcoRegExpFull = new RegExp(/^https:\/\/t\.co\/[a-zA-Z0-9_.-]+$/) // t.co link only

//to get user's id, run this:
//twitterClient.get("users/show.json", {screen_name: username }, (err, username, raw) => { console.log("The requested username's id is: ", username.id_str)})

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
    // remove all https://t.co/muPr6cJkQy etc links from the text
	// console.log(tweet, tweet.entities, tweet.entities.url, tweet.entities.description)
    let text = htmlDecode(tweet.full_text).replaceAll(tcoRegExp, "").trim()
	const footer = `${tweet.created_at.replaceAll("+0000", "")} | [link](${`https://twitter.com/${username}/status/${tweet.id_str}`})`
    let desc = `${text}\n\n${footer}`
    let attachPics = []
	let attachLinks = []
    
    const tweetEmbed = new MessageEmbed()
        .setColor("#a57562")
        .setTitle("wake up babe, new deranged tweet")
        .setDescription(desc)

	// only link
	if (text === "" && tcoRegExpFull.test(tweet.full_text)) {
		desc = `(link)\n\n${footer}`
		tweetEmbed.setDescription(desc)
		tweet.entities.urls.forEach(url => attachLinks.push(url.expanded_url))
	}

    // attachments
    if (typeof tweet.entities.media !== "undefined") {
        let pics = tweet.extended_entities.media
        attachPics = pics
            .map(pic => pic.media_url_https)
            .slice(1) // remove the first one since that's in the embed already
            .map(pic => new MessageAttachment(pic))
        tweetEmbed.setAuthor(
            {
                name: `tweet has ${pics.length} picture${pics.length > 1 ? "s" : ""}`, 
                iconURL: 'https://cdn.discordapp.com/attachments/704792091955429426/944671296464252928/pic_frame.png', 
                url: `https://twitter.com/${username}/status/${tweet.id_str}` 
            }
        )
        .setImage(pics[0].media_url_https)
    }

    // quote tweeting
    if (typeof tweet.quoted_status !== "undefined") {
        const qTweet = tweet.quoted_status
        const quotedText = htmlDecode(qTweet.full_text).replaceAll(tcoRegExp, "").trim()

        tweetEmbed.addField("Quoting: ", quotedText !== "" ? quotedText : "[ no text ]", false)

        if (typeof qTweet.entities.media !== "undefined") {
            let qPics = qTweet.extended_entities.media
                .map(pic => pic.media_url_https)
                .map((pic, i) => `[Media_${i+1}](${pic})`)
                .join(", ")
			if (qPics === "") qPics = "(nothing)"
            tweetEmbed.addField("QuoteTweet's attachments: ", qPics)
        }

        tweetEmbed.setFooter({ 
            text: `${qTweet.user.name} @${qTweet.user.screen_name}`,
            iconURL: qTweet.user.profile_image_url_https
        })

        tweetEmbed.setAuthor(
            {
                name: `tweet is a Quote Tweet`, 
                iconURL: 'https://cdn.discordapp.com/attachments/704792091955429426/1014498785818325053/round_format_quote_white_48dp.png', 
                url: `https://twitter.com/${username}/status/${tweet.id_str}` 
            }
        )

        // quote tweeting and also attachments
        if (typeof tweet.entities.media !== "undefined") {
            tweetEmbed.setImage("")
            const pics = tweet.extended_entities.media
            attachPics = pics
                .map(pic => pic.media_url_https)
                .map(pic => new MessageAttachment(pic))

                tweetEmbed.setAuthor(
                    {
                        name: `tweet is a Quote Tweet and has ${pics.length} picture${pics.length > 1 ? "s" : ""}`, 
                        iconURL: 'https://cdn.discordapp.com/attachments/704792091955429426/1014499679607730217/ok.png', 
                        url: `https://twitter.com/${username}/status/${tweet.id_str}` 
                    }
                )
        }   
    }
	// console.log(attachLinks)
    channel.send({embeds: [tweetEmbed]})
    if (attachPics.length > 0) { channel.send({files: attachPics}) }
	if (attachLinks.length > 0) attachLinks.forEach((link, i) => { setTimeout(() => channel.send(link), `${(i + 1)*50}ms`) } )

    console.log("sent tweet ", tweet.id_str)
}

const url = `statuses/user_timeline.json`
discordClient.once('ready', async () => { 
    console.log('Ready!');
    const channel = discordClient.channels.cache.get(channel_id);
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

            tweets.forEach((element, i) => { setTimeout(() => {
				try {
					postTweet(channel, element)
				} catch (error) {
					channel.send(`Error sending tweet ${element.id_str}. error: 
					\`\`\`
					${error}
					\`\`\`
					`);
				}
				
			}, 5000 * i) });
            setTimeout(() => {process.exit()}, (tweets.length + 2) * 5000)

            //postTweet(channel, tweets[0])
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