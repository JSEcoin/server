/**
 * @module emails
 * @description Onboarding autoresponder email series
*/
const emails = {};
const fs = require('fs');

let miscDir = './misc';
if (!fs.existsSync(miscDir)) {
  miscDir = './../misc';
  if (!fs.existsSync(miscDir)) {
    console.log('Misc directory not found, email.js error 12');
  }
}

emails.suppression = require('./../misc/suppression.json');

/* Standard email template */
/* Requires $heading and $content, also includes sendgrid optout link */
emails.template = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html style="margin: 0;padding: 0;" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title></title>
  <meta name="viewport" content="width=device-width">
  <link href="https://fonts.googleapis.com/css?family=Nunito" rel="stylesheet" type="text/css">
</head>
<body style="font-family: Nunito, Arial, sans-seif; font-size: 13px; width: 100%; background: #F9F9F9; text-align: center; margin: 0px; padding: 0px;">
  <div style="width: 50%; min-width: 300px; padding: 0; margin: 0 auto;">
    <a href="https://jsecoin.com" style="text-decoration:none;">
      <img src="https://jsecoin.com/img/logoemail.png" style="height: 25px; width: 125px; margin-top: 1%;" alt="JSEcoin" />
      <div style="font-size: 10px; color: #AAAAAA; margin-bottom: 1%;">JAVASCRIPT EMBEDDED CRYPTOCURRENCY</div>
    </a>
  </div>
  <div style="width: 100%; margin: 0 auto; background: #FFFFFF; color: #444444;">
    <div style="width: 50%; min-width: 300px; padding: 0% 2%; text-align: left; margin: 0 auto;">
      <div style="margin-bottom: 10px;">
        <img align="center" border="0" src="https://jsecoin.com/img/emailheader.png" alt="JSEcoin.com" title="JSEcoin.com" style="outline: none;text-decoration: none;-ms-interpolation-mode: bicubic;clear: both;display: block !important;border: 0;height: auto;float: none;width: 100%;">
      </div>
      <h1 style="font-size: 15px; text-transform: uppercase;">$heading</h1>
      <div>
      $content
      </div>
      <br>Kind regards,<br><br>The JSE Team<br><br>
      <hr style="border-top: 1px solid #CCCCCC;">
      <a href="https://jsecoin.com/"><img src="https://jsecoin.com/img/logoemail.png" style="float: left; height: 25px; width: 125px;" alt="JSEcoin" /></a>
      <div id="social-icons" style="float: right;">
        <div class="social-icon" style="margin:5px; float: right;"><a href="https://t.me/jsetelegram"><img src="https://jsecoin.com/img/telegram@2x.png" alt="Telegram" style="height: 26px; width: 26px; filter: grayscale(50%);" /></a></div>
        <div class="social-icon" style="margin:5px; float: right;"><a href="https://discord.gg/3gBZsA4"><img src="https://jsecoin.com/img/discord@2x.png" alt="Discord" style="height: 26px; width: 26px; filter: grayscale(50%);" /></a></div>
        <div class="social-icon" style="margin:5px; float: right;"><a href="https://www.youtube.com/channel/UCHtIF9KggJn9TDzr8pRYsYA"><img src="https://jsecoin.com/img/youtube@2x.png" alt="Youtube" style="height: 26px; width: 26px; filter: grayscale(50%);" /></a></div>
        <div class="social-icon" style="margin:5px; float: right;"><a href="https://www.reddit.com/r/JSEcoin_Official/"><img src="https://jsecoin.com/img/reddit@2x.png" alt="Reddit" style="height: 26px; width: 26px; filter: grayscale(50%);" /></a></div>
        <div class="social-icon" style="margin:5px; float: right;"><a href="https://twitter.com/jsecoin"><img src="https://jsecoin.com/img/twitter@2x.png" alt="Twitter" style="height: 26px; width: 26px; filter: grayscale(50%);" /></a></div>
        <div class="social-icon" style="margin:5px; float: right;"><a href="https://www.facebook.com/officialjsecoin"><img src="https://jsecoin.com/img/facebook@2x.png" alt="Facebook" style="height: 26px; width: 26px; filter: grayscale(50%);" /></a></div>
      </div>
      <div style="clear: both;"></div>
      <div style="color: #AAA; font-size: 11px;">
        <div style="font-size: 13px;">JSEcoin Ltd</div>
        Cambridgeshire, United Kingdom.<br>
        Registered in England No. 10940920 - Dun and Bradstreet No. 100233913837
        <ul>
          <li><a style="color: #AAA; text-decoration: none;" href="https://jsecoin.com/?utm_source=email&utm_campaign=nodemails">https://jsecoin.com</a></li>
          <li><a style="color: #AAA; text-decoration: none;" href="https://platform.jsecoin.com/?utm_source=email&utm_campaign=nodemails">https://platform.jsecoin.com</a></li>
          <li><a style="color: #AAA; text-decoration: none;" href="https://blockchain.jsecoin.com/?utm_source=email&utm_campaign=nodemails">https://blockchain.jsecoin.com</a></li>
        </ul>
        You have received this email because you have either registered via the platoform or subscribed to our newsletter or partners network channel.<br>
        <a href="https://platform.jsecoin.com">E-mail Settings</a> | <a href="https://jsecoin.com/en/legal/privacyPolicy">Privacy</a>
        <br><br>
      </div>
    </div>
  </div>
