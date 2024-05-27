import {
  baseBridgeConfig,
  binanceConfig,
  blastConfig,
  blurConfig,
  bungeeConfig,
  etherfiConfig,
  generalConfig,
  lineaBridgeConfig,
  okxConfig,
  relayBridgeConfig,
  scrollBridgeConfig,
  swellConfig,
  wrapConfig,
  zkSyncBridgeConfig,
  zkSyncLiteConfig,
  zoraBridgeConfig,
} from './config';
import { BaseBridge } from './modules/baseBridge';
import { Binance } from './modules/binance';
import { WrapEth } from './modules/wrapEth';
import { Bungee } from './modules/bungee';
import { Mintfun } from './modules/mintfun';
import { ZoraBridge } from './modules/zoraBridge';
import {
  random,
  randomFloat,
  shuffleModules,
  shuffleWallets,
  sleep,
  weightedRandom,
} from './utils/common';
import { waitGas } from './utils/getCurrentGas';
import { makeLogger } from './utils/logger';
import { entryPoint } from './utils/menu';
import { privateKeyConvert, readWallets } from './utils/wallet';
import { BlurDeposit } from './modules/blurDeposit';
import { ZkSyncLiteDeposit } from './modules/zkSyncLiteDeposit';
import { ScrollBridge } from './modules/scrollBridge';
import { OKX } from './modules/okx';
import { RelayBridge } from './modules/relayBridge';
import { LineaBridge } from './modules/lineaBridge';
import { ZkSyncBridge } from './modules/zkSyncBridge';
import { BlastDeposit } from './modules/blastDeposit';
import { EtherfiDeposit } from './modules/etherfiDeposit';
import { SwellDeposit } from './modules/swellDeposit';

let privateKeys = readWallets('./keys.txt');

if (generalConfig.shuffleWallets) {
  shuffleWallets(privateKeys);
}

