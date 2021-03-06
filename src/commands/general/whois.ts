import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';
import Util from '../../util';
import CommandError from '../../structures/CommandError';

export default class WhoisCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['user-info'],
			name: 'whois',
			dmAllowed: false,
			description: 'Display a users information.'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		let member = message.member!;
		if (args.regular.length) {
			const { content, members } = await Util.extractMentions(args.regular, {
				client: this.client, guild: message.guild!, limit: 1
			});
			if (!members.size) {
				throw new CommandError('UNKNOWN_MEMBER', content, false);
			}
			member = members.first()!;
		}
		await send('WHOIS', member);
	}
}