</body>
</html>`;

/* Template 1 - Onboading email template */
/* As above but includes P.S. Telegram link */
emails.template1 = emails.template.split(`<br><br>Kind regards,<br><br>The JSE Team<br><br>`).join(`<br><br>Kind regards,<br><br>The JSE Team<br><br>P.S. Questions? Join us on <a href="https://t.me/jsetelegram">Telegram</a> and let's continue our conversation there.`);

/* Template 2 - Onboading email template */
/* As above but includes different header image, team mug shots and P.S. Telegram link */
const template2Footer = `<br><br>Kind regards,<br><br>The JSE Team<br><br>
<a href="https://jsecoin.com/en/about/meetTheTeam/?utm_source=email&utm_campaign=nodemails">
  <img src="https://jsecoin.com/img/emailteam.png" alt="JSEcoin Ltd" style="width: 300px;" />
</a>
<br>
P.S. Questions? Join us on <a href="https://t.me/jsetelegram">Telegram</a> and let's continue our conversation there.
<br>`;
emails.template2 = emails.template.split(`https://jsecoin.com/img/emailheader.png`).join(`https://jsecoin.com/img/emailheader2.jpg`).split(`<br><br>Kind regards,<br><br>The JSE Team<br><br>`).join(template2Footer);

/* Welcome email with confirmation link */
/* Requires $uid, $confirmlink dynamic insertion */
emails.welcome = `Welcome to JSEcoin. You are user number $uid to join our group of cryptocurrency enthusiasts who want to see mass adoption of a greener, more sustainable cryptocurrency.
<br><br>
Please confirm your account using this link: <a href="$confirmlink">$confirmlink</a>
<br><br>
Getting started is easy, you can send transactions, export coin codes, try the mining and earn JSE while you work, play and surf the web.
<br><br>
Take a look at the <a href="https://jsecoin.com/en/support/FAQ/">Frequently Asked Questions</a> support site which answers common questions.
<br><br>
The platform is designed to be intuitive and the best way to get up to speed is to try it out.
<br><br>
Thank you for being a JSEcoin early adopter.
`;

emails.onboarding = {};

