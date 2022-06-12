const { MessageEmbed, MessageActionRow, MessageButton, TextInputComponent, Modal } = require('discord.js');
const { inlineCode, SlashCommandBuilder, underscore } = require('@discordjs/builders');
const {randint} = require('../helpers/utils.js');
const { textToEmbeds } = require('../helpers/embed-generator.js');

// madlibs markup parser
const { parser } = require('../helpers/mlm-parser.js');

// for fetching texts
const fs = require('node:fs');
const path = require('node:path');

// data storage
const Keyv = require('keyv');

// madlibs core functions
module.exports = {
	// gamestate data
	keyvs: {
		gameData : new Keyv(),
		//gameStati : new Keyv(),
		blanksSets : new Keyv(),
		responses : new Keyv(),
		currentPrompts : new Keyv()
	},

	// function to send a word prompt, or finish the game otherwise
	prompt: async (channel) => {
		const cid = channel.id
		const keyvs = module.exports.keyvs;

		// reduce clashing responses
		await keyvs.currentPrompts.set(cid,null);

		// fetch game data
		let blankSet = await keyvs.blanksSets.get(cid);
		let gameData = await keyvs.gameData.get(cid);

		if (blankSet.length > 0) {

			const nextFill = blankSet.pop();
			const lexClass = gameData.parsed[nextFill].lexClass;

			// create embed
			const embed = new MessageEmbed()
				.setTitle('Mad Libs')
				.setDescription(`Give me a ${inlineCode(lexClass)}.` )
				.setFooter('(↩️ this message)');

			await keyvs.currentPrompts.set(cid, (await channel.send({embeds : [embed]} )).id);
		} else {
			// game finished state
			await channel.sendTyping()

			// parse responses
			let finalText = "";
			const response = await keyvs.responses.get(cid);
			for (var i =0; i < gameData.parsed.length; i++) {
				let token = gameData.parsed[i];
				switch (token.type) {
					case "[]":
						finalText += underscore(response[i]);
						break;
					case "[|]":
						finalText += underscore(response[i]);
						break;
					case "{}":
						finalText += underscore( response[ gameData.varSources[ token.variable ] ] );
						break;
					default:
						finalText += token.text;
						break;
				}
			}

			// create embeds
			let embeds = textToEmbeds ( finalText );
			embeds[0].setTitle(`Mad Libs - ${gameData.parsed.title}`);

			//await keyvs.gameStati.set(cid, true);

			// send result in thread
			for (emb of embeds) {
				await channel.send({embeds: [emb]});
			}

			// send result in parent channel
			const startMsg = await channel.fetchStarterMessage();
			await startMsg.send ( {content:"And the result is...", embeds:[embeds[0]]});
			for (var i=1; i < embeds.length; i++) {
				await startMsg.channel.send({embeds: [embeds[i]]});
			}


		}
	},
	
	// code for when the bot is replied to
	onreply : async (message, reference) => {
		const cid = reference.channel.id
		const keyvs = module.exports.keyvs;

		// check that response to correct prompt...
		if ((await keyvs.currentPrompts.get(cid)) == reference.id) {

			// reject multiline messages
			if (message.content.split("\n").length > 0) {
				await message.reply({content:"Single lines only!"});
				return;
			}

			// fetch game data
			let blankSet = await keyvs.blanksSets.get(cid);
			let response = await keyvs.responses.get(cid);

			const fill = blankSet.pop();
			response [fill] = message.content;

			// save game data
			await keyvs.blanksSets.set(cid, blankSet);
			await keyvs.responses.set(cid, response);

			await module.exports.prompt(reference.channel);
		}
	},

	// code for when the /madlibs command is called
	_madlibs : async (interaction) => {
				const keyvs = module.exports.keyvs;
				(await interaction.reply('Starting a game of MadLibs...'));
				//await keyvs.gameStati.set(cid, true);

				// choose a random madlibs file
				const textsPath = path.join(__dirname, '..', 'texts');
				const textFiles= fs.readdirSync(textsPath).filter(file => file.endsWith('.txt'));
				const file = textFiles[randint(0, textFiles.length)];

				// parse the file
				const parsed = parser(fs.readFileSync(path.join(textsPath, file),'utf8'));

				// create madlibs thread
				const chan = await (await interaction.fetchReply()).startThread({
					name: parsed.title,
					reason: "mad libs",
				});

				// store data in keyvs
				const cid = chan.id;
				await keyvs.gameData.set (cid, parsed);
				await keyvs.blanksSets.set (cid, parsed.blanks);
				await keyvs.responses.set (cid, {});

				// begin game...
				await module.exports.prompt (chan);
			//}
		}, 

};