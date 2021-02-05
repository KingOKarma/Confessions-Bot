import {
  GuildMember, Message, MessageEmbed, TextChannel,
} from 'discord.js';
import * as commando from 'discord.js-commando';
import { nanoid } from 'nanoid';
import { CONFIG } from '../../globals';
// Creates a new class (being the command) extending off of the commando client
export default class confessCommand extends commando.Command {
  constructor(client: commando.CommandoClient) {
    super(client, {
      name: 'confess',
      // Creates aliases
      aliases: ['confession'],
      // This is the group the command is put in
      group: 'confess',
      // This is the name of set within the group (most people keep this the same)
      memberName: 'confess',
      description: 'I can say whatever the user wants!',
      // Ratelimits the command usage to 3 every 5 seconds
      throttling: {
        usages: 3,
        duration: 5,
      },
    });
  }

  // Now to run the actual command, the run() parameters need to be defiend (by types and names)
  public async run(
    msg: commando.CommandoMessage,
  ): Promise<Message | Message[]> {
    // Deletes command usage
    if (msg.guild !== null) {
      msg.delete();
      msg.say('Please make your confession in my dms, you wouldn\'t want the person to find out would you <:CCCuteBlush:680897393813749761>');
    }

    const guild = await this.client.guilds.fetch(CONFIG.guildID);
    let targetUser: GuildMember;
    const filter = (message: Message) => !message.author.bot;

    msg.say('Please send the ID of the user that you want to confess to').then(() => {
      msg.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })

        .then(async (userID) => {
          const message = userID.first();
          if (message === undefined) {
            return msg.author.send('Please dont leave your message blank');
          }

          if (!message.content.match(/^\d{18}$/)) {
            return msg.author.send('Please send the **ID** of a user, use the link above to find out how');
          }

          const member = await guild.members.fetch(message.content);

          if (member === undefined) {
            return msg.author.send('I couldn\'t find that user, try again by saying `confess`');
          }

          if ((member).user.id === msg.author.id) {
            return msg.author.send('Why are you trying to confess to yourself? try again by saying `confess`');
          }

          targetUser = member;
          return msg.author.send(`Pog now we have \`${targetUser.user.tag}\` i need the message you want to send to that user, you can type \`cancel\``
          + ' if you wish to cancel')
            .then(() => {
              msg.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
                .then(async (confessMsg) => {
                  const ConfessMsg = confessMsg.first();

                  if (ConfessMsg === undefined) {
                    return msg.author.send('You need to write out your confesison message, restarting...');
                  }

                  if (ConfessMsg.content.length >= 2048) {
                    return msg.author.send('Sorry, confessions can only be 2048 characters long, restarting...');
                  }

                  if (ConfessMsg.content.toLowerCase() === 'cancel') {
                    return msg.author.send('Alright then, have a nice day! :D');
                  }

                  return msg.author.send(`So you're telling me you want to say \n\n\`\`\`${ConfessMsg.content}\`\`\`\n\n right?\n Please respond with either \`yes\` or \`no\``)
                    .then(() => {
                      msg.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
                        .then(async (confirmation) => {
                          const confirm = confirmation.first();

                          if (confirm === undefined) {
                            return msg.author.send('Please write either `yes` or `no` next time, restarting...');
                          }

                          let theCase;

                          switch (confirm.content.toLowerCase()) {
                            case 'no':
                              theCase = false;
                              break;

                            case 'yes':
                              theCase = true;
                              break;

                            default:
                              theCase = false;
                              msg.author.send('I didn\'t find a `yes` or `no` so i canceled the confession');
                          }

                          if (theCase === false) {
                            return msg.author.send('Alright then, have a nice day! :D');
                          }

                          const channel = guild.channels.cache.get(
                            CONFIG.confessionChannelID,
                          ) as TextChannel;

                          if (channel === undefined) {
                            return msg.author.send('There seems to be a problem, please contact staff');
                          }

                          msg.author.send(`Your confessions should have been sent to ${channel}, if not please contact staff!`);

                          let embedColour;
                          embedColour = '0xffffff';

                          if (guild.me === null) {
                            embedColour = guild.me!.displayColor;
                          }

                          const uniqueID = nanoid();

                          const embed = new MessageEmbed()
                            .setAuthor(member.user.tag, member.user.displayAvatarURL(
                              { dynamic: true },
                            ))
                            .setTitle('You have been confessed to!')
                            .setDescription(ConfessMsg.content)
                            .setColor(embedColour)
                            .setTimestamp()
                            .setFooter(uniqueID);

                          channel.send(member, { embed });
                          const logsChannel = guild.channels.cache.get(
                            CONFIG.staffChannelID,
                          ) as TextChannel;

                          if (channel === undefined) {
                            return msg.author.send('There seems to be a problem, please contact staff');
                          }

                          const logsEmbed = new MessageEmbed()
                            .setAuthor(member.user.tag, member.user.displayAvatarURL(
                              { dynamic: true },
                            ))
                            .setTitle(`Confession log ${uniqueID}`)
                            .setDescription(`**${msg.author.tag}**/${msg.author} confessed towards **${member.user.tag}**/${member} `)
                            .setColor(embedColour)
                            .setTimestamp()
                            .setFooter(uniqueID);

                          return logsChannel.send(member, { embed: logsEmbed });
                        });
                    });
                });
            });
        })

        .catch(() => msg.author.send('Guess there was a problem so I\'m just going to restart...'));
    });

    // Responds with whatever the user has said.
    return msg.say('If you do not know how to get ID\'s from users then read from here:\n'
      + '<https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID>');
  }
}
