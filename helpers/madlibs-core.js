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
		gameStati : new Keyv(),
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

			await keyvs.gameStati.set(cid, true);
			await keyvs.currentPrompts(cid,null);

			await channel.send({embeds: [embed]});

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
			const cid = interaction.channelId;
			if (await keyvs.gameStati.get(cid)) {
				await interaction.reply('A game is already in progress in this channel!');
			} else {
				await interaction.reply('Starting a game of MadLibs...');
				await keyvs.gameStati.set(cid, true);

				// TO-DO: get text data
				// for now just hard code something...
				source = "It's called a [ proper noun | college name ] [ noun | channel ] for a reason. We all [ verb ] each other really well on the { channel }, and we use it on the trust and assumption that the [ plural noun ] we're talking to will be the same as those we'll be [ verb ending in -ing ] with, making friends with and [ transitive verb ending -ing ] at [ place ]. Entering the { channel } as a college member other than { college name } breaks the [noun] and makes it [adjective] and [adjective] to understand what's going on.\
	If you'd like to [ transitive verb ] someone from { college name }, I'm sure sending them a [ singular noun ] wouldn't hurt. Some people are open to [verb ending in -ing] (those people were [state of being] yesterday).";

				// parse the source, then store the components in keyvs
				parsed = parser(source);
				await keyvs.gameData.set (cid, parsed);
				await keyvs.blanksSets.set (cid, parsed.blanks);
				await keyvs.responses.set (cid, {});

				// begin game...
				await module.exports.prompt (interaction.channel);

			}
		},

};