/* Onboarding 1 - Plans For The Future */
emails.onboarding[1] = {};
emails.onboarding[1].subject = `Plans For The Future`;
emails.onboarding[1].html = `Try and find a programmer who understands blockchain technology and doesn’t think it will change the world.
<br><br>
Bitcoin opened the doors to the idea that we don’t have to depend on government backed traditional cryptocurrencies. All government currency goes down in value/purchasing power (known as inflation) and this has been accepted as the norm for too long. Poor fiscal decisions and quantitative easing (printing money) have only added to the downward slide. Look at your current savings and what you would have been able to buy with it just 20 years ago.
<br><br>
Bitcoin was built in 2008 and the competitive nature of the proof of stake algorithm means that the network now consumes a huge amount of power (more than the entire population of Ireland). JSEcoin is different, it uses surplus resources that would otherwise be wasted, powering a blockchain with a minimal carbon footprint. This may not seem important now but as more people adopt the technology, prices will inflate and traditional miners will be demanding even more electrical consumption. This in our opinion is unsustainable in the long-term and we are working to build a better, more scalable solution.
<br><br>
The ultimate goal for the JSEcoin project is to reach mass adoption. When you can purchase everyday goods online, in store and anywhere else with JSE, our vision will be accomplished. Things in the blockchain sector are moving fast and I believe we will see this happen in the next decade with one cryptocurrency standing out as a market leader. JSEcoin can be that market leader and the team here are working towards that goal.
`;

/* Onboarding 2 - How To Send Funds With JSEcoin */
emails.onboarding[2] = {};
emails.onboarding[2].subject = `How To Send Funds With JSEcoin`;
emails.onboarding[2].html = `JSEcoin is not just a store of value but a live ecosystem of open transactions.
<br><br>
Sending funds to and from anywhere in the world is free, there are no transfer fees. It doesn’t matter if you are sending 0.1 JSE or 1,000,000 JSE there are no costs and the transaction goes through in around 30 seconds due to our fast block times.
<br><br>
You can send funds to anyone with an account. In the following demo we are going to use the charity account which we use for testing charity@jsecoin.com
<br><br>
<b>Step 1</b> - Log in to the platform at <a href="https://platform.jsecoin.com/?utm_source=email&utm_campaign=emailonboarding&utm_content=onboardingTransfer">https://platform.jsecoin.com</a><br>
<b>Step 2</b> - Click on the transfer menu button on the left hand navigation bar<br>
<b>Step 3</b> - Enter charity@jsecoin.com in the first field<br>
<b>Step 4</b> - Enter an amount less than your balance and an optional reference<br>
<b>Step 5</b> - Click “Transfer Funds” and you’ll be prompted for your pin number<br>
<b>Step 6</b> - Enter your pin and confirm the transaction<br>
<br>
We’ve made it as simple as possible to send cryptocurrency payments online. Behind the scenes we have ECDSA cryptography signed within the web browser making transactions safe and secure.
<br><br>
The next time you send money from A to B, consider the benefits of using JSE.
`;

/* Onboarding 3 - How To Purchase JSE Tokens */
/* Requires PDF attachment */
emails.onboarding[3] = {};
emails.onboarding[3].subject = `How To Purchase JSE Tokens`;
emails.onboarding[3].html = `Like the JSEcoin project? You can purchase JSE tokens at the following exchanges:
<ul>
<li><a href="https://idex.market">IDEX</a></li>
<li><a href="https://bit.ly/2NV1eOW">LATOKEN</a></li>
</ul>
<br><br>
You will need to purchase some ethereum to load on to the trading exchange via a broker such as <a href="https://coinbase.com">coinbase</a>. Once you have some ethereum simply set up an account with the exchange of your choice and then load transfer the ethereum funds to your deposit address on the exchange. You can then use the trading platform to trade your ETH for JSE tokens.
<br><br>
There is both deposit and withdraw functions on the platform funds page to transfer JSE to and from exchanges and ERC20 compatible wallets.
<br><br>
Thank you to everyone who has supported the JSEcoin project. We are where we are today because of the strong support from the cryptocurrency community.
`;

