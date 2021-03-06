import GuildConfig from '../structures/GuildConfig';
import { PermissionString, MessageEmbed, GuildMember, Guild, Message, StringResolvable, Util as DJSUtil, PartialMessage, Permissions, User } from 'discord.js';
import * as moment from 'moment';
import { IPData } from '../commands/general/lookup';

export const DEFAULT_TIME_FORMAT = 'DD/MM/YYYY HH:mm:ss';
export const SQL_SEARCH_REGEX = /:(\w+)/g;
export const SNOWFLAKE_REGEX = /(\d{16,19})/g;
export const INVITE_REGEX = /discord(?:(?:app)?\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/gi;
export const IP_REGEX = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const SEND_MESSAGE_PERMISSIONS = Permissions.resolve([
	Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.VIEW_CHANNEL
]);

export const upperFirst = (string: string, lowerRest = true) => (
	string.charAt(0).toUpperCase() + (lowerRest ? string.toLowerCase() : string).slice(1)
);
export const cleanPermissions = (perms: Permissions | PermissionString[]) => (
	Array.isArray(perms) ? perms : perms.toArray()
).map(
	perm => `\`${upperFirst(perm.toLowerCase().replace(/_(.)/g, (str, match) => ` ${match.toUpperCase()}`), false)}\``
).join(', ');
export const plural = (word: string, bool: boolean) => `${word}${bool ? 's' : ''}`;
export const formatUser = (user: User) => `${user} ${user.tag} (${user.id})`;
export const insertFullStop = (str: string) => str.endsWith('.') ? str : `${str}.`;

export enum SQLQueryTypes {
	INSERT = 'INSERT',
	SELECT = 'SELECT',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}

export enum SentinelColors {
	GREEN = 0x00FF00,
	RED = 0xFF0000,
	LIGHT_BLUE = 0x0066ff,
	ORANGE = 0Xff873d
}

export enum ModerationTypes {
	BAN, KICK, MUTE, WARN, SOFTBAN
}

export const EMBED_TIP = '*TIP: if you give me the `Embed Links` Permission I can display this in an embed!*';
export const DEFAULT_REASON = 'No reason provided.';

export const CommandResponses = {
	CLIENT_MISSING_PERMISSIONS: (clientPermissions: Permissions, guildPermissions: Permissions) => {
		const resp = [];
		if (clientPermissions.bitfield !== 0) resp.push(`${cleanPermissions(clientPermissions)} for this channel`);
		if (guildPermissions.bitfield !== 0) resp.push(`${cleanPermissions(guildPermissions)} for the guild`);
		return `I require ${resp.join(' and ')}.`;
	},
	UPDATED_CONFIG: (item: string) => `Updated the ${item}.`,
	NO_IMPLEMENTATION: (args: string[]) => [
		'This command has no implementation method, args:',
		args.map(arg => `\`${arg}\``).join(', ')
	],
	HELLO_WORLD: () => 'Hello world!',
	ADDED_CONFIG: () => 'Setup the configuration for your server!',
	VIEW_CONFIG: (config: GuildConfig, hasEmbed: boolean) => {
		const { guild, client } = config;
		const description = [
			`Prefix: ${config.prefix ?? `Default Prefix (${client.config.defaultPrefix})`}`,
			`Auto Mod enabled?: ${config.autoMod ? 'Yes' : 'No'}`,
			`Admin Roles: ${config.adminRoleIDs ? config.adminRoles!.join(', ') : 'None set'}`,
			`Moderator Roles: ${config.modRoleIDs ? config.modRoles!.join(', ') : 'None set'}`,
			`Join Messages: ${config.memberJoinsChannelID
				? config.memberJoinsChannel ?? 'Channel Deleted'
				: 'Disabled'
			}`,
			`Leave Messages: ${config.memberLeavesChannelID
				? config.memberLeavesChannel ?? 'Channel Deleted'
				: 'Disabled'
			}`,
			`Logs Channel: ${config.logsChannelID
				? config.logsChannel ?? 'Channel Deleted'
				: 'Disabled'
			}`,
			'',
			`You can use \`${config.prefix ?? client.config.defaultPrefix}settings edit [key] [newValue]\` to change any of these.`
		];
		if (!hasEmbed) {
			description.unshift(EMBED_TIP);
			return description;
		}
		return new MessageEmbed()
			.setAuthor(`${guild!.name} Config`, guild!.iconURL({ dynamic: true }) ?? undefined)
			.setColor(SentinelColors.LIGHT_BLUE)
			.setDescription(description)
			.setFooter('Sentinel');
	},
	MEMBER_JOINED: (member: GuildMember) => {
		const { guild, user } = member;
		return new MessageEmbed()
			.setAuthor(guild.name, guild.iconURL({ dynamic: true }) ?? undefined)
			.setColor(SentinelColors.GREEN)
			.setDescription('New Member Joined')
			.setFooter('Sentinel')
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.setTimestamp()
			.addFields({
				name: 'User / ID',
				value: `${user.tag} / ${user.id}`
			},
			{
				name: 'Account Created At',
				value: moment.utc(user.createdAt).format(DEFAULT_TIME_FORMAT)
			},
			{
				name: 'New Member Count',
				value: guild.memberCount
			});
	},
	MEMBER_LEFT: (member: GuildMember) => {
		const { guild, user } = member;
		return new MessageEmbed()
			.setAuthor(guild.name, guild.iconURL({ dynamic: true }) ?? undefined)
			.setColor(SentinelColors.RED)
			.setDescription('Member Left')
			.setFooter('Sentinel')
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.setTimestamp()
			.addFields({
				name: 'User / ID',
				value: `${user.tag} / ${user.id}`
			}, {
				name: 'Account Created At',
				value: moment.utc(user.createdAt).format(DEFAULT_TIME_FORMAT)
			}, {
				name: 'Originally Joined At',
				value: moment.utc(member.joinedAt).format(DEFAULT_TIME_FORMAT)
			}, {
				name: 'New Member Count',
				value: guild.memberCount
			});
	},
	GUILD_CREATE_LOG: (guild: Guild) => {
		const owner = guild.client.users.cache.get(guild.ownerID);
		const embed = new MessageEmbed()
			.setColor(SentinelColors.GREEN)
			.setDescription('New guild added')
			.setFooter('Sentinel')
			.setTimestamp()
			.addFields({
				name: 'Guild Name / ID',
				value: `${guild.name} / ${guild.id}`
			}, {
				name: 'Guild Owner',
				value: owner ? formatUser(owner) : guild.ownerID
			}, {
				name: 'Member Count',
				value: `Members: ${guild.memberCount}`
			});
		const iconURL = guild.iconURL({ dynamic: true });
		if (iconURL) embed.setThumbnail(iconURL);
		return embed;
	},
	GUILD_REMOVE_LOG: (guild: Guild) => {
		const owner = guild.client.users.cache.get(guild.ownerID);
		const embed = new MessageEmbed()
			.setColor(SentinelColors.RED)
			.setDescription('Bot removed from guild')
			.setFooter('Sentinel')
			.setTimestamp()
			.addFields({
				name: 'Guild Name / ID',
				value: `${guild.name} / ${guild.id}`
			}, {
				name: 'Guild Owner',
				value: owner ? formatUser(owner) : guild.ownerID
			}, {
				name: 'Member Count',
				value: `Members: ${guild.memberCount}`
			});
		const iconURL = guild.iconURL({ dynamic: true });
		if (iconURL) embed.setThumbnail(iconURL);
		return embed;
	},
	MESSAGE_DELETE_LOG: (message: Message | PartialMessage) => {
		return new MessageEmbed()
			.setColor(SentinelColors.LIGHT_BLUE)
			.setDescription('Message Deleted')
			.setFooter('Sentinel')
			.setTimestamp()
			.addFields({
				name: 'Message Content',
				value: message.content === null
					? 'Content uncached' : (message.content || 'No Content')
			}, {
				name: 'Deleted In',
				value: message.channel.toString(),
				inline: true
			}, {
				name: 'Author',
				value: message.author
					? formatUser(message.author)
					: 'Unknown User',
				inline: true
			});
	},
	MESSAGE_UPDATE_LOG: (oldMessage: Message | PartialMessage, newMessage: Message) => {
		return new MessageEmbed()
			.setColor(SentinelColors.LIGHT_BLUE)
			.setDescription('Message Updated')
			.setFooter('Sentinel')
			.setTimestamp()
			.addFields({
				name: 'Old Message',
				value: oldMessage.content === null
					? 'Content uncached' : (oldMessage.content || 'No Content')
			}, {
				name: 'New Message',
				value: newMessage.content || 'No Content'
			}, {
				name: 'Author',
				value: formatUser(newMessage.author)
			});
	},
	REMOVED_USER_LOG: (action: ModerationTypes.BAN | ModerationTypes.KICK, moderator: GuildMember, users: User[], reason: string) => {
		const isBan = action === ModerationTypes.BAN;
		const text = plural('User', users.length > 1);
		return new MessageEmbed()
			.setColor(isBan ? SentinelColors.RED : SentinelColors.ORANGE)
			.setAuthor(`${text} ${isBan ? 'banned' : 'kicked'}`, moderator.guild.iconURL({ dynamic: true }) ?? undefined)
			.setFooter('Sentinel')
			.setTimestamp()
			.addFields({
				name: `${isBan ? 'Banned' : 'Kicked'} ${text}:`,
				value: users.map(user => formatUser(user))
			}, {
				name: 'Moderator Responsible',
				value: formatUser(moderator.user)
			}, {
				name: 'Reason',
				value: reason ? insertFullStop(reason) : DEFAULT_REASON
			});
	},
	REMOVED_USER: (action: ModerationTypes.BAN | ModerationTypes.KICK, users: User[], reason: string) => {
		return `${action === ModerationTypes.BAN ? 'Banned' : 'Kicked'} ${
			users.length === 1 ? users[0].tag : `${users.length} Users`
		} for ${reason ? insertFullStop(reason) : DEFAULT_REASON}`;
	},
	INVITES_NOT_ALLOWED: (user: User) => ({
		allowedMentions: {
			users: [user.id]
		},
		content: `Sorry ${user}, you're not allowed to send invites here!`
	}),
	CLIENT_INVITE: (invite: String) => {
		return new MessageEmbed()
			.setColor(SentinelColors.LIGHT_BLUE)
			.setTitle('Thank you for choosing Sentinel.')
			.setDescription(`Click [HERE](${invite}) to invite Sentinel`)
			.setTimestamp();
	},
	HELP_PAGE: (desc: string[] | string, index = 1, maxPages = index) => {
		return new MessageEmbed()
			.setColor(SentinelColors.LIGHT_BLUE)
			.setAuthor(`Page ${index}/${maxPages}`)
			.setDescription(desc)
			.setFooter('Sentinel | <> = Not Required | [] = Required')
			.setTimestamp();
	},
	SUGGESTION_RESPONSE: () => 'Thank you for your suggestion, my developers will look into this!',
	SUGGESTION_LOG: (user: User, suggestion: string) => {
		return new MessageEmbed()
			.setColor(SentinelColors.LIGHT_BLUE)
			.setAuthor('New Suggestion')
			.setTimestamp()
			.addFields({
				name: 'Suggested By',
				value: formatUser(user)
			}, {
				name: 'Suggestion',
				value: suggestion
			});
	},
	USER_AVATAR: (user: User) => {
		const avatarURL = user.displayAvatarURL({ dynamic: true });
		return new MessageEmbed()
			.setColor(SentinelColors.LIGHT_BLUE)
			.setAuthor(`${user.username}'s avatar`, avatarURL)
			.setDescription(`[Direct Link](${avatarURL}).`)
			.setImage(avatarURL)
			.setTimestamp();
	},
	GUILD_STATS: (guild: Guild) => {
		const [textChannels, otherTypes] = guild.channels.cache.partition(ch => ch.type === 'text');
		const owner = guild.client.users.cache.get(guild.ownerID);
		return new MessageEmbed()
			.setColor(SentinelColors.LIGHT_BLUE)
			.setAuthor(`${guild} information`, guild.iconURL({ dynamic: true }) ?? undefined)
			.setFooter('Sentinel')
			.setTimestamp()
			.addFields({
				name: 'Guild Overview:',
				value: [
					`> Name: ${guild.name}`,
					`> ID: ${guild.id}`,
					`> Owner: ${owner ? formatUser(owner) : guild.ownerID}`,
					`> Region: ${guild.region}`,
					`> Boost Tier: ${guild.premiumTier ? `Tier ${guild.premiumTier}` : 'None'}`,
					`> Creation Time: ${moment(guild.createdAt).format(DEFAULT_TIME_FORMAT)}`
				],
				inline: true
			}, {
				name: 'Guild Stats:',
				value: [
					`> Member Count: ${guild.memberCount}`,
					`> Total Roles: ${guild.roles.cache.size}`,
					`> Total Text Channels: ${textChannels.size}`,
					`> Total Voice Channels: ${otherTypes.filter(ch => ch.type === 'voice').size}`,
					`> Total Emoji Count: ${guild.emojis.cache.size}`,
					`> Total Boosts: ${guild.premiumSubscriptionCount ? `${guild.premiumSubscriptionCount} ${plural('boost', guild.premiumSubscriptionCount > 1)}` : 'None'}`
				],
				inline: true
			});
	},
	WHOIS: (member: GuildMember) => {
		const { user } = member;
		const avatarURL = user.displayAvatarURL({ dynamic: true });
		const roles = member.roles.cache;
		roles.delete(member.guild.id);
		return new MessageEmbed()
			.setColor(member.displayColor || SentinelColors.LIGHT_BLUE)
			.setThumbnail(avatarURL)
			.setAuthor(`${user.tag} information`)
			.setTimestamp()
			.addFields({
				name: 'User information',
				value: [
					`> Username: ${user.username}`,
					`> Discriminator: ${user.discriminator}`,
					`> ID: ${user.id}`,
					`> Avatar Link: [Link to avatar](${avatarURL})`,
					`> Time Created: ${moment(user.createdTimestamp).format(DEFAULT_TIME_FORMAT)}`,
					`> Status: ${user.presence.status}`
				],
				inline: true
			}, {
				name: 'Member information',
				value: [
					`> Time Joined: ${moment(member.joinedAt).format(DEFAULT_TIME_FORMAT)}`,
					`> Roles: ${roles.size > 0 ? roles.array().join(', ') : 'No Roles'}`,
					`> Last Message: ${member.lastMessage ? `[Message](${member.lastMessage.url})` : 'Unknown'}`
				],
				inline: true
			});
	},
	LOOKUP: (data: IPData) => {
		return new MessageEmbed()
			.setColor(SentinelColors.LIGHT_BLUE)
			.addFields({
				name: 'Address',
				value: data.query || 'Unknown',
				inline: true
			}, {
				name: 'ISP',
				value: data.isp || 'Unknown',
				inline: true
			}, {
				name: 'Country',
				value: data.country || 'Unknown',
				inline: true
			}, {
				name: 'Region',
				value: data.regionName || 'Unknown',
				inline: true
			}, {
				name: 'City',
				value: data.city || 'Unknown',
				inline: true
			}, {
				name: 'Timezone',
				value: data.timezone || 'Unknown',
				inline: true
			}, {
				name: 'ZIP',
				value: data.zip || 'Unknown',
				inline: true
			}, {
				name: 'Latitude',
				value: data.lat ?? 'Unknown',
				inline: true
			}, {
				name: '	Longitude',
				value: data.lon ?? 'Unknown',
				inline: true
			}, {
				name: 'ORG',
				value: data.org || 'Unknown',
				inline: true
			})
			.setFooter('Sentinel')
			.setTimestamp();
	}
};

export const CommandErrors = {
	CUSTOM_MESSAGE: (message: StringResolvable) => DJSUtil.resolveString(message),
	NO_PERMISSION: (message?: string) => message ?? 'You don\'t have permissions to use this command!',
	SAY_NO_ARGS: () => 'Please provide something to say!',
	INVALID_MODE: (modes: string[], provided?: string) => `${
		provided
			? `Mode \`${provided}\` is not a valid mode for this command`
			: 'Please provide a mode for this command'
	}, try one of ${modes.slice(0, -1).map(mode => `\`${mode}\``).join(', ')}, or \`${modes[modes.length - 1]}\`.`,
	INVALID_SETTING: (settings: string[]) => `You haven't provided a valid setting to modify, try one of ${
		settings.slice(0, -1).map(setting => `\`${setting}\``).join(', ')
	}, or \`${settings[settings.length - 1]}\`.`,
	MENTION_MEMBER: (action: string, multiple = false) =>
		`Please provide a valid member ${multiple ? 'or members ' : ''}to ${action}.`,
	NOT_MANAGEABLE: (action: ModerationTypes, { byBot = false, single = true } = {}) =>
		`${byBot ? 'I' : 'You'} cannot ${ModerationTypes[action]} ${single ? 'that member' : 'one or more of those members'}.`,
	SETUP_CONFIG: (prefix: string) => `This guild needs its config setup before using this command, use ${prefix}\`settings setup\``,
	PROVIDE_SUGGESTION: () => 'Please provide something to suggest!',
	SUGGESTION_LENGTH: () => 'That suggestion was too long, the max length is 1024 characters.',
	DICTIONARY_PROVIDE_ARGS: () => 'Please provide a word to lookup!',
	UNKNOWN_USER: (idOrContent: string, isID = true) => `A user ${isID ? 'ID' : 'mention'} provided could not be resolved to a valid user (${idOrContent}).`,
	UNKNOWN_MEMBER: (idOrContent: string, isID = true) => `A member ${isID ? 'ID' : 'mention'} provided could not be resolved to a valid member (${idOrContent}).`,
	PROVIDE_IP: () => 'Please provide a valid IP to lookup.'
};

export const URLs = {
	HASTEBIN: (endpointOrID: string) => `https://paste.nomsy.net${endpointOrID ? `/${endpointOrID}` : ''}`,
	IP_API: (query: string, fields: number) => `http://ip-api.com/json/${query}?fields=${fields}`
};
