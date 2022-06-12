const { MessageEmbed, MessageActionRow, MessageButton, TextInputComponent, Modal } = require('discord.js');
const { inlineCode } = require('@discordjs/builders');
const { SlashCommandBuilder, underscore } = require('@discordjs/builders');
const { parser } = require('../helpers/mlm-parser.js');

// data storage
const Keyv = require('keyv');

// madlibs core functions


module.exports = {
	keyvs: {
		gameData : new Keyv(),
		//gameStati : new Keyv(),
		blanksSets : new Keyv(),
		responses : new Keyv(),
		currentPrompts : new Keyv()
	},

	prompt: async (channel) => {
		const cid = channel.id
		const keyvs = module.exports.keyvs;

		// fetch game data
		let blankSet = await keyvs.blanksSets.get(cid);
		let gameData = await keyvs.gameData.get(cid);

		if (blankSet.length > 0) {

			const nextFill = blankSet.pop();
			const lexClass = gameData.parsed[nextFill].lexClass;

			// create embed
			const embed = new MessageEmbed()
				.setTitle('Mad Libs')
				.setDescription('Give me a word of the type ' + inlineCode(lexClass) + "." )
				.setFooter('(reply to this message)');

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

			// create embed
			const embed = new MessageEmbed()
				.setTitle('Mad Libs')
				.setDescription(finalText);

			//await keyvs.gameStati.set(cid, true);
			await keyvs.currentPrompts.set(cid,null);

			await channel.send({embeds: [embed]});
			(await channel.fetchStarterMessage() ).reply({
				content: "And the result was...",
				embeds:[embed]
			});

		}
	},

	clearPrompt: async (channel) => {
		let cpId = await currentPrompts.get(channel.id);
		(await channel.messages.fetch(cpId)).delete();
	},
	
	// code for when the bot is replied to
	onreply : async (message, reference) => {
		const cid = reference.channel.id
		const keyvs = module.exports.keyvs;

		// check that response to correct prompt...
		if ((await keyvs.currentPrompts.get(cid)) == reference.id) {

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

	_madlibs : async (interaction) => {
				const keyvs = module.exports.keyvs;
				(await interaction.reply('Starting a game of MadLibs...'));
				//await keyvs.gameStati.set(cid, true);

				// TO-DO: get text data
				// for now just hard code something...
				const source = "[word]";
				const textName = "test";

				const chan = await (await interaction.fetchReply()).startThread({
					name: textName,
					reason: "mad libs",
				});

				const cid = chan.id;

				// parse the source, then store the components in keyvs
				const parsed = parser(source);
				await keyvs.gameData.set (cid, parsed);
				await keyvs.blanksSets.set (cid, parsed.blanks);
				await keyvs.responses.set (cid, {});

				// begin game...
				await module.exports.prompt (chan);
			//}
		},

};