/* Onboarding 4 - Why transparency is important to the JSE project */
emails.onboarding[4] = {};
emails.onboarding[4].subject = `Why transparency is important to the JSE project`;
emails.onboarding[4].html = `An ICO (initial coin offering) is the crypto equivalent of an IPO (initial public offering). However the same regulatory requirements don’t apply to ICO’s. Blockchain technology is built around trustless networks but trust is still required whether that be in the developers, the software or the project as a whole.
<br><Br>
JSEcoin aims to build trust by operating transparently and ethically in the way a public company should. Some of the steps we take to achieve this are:
<ul>
<li>We publish public monthly accounts at <a href="https://jsecoin.com/category/accounts/?utm_source=email&utm_campaign=emailonboarding&utm_content=onboardingTransparency">https://jsecoin.com/category/accounts/</a></li>
<li>We don’t purchase fake users for our social channels</li>
<li>Our code is open-sourced and free to explore: <a href="https://github.com/JSEcoin">https://github.com/JSEcoin</a></li>
<li>The core team post regular updates on the Youtube channel: <a href="https://goo.gl/4Lz6SZ">https://goo.gl/4Lz6SZ</a></li>
</ul>
We are lucky enough to have a great community of users and we uphold the integrity that you should expect from a financial organization.
`;

/* Onboarding 5 - What We Are Building (whitepaper.pdf) */
/* Requires PDF attachment */
emails.onboarding[5] = {};
emails.onboarding[5].subject = `What We Are Building (whitepaper.pdf)`;
emails.onboarding[5].pdf = `whitepaper.pdf`;
fs.readFile(miscDir+'/whitepaper.pdf', function(err, preAttachmentData) { emails.onboarding[5].attachmentData = Buffer.from(preAttachmentData).toString('base64'); });
emails.onboarding[5].html = `JSEcoin is bridging the gap between web and blockchain technologies making a user-friendly platform that runs on a browser mined blockchain.
<br><br>
Our vision is for a future where everyday users can transfer funds around the world quickly, safely and without paying transaction fees. Cryptocurrency mining rewards should go to individual users rather than giant corporations and industrial mining pools. The platform should be intuitive and easy to use, even for non-technical users.
<br><br>
In 2008 the Bitcoin whitepaper was released setting in process a revolutionary new form of digital asset. JSEcoin most likely wouldn’t have been here if it wasn’t for this seminal work. Our goal is to improve upon the original design to create an eco friendly cryptocurrency that can reach billions of users across the globe. 
<br><br>
We have attached our own whitepaper which acts as a primer to the project. 
<br><br>
Please take a read when you get a chance and learn more about how JSEcoin can create a cryptocurrency revolution.
`;

