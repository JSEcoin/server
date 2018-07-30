/**
 * @module emails
 * @description Onboarding autoresponder email series
*/
const emails = {};

/* Welcome email with confirmation link */
/* Requires $uid, $confirmlink dynamic insertion */
emails.welcome = `Welcome to JSEcoin. You are user number $uid to join our group of cryptocurrency enthusiasts who want to see mass adoption of a greener, more sustainable cryptocurrency.
<br><br>
Please confirm your account using this link: $confirmlink
<br><br>
Getting started is easy, you can send transactions, export coin codes, try the mining and earn JSE while you work, play and surf the web.
<br><br>
Take a look at the <a href="https://jsecoin.com/en/support/FAQ/">Frequently Asked Questions</a> support site which answers common questions.
<br><br>
The platform is designed to be intuitive and the best way to get up to speed is to try it out.
<br><br>
Thank you for being a JSEcoin early adopter.
`;

/* Onboarding 1 - Plans For The Future */
emails.onboardingPlans = `Try and find a programmer who understands blockchain technology and doesn’t think it will change the world.
<br><br>
Bitcoin opened the doors to the idea that we don’t have to depend on government backed traditional cryptocurrencies. All government currency goes down in value/purchasing power (known as inflation) and this has been accepted as the norm for too long. Poor fiscal decisions and quantitative easing (printing money) have only added to the downward slide. Look at your current savings and what you would have been able to buy with it just 20 years ago.
<br><br>
Bitcoin was built in 2008 and the competitive nature of the proof of stake algorithm means that the network now consumes a huge amount of power (more than the entire population of Ireland). JSEcoin is different, it uses surplus resources that would otherwise be wasted, powering a blockchain with a minimal carbon footprint. This may not seem important now but as more people adopt the technology, prices will inflate and traditional miners will be demanding even more electrical consumption. This in our opinion is unsustainable in the long-term and we are working to build a better, more scalable solution.
<br><br>
The ultimate goal for the JSEcoin project is to reach mass adoption. When you can purchase everyday goods online, in store and anywhere else with JSE, our vision will be accomplished. Things in the blockchain sector are moving fast and I believe we will see this happen in the next decade with one cryptocurrency standing out as a market leader. JSEcoin can be that market leader and the team here are working towards that goal.
`;

/* Onboarding 2 - How To Send Funds With JSEcoin */
emails.onboardingTransfer = `JSEcoin is not just a store of value but a live ecosystem of open transactions.
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

/* Onboarding 3 - How To Invest In An ICO (PDF) */
/* Requires PDF attachment */
emails.onboardingInvest = `If you have invested in an ICO before it seems like second nature zipping Ethereum payments about, however if it’s your first time it can seem like a daunting and challenging process.
<br><br>
We have put together this simple step by step guide explaining how you can purchase JSE during the ICO (PDF attached).
<br><br>
There is also a demonstration video where you can see the whole process as it happens live.
<a href="https://www.youtube.com/watch?v=ivVxijQAQT8">https://www.youtube.com/watch?v=ivVxijQAQT8</a>
<br><br>
Our technical support team are always available to assist you along the way as well so if you have any questions please do not hesitate to contact us.
<br><br>
Thank you to everyone who has supported the JSEcoin project. We are where we are today because of the strong support from the cryptocurrency community.
`;

/* Onboarding 4 - Why transparency is important to the JSE project */
emails.onboardingTransparency = `An ICO (initial coin offering) is the crypto equivalent of an IPO (initial public offering). However the same regulatory requirements don’t apply to ICO’s. Blockchain technology is built around trustless networks but trust is still required whether that be in the developers, the software or the project as a whole.
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
emails.onboardingWhitepaper = `JSEcoin is bridging the gap between web and blockchain technologies making a user-friendly platform that runs on a browser mined blockchain.
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
emails.onboardingTeam = `<table>
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
emails.onboardingPitch = `I have attached the JSEcoin pitch deck for your consideration.
<br><br>
If you wish to purchase JSE tokens now is the time to do so. We will shortly be closing the ICO and listing on exchanges where pricing will be set by open market conditions.
<br><br>
The team are here if you need help making a purchase and this guide outlines the simple steps to safely purchase JSE tokens.
<br><br>
<a href="https://jsecoin.com/HowToParticipateInICO.pdf">https://jsecoin.com/HowToParticipateInICO.pdf</a>
<br><br>
If you require any further assistance please do not hesitate to contact us at: <a href="https://jsecoin.com/support/contact/?utm_source=email&utm_campaign=emailonboarding&utm_content=onboardingPitch">https://jsecoin.com/support/contact/</a>
<br><br>
Thank you to everyone who has supported the project and helped us progress towards building a brighter more sustainable digital economy.
`;

/* Onboarding 8 - Get JSEcoin updates on youtube, facebook, telegram or twitter */
emails.onboardingSocial = `You can connect with JSEcoin on social channels. Here’s a list of the top sites where you can keep up to date with JSE developments.
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
emails.onboardingCoincodes = `The JSEcoin platform includes a section for coincodes. This allows you to export tokens as a alphanumeric key. Any user including yourself can then import these tokens back in to their platform account.
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
emails.onboardingReferrals = `Did you know you can earn JSE by helping spread the word about our project. 
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
emails.onboardingDesktop = `The desktop app includes a number of benefits over the web platform. The most important of which is the automatic miner. This can be setup to start mining as soon as you switch your computer on in the morning until the end of the day, in the background, without needing to keep a browser window open.
<br><br>
You can download the desktop app from: <a href="https://jsecoin.com/downloads?utm_source=email&utm_campaign=emailonboarding&utm_content=onboardingDesktop">https://jsecoin.com/downloads</a>
<br><br>
The automated features are in the settings menu.
<br><br>
It should be pretty intuitive and easy to use but if you have any issues let us know.
`;


module.exports = emails;
