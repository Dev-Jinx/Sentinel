import Command, { SendFunction } from '../../util/BaseCommand';
import SentinelClient from '../../client/SentinelClient';
import CommandArguments from '../../util/CommandArguments';
import { Message, Permissions } from 'discord.js';
import Util from '../../util';
import CommandError from '../../structures/CommandError';
import { ModerationTypes, DEFAULT_REASON } from '../../util/Constants';

export default class BanCommand extends Command {
	constructor(client: SentinelClient) {
		super(client, {
			aliases: ['perma-yeet'],
			name: 'ban',
			dmAllowed: false,
			permissions: (member) => {
				const { guild: { config } } = member;
				if (!config) return null;
				if (member.hasPermission(Permissions.FLAGS.BAN_MEMBERS)) return true;
				const fn = (id: string) => member.roles.cache.has(id);
				if (
					member.client.config.devs.includes(member.id) ||
					config.modRoleIDs?.some(fn) || config.adminRoleIDs?.some(fn)
				) return true;
				return 'You need to be a Server Moderator to use this command!';
			},
			description: 'Ban a user.',
			usage: '[member] <reason>'
		}, __filename);
	}

	async run(message: Message, args: CommandArguments, send: SendFunction) {
		const noMemberError = new CommandError('MENTION_MEMBER', 'ban');
		if (!args[0]) throw noMemberError;
		const { content, members } = await Util.extractMentions(args.regular, {
			client: this.client, guild: message.guild!, limit: 1
		});
		const member = members.first();
		if (!member || member.id === message.author.id || member.id === this.client.user!.id) throw noMemberError;
		if (!Util.isManageableBy(member, message.member!)) throw new CommandError('NOT_MANAGEABLE', ModerationTypes.BAN);
		if (!member.bannable) throw new CommandError('NOT_MANAGEABLE', ModerationTypes.BAN, { byBot: true });
		// not handling errors, better idea for another commit
		await member.ban({
			days: 7,
			reason: `${message.author.tag}: ${content || DEFAULT_REASON}`
		});

		const logChannel = message.guild!.config!.logsChannel;
		if (logChannel) {
			await Util.respondWith(logChannel, 'REMOVED_USER_LOG', ModerationTypes.BAN, message.member!, [member.user], content);
		}

		await send('REMOVED_USER', ModerationTypes.BAN, [member.user], content);
	}
}
