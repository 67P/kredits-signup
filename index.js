const express = require('express');
const session = require('express-session');
const grant = require('grant-express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const ethers = require('ethers');
const morgan = require('morgan');
const Octokit = require('@octokit/rest');
const OctokitApp = require('@octokit/app');
const Kredits = require('kredits-contracts');

const addContributor = require('./utils/add-contributor.js');

const Config = require('./config');

// TODO: maybe move into kredits-contracts
Kredits.for = function (connectionOptions, kreditsOptions) {
  const { network, rpcUrl, wallet } = connectionOptions;
  let ethProvider, signer;
  if (rpcUrl || network === 'local') {
    ethProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
  } else {
    ethProvider = new ethers.getDefaultProvider(network);
  }
  if (wallet) {
    signer = wallet.connect(ethProvider);
  } else if (ethProvider.getSigner) {
    signer = ethProvider.getSigner();
  }
  return new Kredits(ethProvider, signer, kreditsOptions);
}

async function getWallet() {
  let wallet;
  if (Config.wallet.privateKey) {
    wallet = new ethers.Wallet(Config.wallet.privateKey);
  } else if (fs.existsSync(Config.wallet.path)) {
    const walletJson  = fs.readFileSync(Config.wallet.path);
    wallet = await ethers.Wallet.fromEncryptedJson(walletJson, Config.wallet.password);
  }
  return wallet;
}

(async function() {
  const app = express();
  app.use(morgan('common'));
  app.set('view engine', 'pug');
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(session({secret: 'kredits-oracle-45ad32906b7', saveUninitialized: true, resave: true}));

  app.use(grant(Config.grant));

  let wallet = await getWallet();
  const kredits = await Kredits.for(
    { rpcUrl: Config.ethRpcUrl, network: Config.ethNetwork, wallet: wallet },
    {
      addresses: { Kernel: Config.daoAddress },
      apm: Config.apmDomain,
      ipfsConfig: Config.ipfsConfig
    }
  ).init();

  console.log('Wallet address: ' + kredits.signer.address);

  kredits.provider.getBalance(kredits.signer.address).then(balance => {
    console.log('Wallet balance: ' + ethers.utils.formatEther(balance) + 'ETH');
  });
  kredits.provider.getBlockNumber().then(block => {
    console.log('Latest block: ', block);
  });

  app.get('/github/signup', async (req, res) => {
    res.render('github/signup');
  });
  app.get('/test', async (req, res) => {
    res.render('github/setup', { user: { username: 'test'}});
  });

  app.get('/github/setup', async (req, res) => {
    if (!req.session.grant) {
      res.status(401).end();
      return;
    }
    const octokit = new Octokit({auth: req.session.grant.response.access_token});

    const user = await octokit.users.getAuthenticated();
    const contributor = await kredits.Contributor.findByAccount({
      site: 'github.com',
      username: user.data.login
    });

    if (!contributor) {
      res.render('github/setup', { user: user.data });
    } else {
      res.render('github/success', { contributor });
    }
  });

  app.post('/github/register', async (req, res) => {
    if (!req.session.grant) {
      res.status(401).end();
      return;
    }
    const octokit = new Octokit({auth: req.session.grant.response.access_token});

    const user = await octokit.users.getAuthenticated();

    const contributor = await kredits.Contributor.findByAccount({
      site: 'github.com',
      username: user.data.login
    });

    if (!contributor) {
      let contributorAttr = {};
      contributorAttr.account = req.body.account;
      contributorAttr.name = user.data.name;
      contributorAttr.kind = "person";
      contributorAttr.url = user.data.blog;
      contributorAttr.github_username = user.data.login;
      contributorAttr.github_uid = user.data.id;

      addContributor(kredits, contributorAttr).then(contributor => {
        res.render('github/success', { contributor });
      });

    } else {
      res.render('github/success', { contributor });
    }
  });

  app.listen(Config.port, () => console.log(`Oracle listening on port ${Config.port}`));
})();

