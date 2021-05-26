import { CoinRepo } from './CoinRepo';
import { CoinData } from '../interfaces/data';
const INTERVAL_DELAY_MS = 360000;

export class CoinScan {
  isRunning: boolean;
  private updateHandle: NodeJS.Timeout;

  private coinRepo: CoinRepo = new CoinRepo();

  start() {
    this.isRunning = true;
    this.updateHandle = setInterval(() => {
      this.update();
    }, INTERVAL_DELAY_MS)
    this.update();
  }

  stop() {
    this.isRunning = false;
    clearInterval(this.updateHandle);
  }

  private update() {
    this.coinRepo
      .update()
      .then((data: CoinData[]) => {
        const sortedTop:CoinData[] = data
          .filter(a =>
            a.numberOfMarketPairs > 5
            && a.coin.usdQuote.price < 1
            && (a.coin.supplyRetentionUnit > 0.8)
            && !!a.coin.maxSupply
          )
          .sort((a, b) => {
            return b.coin.supplyRetentionUnit - a.coin.supplyRetentionUnit;
          })
          .slice(0, 150);

        this.coinRepo
          .decorateResults(sortedTop)
          .then(() => sortedTop.filter((e) => e.coin.extendedInfo.socialAttention.length > 5))
          .then((coinSelection) => {
            const finalSweepData = coinSelection.map((data) => ({
              coin: data.coin,
              rank: data.rank,
              numberOfMarketPairs: data.numberOfMarketPairs,
              network: data.network
            }));

            const fs = require('fs');
            fs.writeFileSync("./data/topCoins.json", JSON.stringify(finalSweepData, null, "\t"), "UTF-8");
            
            console.log("Top Coins reported!");
          })
        
      });
  }
}