async function customModule() {
  const logger = makeLogger('Custom');
  let customModules = generalConfig.customModules;

  for (let privateKey of privateKeys) {
    let network;
    let sleepTime;

    if (generalConfig.useTopup) {
      const okx = new OKX(privateKeyConvert(privateKey));

      const sum = randomFloat(
        generalConfig.topupValueFrom,
        generalConfig.topupValueTo
      );

      network = await okx.withdraw(sum.toString());

      sleepTime = random(
        generalConfig.sleepWithdrawFrom,
        generalConfig.sleepWithdrawTo
      );
      logger.info(`Waiting ${sleepTime} sec until next module...`);
      await sleep(sleepTime * 1000);

      if (network) {
        switch (network) {
          case 'Arbitrum One':
            network = 'Arb';
            break;
          case 'Base':
            network = 'Base';
            break;
          case 'Optimism':
            network = 'Op';
            break;
          case 'zkSync Era':
            network = 'zkSyncEra';
            break;
          case 'Linea':
            network = 'Linea';
            break;
        }

        const relayBridgeToEth = new RelayBridge(
          privateKeyConvert(privateKey),
          network
        );
        await relayBridgeToEth.bridgeToEth(sum.toString());

        sleepTime = random(
          generalConfig.sleepModulesFrom,
          generalConfig.sleepModulesTo
        );
        logger.info(`Waiting ${sleepTime} sec until next module...`);
        await sleep(sleepTime * 1000);
      } else {
        logger.info(`Network not found.`);
      }
    }

    if (await waitGas()) {
      let customModulesCount = random(
        generalConfig.countModulesFrom,
        generalConfig.countModulesTo
      );
      let shuffledModules = generalConfig.shuffleCustomModules
        ? shuffleModules(customModules)
        : customModules;

      let userCustomModules = [];
      for (let i = 0; i < customModulesCount; i++) {
        const selectedModuleName = weightedRandom(shuffledModules);
        if (selectedModuleName) {
          userCustomModules.push(selectedModuleName);
        }
      }

      for (let customModuleItem of userCustomModules) {
        if (generalConfig.useBridge) {
          switch (customModuleItem) {
            case 'mintfun':
              const mintfun = new Mintfun(privateKeyConvert(privateKey));
              await mintfun.mint();
              break;
            case 'relay_bridge_from_eth':
              const relaySumFromEth = randomFloat(
                relayBridgeConfig.bridgeFrom,
                relayBridgeConfig.bridgeTo
              );
              const relayBridgeFromEth = new RelayBridge(
                privateKeyConvert(privateKey)
              );
              await relayBridgeFromEth.bridgeFromEth(
                relaySumFromEth.toString()
              );
              break;
            case 'scroll_bridge':
              const scrollSum = randomFloat(
                scrollBridgeConfig.bridgeFrom,
                scrollBridgeConfig.bridgeTo
              );
              const scrollBridge = new ScrollBridge(
                privateKeyConvert(privateKey)
              );
              await scrollBridge.bridge(scrollSum.toString());
              break;
            case 'zora_bridge':
              const zoraSum = randomFloat(
                zoraBridgeConfig.bridgeFrom,
                zoraBridgeConfig.bridgeTo
              );
              const zoraBridge = new ZoraBridge(privateKeyConvert(privateKey));
              await zoraBridge.bridge(zoraSum.toString());
              break;
            case 'base_bridge':
              const baseSum = randomFloat(
                baseBridgeConfig.bridgeFrom,
                baseBridgeConfig.bridgeTo
              );
              const baseBridge = new BaseBridge(privateKeyConvert(privateKey));
              await baseBridge.bridge(baseSum.toString());
              break;
            case 'wrap_eth':
              const wrapSum = randomFloat(
                wrapConfig.depositFrom,
                wrapConfig.depositTo
              );
              const wrapEth = new WrapEth(privateKeyConvert(privateKey));
              await wrapEth.wrap(wrapSum.toString());
              break;
            case 'bungee':
              const bungeeSum = randomFloat(
                bungeeConfig.refuelFrom,
                bungeeConfig.refuelTo
              );
              const bungee = new Bungee(privateKeyConvert(privateKey));
              await bungee.refuel(bungeeSum.toString());
              break;
            case 'zksync_lite_deposit':
              const zkSum = randomFloat(
                zkSyncLiteConfig.depositFrom,
                zkSyncLiteConfig.depositTo
              );
              const zkSyncLiteDeposit = new ZkSyncLiteDeposit(
                privateKeyConvert(privateKey)
              );
              await zkSyncLiteDeposit.deposit(zkSum.toString());
              break;
            case 'blur_deposit':
              const blurSum = randomFloat(
                blurConfig.depositFrom,
                blurConfig.depositTo
              );
              const blurDeposit = new BlurDeposit(
                privateKeyConvert(privateKey)
              );
              await blurDeposit.deposit(blurSum.toString());
              break;
          }
        } else {
          switch (customModuleItem) {
            case 'mintfun':
              const mintfun = new Mintfun(privateKeyConvert(privateKey));
              await mintfun.mint();
              break;
            case 'wrap_eth':
              const wrapSum = randomFloat(
                wrapConfig.depositFrom,
                wrapConfig.depositTo
              );
              const wrapEth = new WrapEth(privateKeyConvert(privateKey));
              await wrapEth.wrap(wrapSum.toString());
              break;
            case 'bungee':
              const bungeeSum = randomFloat(
                bungeeConfig.refuelFrom,
                bungeeConfig.refuelTo
              );
              const bungee = new Bungee(privateKeyConvert(privateKey));
              await bungee.refuel(bungeeSum.toString());
              break;
            case 'zksync_lite_deposit':
              const zkSum = randomFloat(
                zkSyncLiteConfig.depositFrom,
                zkSyncLiteConfig.depositTo
              );
              const zkSyncLiteDeposit = new ZkSyncLiteDeposit(
                privateKeyConvert(privateKey)
              );
              await zkSyncLiteDeposit.deposit(zkSum.toString());
              break;
            case 'blur_deposit':
              const blurSum = randomFloat(
                blurConfig.depositFrom,
                blurConfig.depositTo
              );
              const blurDeposit = new BlurDeposit(
                privateKeyConvert(privateKey)
              );
              await blurDeposit.deposit(blurSum.toString());
              break;
          }
        }

        sleepTime = random(
          generalConfig.sleepModulesFrom,
          generalConfig.sleepModulesTo
        );
        logger.info(`Waiting ${sleepTime} sec until next module...`);
        await sleep(sleepTime * 1000);
      }

      sleepTime = random(
        generalConfig.sleepWalletsFrom,
        generalConfig.sleepWalletsTo
      );
      logger.info(`Waiting ${sleepTime} sec until next wallet...`);
      await sleep(sleepTime * 1000);
    }
  }
}