/* Onboarding 6 - Meet the JSE Team */
emails.onboarding[6] = {};
emails.onboarding[6].subject = `Meet the JSE Team`;
emails.onboarding[6].html = `<table>
<tr><td style="padding: 5px;"><img src="https://jsecoin.com/img/team/james.png" style="height: 36px; width: 32px;" alt="James Bachini" /></td><td style="padding: 5px;">
<a href="https://www.linkedin.com/in/james-bachini/">James Bachini</a> - CEO<br>
James comes from a background in ad-tech and built the original proof of concept platform that went on to become JSEcoin. He previously launched two multi-million pound companies based around digital marketing and media buying.
</td></tr>
<tr><td style="padding: 5px;"><img src="https://jsecoin.com/img/team/john.png" style="height: 36px; width: 32px;" alt="John Sim" /></td><td style="padding: 5px;">
<a href="https://www.linkedin.com/in/johnrsim/">John Sim</a> - CTO<br>
John is our development guru. He is responsible for overseeing the constantly evolving code base and building JSEcoin's products. John has presented at conferences and events where he is widely accepted as a thought leader in UIX and intuitive modern design.
</td></tr>
<tr><td style="padding: 5px;"><img src="https://jsecoin.com/img/team/david.png" style="height: 36px; width: 32px;" alt="David Mallett" /></td><td style="padding: 5px;">
<a href="https://www.linkedin.com/in/david-mallett-308b19148/">David Mallett</a> - COO<br>
David leads our business operations and is responsible for overseeing technical support, social strategies and company outreach. His technical knowledge and kind manner make him the perfect face of JSEcoin.
</td></tr>
<tr><td style="padding: 5px;"><img src="https://jsecoin.com/img/team/tracey.png" style="height: 36px; width: 32px;" alt="Tracey Howard" /></td><td style="padding: 5px;">
<a href="https://www.linkedin.com/in/tracey-howard-12b60a163/">Tracey Howard</a> - CFO<br>
Tracey is a MATT qualified accounting technician and has more than twenty years experience in finance. She is responsible for budgeting, fund allocation and preparing the monthly accounts that we publish on our website.
</td></tr>
<tr><td style="padding: 5px;"><img src="https://jsecoin.com/img/team/amr.png" style="height: 36px; width: 32px;" alt="Amr Gawish" /></td><td style="padding: 5px;">
<a href="https://www.linkedin.com/in/agawish/">Amr Gawish</a> - Blockchain Developer<br>
Amr created our ERC20 contract which was given a best in class audit classification. His calm nature and exceptional development skills make him a huge asset to the project.
</td></tr>
<tr><td style="padding: 5px;"><img src="https://jsecoin.com/img/team/matthew.png" style="height: 36px; width: 32px;" alt="Matthew Vallis" /></td><td style="padding: 5px;">
<a href="https://www.linkedin.com/in/matthew-vallis-caia-a26054145/">Matthew Vallis</a> - CSO<br>
Matthew is a CAIA charter holder and is responsible for focusing the overall direction of the project. His influence in the London financial sector opens doors and builds our network.
</td></tr></table>
`;

/* Onboarding 7 - JSEcoin Pitch Deck */
/* Requires PDF attachment */
emails.onboarding[7] = {};
emails.onboarding[7].subject = `JSEcoin Pitch Deck`;
emails.onboarding[7].pdf = `pitchdeck.pdf`;
fs.readFile(miscDir+'/pitchdeck.pdf', function(err, preAttachmentData) { emails.onboarding[7].attachmentData = Buffer.from(preAttachmentData).toString('base64'); });
emails.onboarding[7].html = `I have attached the JSEcoin pitch deck outlining our project for investors.
<br><br>
JSE Tokens are available for purchase at the following exchanges:
<ul>
<li><a href="https://idex.market">IDEX</a></li>
<li><a href="https://bit.ly/2NV1eOW">LATOKEN</a></li>
</ul>
These exchanges are 3rd party platforms where cryptocurrency tokens are bought and sold. To make a purchase you will need some Ethereum from a broker such as <a href="https://coinbase.com">Coinbase</a> to load into account on the exchange.
<br><br>
Thank you to everyone who has supported the project and helped us progress towards building a brighter more sustainable digital economy.
`;

