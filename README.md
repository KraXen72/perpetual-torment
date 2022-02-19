# perpetual torment
this is my twitter => discord bot. it mirrors all tweets from one account into a discord channel. it is supposed to be on heroku.
![img](https://cdn.discordapp.com/attachments/704792091955429426/944693815233609808/unknown.png)

## features
- works with private acount
- makes nice embeds of tweets
- has adds an image to the discord embed if the tweet has an image
- is "smart": only posts tweets that are not already in channel

## how to set it up
> disclaimer: i will not provide any support (at all) setting this up. figure it out yourself. have fun
  
- make a discord bot application
- give it the channel read message history intent or whatever it's called and channel send message intent
- invite it to your server
- give it appropriate permissions
- sign up for twitter api, get a `consumer key `, `consumer secret` and a `access token` and `access token secret` for on behalf of your account
- in `main.js` edit the username, user id (twitter) and channel id (discord) where bot should send the tweets

## running locally
you can run `npm run start` to run the bot once a while, it will poll all tweets you sent since it was last ran (up to 3000, if you tweet more than 3000 tweets run it more often or seek help)
this is fine but you gotta remember to run it otherwise the tweets won't appear  
if you tweet a normal amount, running it once every week/month should suffice.

## setting up on heroku
heroku is a cloud thingy where you can host stuff
- make a new nodejs app
- publish this to a repo (can be private) (make sure to .gitignore your .env file)
- in the heroku app, go to settings and add  in the env variables under the appropriate names
- connect it to your github (idk how to set it up through heroku cli)
- set up automatic deploys to deploy after pushing to master
- in the heroku Procfile, set up `web: npm run start` to run the app (it somehow set up for me automatically idk)
- add an add-on called Heroku Scheduler (you will have to add your credit card to verify but it doesen't take any money, you can probably remove it after that) (or make a custom clock job but idk how to do that)
- in the heroku scheduler set up a task to run `npm run start` every hour
- now pray and hope it works lmfao
  
> once again, i will be not providing any support for this. figure it out yourself. have fun.