async function blastDepositModule() {
  const logger = makeLogger('Blast deposit');
  for (let privateKey of privateKeys) {
    const blast = new BlastDeposit(privateKeyConvert(privateKey));
    const sum = randomFloat(blastConfig.depositFrom, blastConfig.depositTo);

    if (await waitGas()) {
      await blast.deposit(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function blurDepositModule() {
  const logger = makeLogger('Blur deposit');
  for (let privateKey of privateKeys) {
    const blur = new BlurDeposit(privateKeyConvert(privateKey));
    const sum = randomFloat(blurConfig.depositFrom, blurConfig.depositTo);

    if (await waitGas()) {
      await blur.deposit(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function bungeeModule() {
  const logger = makeLogger('Bungee');
  for (let privateKey of privateKeys) {
    const bungee = new Bungee(privateKeyConvert(privateKey));
    const sum = randomFloat(bungeeConfig.refuelFrom, bungeeConfig.refuelTo);

    if (await waitGas()) {
      await bungee.refuel(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function etherfiDepositModule() {
  const logger = makeLogger('Etherfi deposit');
  for (let privateKey of privateKeys) {
    const etherfi = new EtherfiDeposit(privateKeyConvert(privateKey));
    const sum = randomFloat(etherfiConfig.depositFrom, etherfiConfig.depositTo);

    if (await waitGas()) {
      await etherfi.deposit(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function swellDepositModule() {
  const logger = makeLogger('Swell deposit');
  for (let privateKey of privateKeys) {
    const swell = new SwellDeposit(privateKeyConvert(privateKey));
    const sum = randomFloat(swellConfig.depositFrom, swellConfig.depositTo);

    if (await waitGas()) {
      await swell.deposit(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function wrapEthModule() {
  const logger = makeLogger('Wrap eth');
  for (let privateKey of privateKeys) {
    const eth = new WrapEth(privateKeyConvert(privateKey));
    const sum = randomFloat(wrapConfig.depositFrom, wrapConfig.depositTo);

    if (await waitGas()) {
      await eth.wrap(sum.toString());
    }
    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function zkSyncLiteDepositModule() {
  const logger = makeLogger('ZkSync Lite deposit');
  for (let privateKey of privateKeys) {
    const zkSyncLite = new ZkSyncLiteDeposit(privateKeyConvert(privateKey));
    const sum = randomFloat(
      zkSyncLiteConfig.depositFrom,
      zkSyncLiteConfig.depositTo
    );

    if (await waitGas()) {
      await zkSyncLite.deposit(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function baseBridgeModule() {
  const logger = makeLogger('Base bridge');
  for (let privateKey of privateKeys) {
    const base = new BaseBridge(privateKeyConvert(privateKey));
    const sum = randomFloat(
      baseBridgeConfig.bridgeFrom,
      baseBridgeConfig.bridgeTo
    );

    if (await waitGas()) {
      await base.bridge(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function lineaBridgeModule() {
  const logger = makeLogger('Linea bridge');
  for (let privateKey of privateKeys) {
    const linea = new LineaBridge(privateKeyConvert(privateKey));
    const sum = randomFloat(
      lineaBridgeConfig.bridgeFrom,
      lineaBridgeConfig.bridgeTo
    );

    if (await waitGas()) {
      await linea.bridge(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function relayBridgeFromEthModule() {
  const logger = makeLogger('Relay bridge');
  for (let privateKey of privateKeys) {
    const relay = new RelayBridge(privateKeyConvert(privateKey));
    const sum = randomFloat(
      relayBridgeConfig.bridgeFrom,
      relayBridgeConfig.bridgeTo
    );

    if (await waitGas()) {
      await relay.bridgeFromEth(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function relayBridgeToEthModule() {
  const logger = makeLogger('Relay bridge');
  for (let privateKey of privateKeys) {
    const relay = new RelayBridge(privateKeyConvert(privateKey));
    const sum = randomFloat(
      relayBridgeConfig.bridgeFrom,
      relayBridgeConfig.bridgeTo
    );

    if (await waitGas()) {
      await relay.bridgeToEth(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function scrollBridgeModule() {
  const logger = makeLogger('Scroll bridge');
  for (let privateKey of privateKeys) {
    const scroll = new ScrollBridge(privateKeyConvert(privateKey));
    const sum = randomFloat(
      scrollBridgeConfig.bridgeFrom,
      scrollBridgeConfig.bridgeTo
    );

    if (await waitGas()) {
      await scroll.bridge(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function zoraBridgeModule() {
  const logger = makeLogger('Zora bridge');
  for (let privateKey of privateKeys) {
    const zora = new ZoraBridge(privateKeyConvert(privateKey));
    const sum = randomFloat(
      zoraBridgeConfig.bridgeFrom,
      zoraBridgeConfig.bridgeTo
    );

    if (await waitGas()) {
      await zora.bridge(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function zkSyncBridgeModule() {
  const logger = makeLogger('ZkSync bridge');
  for (let privateKey of privateKeys) {
    const zkSync = new ZkSyncBridge(privateKeyConvert(privateKey));
    const sum = randomFloat(
      zkSyncBridgeConfig.bridgeFrom,
      zkSyncBridgeConfig.bridgeTo
    );

    if (await waitGas()) {
      await zkSync.bridge(sum.toString());
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function mintfunModule() {
  const logger = makeLogger('Mintfun');
  for (let privateKey of privateKeys) {
    const mintfun = new Mintfun(privateKeyConvert(privateKey));

    if (await waitGas()) {
      await mintfun.mint();
    }

    const sleepTime = random(
      generalConfig.sleepModulesFrom,
      generalConfig.sleepModulesTo
    );
    logger.info(`Waiting ${sleepTime} sec until next wallet...`);
    await sleep(sleepTime * 1000);
  }
}

async function startMenu() {
  let mode = await entryPoint();
  switch (mode) {
    case 'custom':
      await customModule();
      break;
    case 'blast_deposit':
      await blastDepositModule();
      break;
    case 'blur_deposit':
      await blurDepositModule();
      break;
    case 'etherfi_deposit':
      await etherfiDepositModule();
      break;
    case 'swell_deposit':
      await swellDepositModule();
      break;
    case 'wrap_eth':
      await wrapEthModule();
      break;
    case 'zksync_lite_deposit':
      await zkSyncLiteDepositModule();
      break;
    case 'base_bridge':
      await baseBridgeModule();
      break;
    case 'bungee':
      await bungeeModule();
      break;
    case 'linea_bridge':
      await lineaBridgeModule();
      break;
    case 'relay_bridge_from_eth':
      await relayBridgeFromEthModule();
      break;
    case 'relay_bridge_to_eth':
      await relayBridgeToEthModule();
      break;
    case 'scroll_bridge':
      await scrollBridgeModule();
      break;
    case 'zora_bridge':
      await zoraBridgeModule();
      break;
    case 'zksync_bridge':
      await zkSyncBridgeModule();
      break;
    case 'mintfun':
      await mintfunModule();
      break;
  }
}

await startMenu();
