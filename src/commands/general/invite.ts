import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import { Message, Permissions } from 'discord.js';
import CommandArguments from '../../util/CommandArguments';

export default class InviteCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: [],
			name: 'invite',
			dmAllowed: true,
			description: 'Generates an invite link for this bot.'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		const invite = await this.client.generateInvite([Permissions.FLAGS.BAN_MEMBERS, Permissions.FLAGS.KICK_MEMBERS]);
		await send('CLIENT_INVITE', invite);
	}
}