/* Onboarding 8 - Get JSEcoin updates on youtube, facebook, telegram or twitter */
emails.onboarding[8] = {};
emails.onboarding[8].subject = `Get JSEcoin updates on Youtube, Facebook, Telegram or Twitter`;
emails.onboarding[8].html = `You can connect with JSEcoin on social channels. Here’s a list of the top sites where you can keep up to date with JSE developments.
<ul>
<li><a href="https://twitter.com/jsecoin">https://twitter.com/jsecoin</a></li>
<li><a href="https://www.facebook.com/officialjsecoin">https://www.facebook.com/officialjsecoin</a></li>
<li><a href="https://t.me/jsetelegram">https://t.me/jsetelegram</a></li>
<li><a href="https://discord.gg/3gBZsA4">https://discord.gg/3gBZsA4</a></li>
<li><a href="https://bitcointalk.org/index.php?topic=2398571.0">https://bitcointalk.org/index.php?topic=2398571.0</a></li>
<li><a href="https://www.reddit.com/r/JSEcoin_Official/">https://www.reddit.com/r/JSEcoin_Official/</a></li>
<li><a href="https://steemit.com/@jsecoin">https://steemit.com/@jsecoin</a></li>
<li><a href="https://medium.com/@jsecoin/">https://medium.com/@jsecoin/</a></li>
<li><a href="https://www.youtube.com/channel/UCHtIF9KggJn9TDzr8pRYsYA">https://www.youtube.com/channel/UCHtIF9KggJn9TDzr8pRYsYA</a></li>
<li><a href="https://www.linkedin.com/company/jsecoin-ltd/">https://www.linkedin.com/company/jsecoin-ltd/</a></li>
<li><a href="https://github.com/jsecoin">https://github.com/jsecoin</a></li>
<li><a href="https://www.instagram.com/jsecoinltd/">https://www.instagram.com/jsecoinltd/</a></li>
</ul>
`;

/* Onboarding 9 - How Coincodes Work */
emails.onboarding[9] = {};
emails.onboarding[9].subject = `How Coincodes Work`;
emails.onboarding[9].html = `The JSEcoin platform includes a section for coincodes. This allows you to export tokens as a alphanumeric key. Any user including yourself can then import these tokens back in to their platform account.
<ul>
<li>This opens up a lot of possibilities, such as:</li>
<li>Sharing coincode giveaways on social media</li>
<li>Sending funds to someone that doesn’t have an account yet</li>
<li>Printing coincodes and storing in cold storage</li>
<li>Printing coincodes in birthday cards</li>
<li>Coincodes can be stored in escrow between parties</li>
<li>Send a coincode via email or text message</li>
</ul>
Coincodes open up a lot of opportunities that we are only just beginning to explore. Try exporting a small amount and importing it back into your account as a demonstration of how this works at <a href="https://platform.jsecoin.com/?utm_source=email&utm_campaign=emailonboarding&utm_content=onboardingCoincodes">https://platform.jsecoin.com</a>
`;

/* Onboarding 10 - Get paid to promote the JSE project with our referrals program */
emails.onboarding[10] = {};
emails.onboarding[10].subject = `Get paid to promote the JSE project`;
emails.onboarding[10].html = `Did you know you can earn JSE by helping spread the word about our project. 
<br><br>
It’s easy to do, simply log in to the platform at <a href="https://platform.jsecoin.com/?utm_source=email&utm_campaign=emailonboarding&utm_content=onboardingReferrals">https://platform.jseocoin.com</a>
<br><br>
Then click "Referrals" and choose a link to send or use the share button in the top right.
<br><br>
You will earn JSE for each new user that signs up via your link.
<br><br>
Ideas for where to place your link:
<ul>
<li>Facebook</li>
<li>Twitter</li>
<li>Reddit</li>
<li>Blog comments</li>
<li>Forums</li>
<li>Youtube comments</li>
<li>Create articles on Steem.it or Medium</li>
<li>Share with friends and colleagues via Whatsapp or Telegram</li>
</ul>
`;

/* Onboarding 11 - How to use the desktop app */
emails.onboarding[11] = {};
emails.onboarding[11].subject = `How to use the desktop app`;
emails.onboarding[11].html = `The desktop app includes a number of benefits over the web platform. The most important of which is the automatic miner. This can be setup to start mining as soon as you switch your computer on in the morning until the end of the day, in the background, without needing to keep a browser window open.
<br><br>
You can download the desktop app from: <a href="https://jsecoin.com/downloads?utm_source=email&utm_campaign=emailonboarding&utm_content=onboardingDesktop">https://jsecoin.com/downloads</a>
<br><br>
The automated features are in the settings menu.
<br><br>
It should be pretty intuitive and easy to use but if you have any issues let us know.
`;

module.exports = emails;
