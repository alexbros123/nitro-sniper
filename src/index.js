const { Util: djsUtil } = require('discord.js');

async function init() {
   const Constants = require('./lib/Constants');
   const Webhook = require('./lib/Webhook');
   const Logger = require('./lib/Logger');
   const modes = require('./modes/index');
   const Util = require('./lib/Util');
   const chalk = require('chalk');
   const phin = require('phin');

   require('dotenv').config();

   console.log(chalk.green(`
                                           ╓╖,
               g▄▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▄╬╣╣╣╢╬N╖
              ▐▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╣╣╣╣╣╣╣╣╣╢╣╣@,
               ▀▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╣╣╣╣╣╣╣╢╢╣╣╣╣╣@,
                        ╙▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╣╣╣╣╣╣╢╣╣╣╣╣╣╣╣╣╣W
                        g▓▓▓▓▓▓╢▓▓▓▓╩╨╨╩╬╣╢╣╢╣▒╣╣╣╣╣╣╣╣╣╣╣╣
 Æ▓▓▓▓⌐   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╢▓▓╝⌠░░░░░░░░░░╙╨╣╣╣╣╣╣╣╣╣╣╣╣╣╣╣
 ╙▀▓▓▀    ╙▀▓▓▓▓▓▓▓▓▓▓▓▓▓▓╢▓▓╩░░░░░░░░░░░░░░░░╙╣╣╣╣╣╣╣╣╣╣╣╣╣@
                     ▓▓▓▓╢▓▓░░░░░╓╢▒▒▒▒▒▒╢░░░░░╙╣╣╣╣╣╣╣╣╣╣╣╣╢
               g▄▄▄▄▄▓▓▓▓▓▓Ñ░░░░║▒▒▒▒▒▒▒▒▒▒╖░░░░║╣╣╣╣╣╣╣╣╣╣╣╣⌐
              ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░║▒▒▒▒▒▒▒▒▒▒▒▒▒░░░]╣╣╣╣╣╣╣╣╣╣╣╣⌐
               ╙╙▐▓▓▓▓▓▓▓▓▓@░░░░╙▒▒▒▒▒▒▒▒▒▒╜░░░░║╣╣╣╣╣╣╣╣╣╣╣╣
                  ▓▓▓▓▓▓▓╣▓▓░░░░░╙▒▒▒▒▒▒▒▒░░░░░╓╣╣╣╣╣╣╣╣╣╣╣╣Ñ
                  ╚▓▓▓▓▓▓▓▓▓▓@░░░░░░░░░░░░░░░░░░░╢╣╣╣╣╣╣╣╣╣╣
                   ▐▓▓▓▓▓▓▓▓╢▓▓@µ░░░░░░░░░░╓@░░░░░░╙╣╣╣╣╣╣╢\`
                    ╙▓▓▓▓▓▓▓▓▓▓╢▓▓▓▓@@@@▓▓▓▓╢▓▄░░░░░░░╜╨╣╢░
                      ▀▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▄░░░░░░░▒
                         ▀▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓╜\"░▒░\"
                           ▀▀▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▀╩
                               ╙╙▀▀▀▓▓▓▓▀▀▀╙╙
   `));

   global.active = [];
   global.webhook = null;
   global.constants = Constants;
   global.util = Util;
   global.logger = new Logger({ debug: false });
   global.pSourceId = null;

   try {
      global.settings = JSON.parse(process.env.settings);
   } catch {
      return logger.critical(constants.invalidConfig);
   }

   global.settings = djsUtil.mergeDefault(constants.defaultSettings, settings);

   if (!settings.mode) return logger.critical(constants.noMode);
   if (!Object.keys(modes).includes(settings.mode)) return logger.critical(constants.invalidMode);

   // Init selected mode
   await modes[settings.mode]();

   if (!active.length) return logger.critical(constants.invalidTokens);

   let guildCount = active
      .map((s) => s.guilds.cache.size)
      .reduce((a, b) => a + b, 0);

   let res = await phin({
      url: constants.paymentSourceURL,
      method: 'GET',
      parse: 'json',
      headers: {
         'Authorization': settings.tokens.main,
         'User-Agent': constants.userAgent
      }
   });

   if (!res.body || res.body?.length === 0) {
      logger.warn(constants.noPaymentMethod);
   } else if (res.body[0]) {
      global.pSourceId = res.body[0].id;
   } else {
      logger.warn(constants.paymentMethodFail(res.body));
   }

   if (settings.webhook?.url) {
      const webhookToken = /[^/]*$/.exec(settings.webhook.url)[0];
      const webhookId = settings.webhook.url.replace(/^.*\/(?=[^\/]*\/[^\/]*$)|\/[^\/]*$/g, '');
      global.webhook = new Webhook(webhookId, webhookToken);
   }

   return logger.success(constants.ready(active.length, guildCount));
}

init();