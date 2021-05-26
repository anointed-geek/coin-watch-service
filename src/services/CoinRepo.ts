import { CoinData, GenericScale, Configuration, ExtendedDetails } from '../interfaces/data';
const BASE_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/";
const ENABLE_WEB_FETCH = true;
const CONFIG = "./src/config.json";
const DATA_CACHE_OUT = "./data/cache.json";

export class CoinRepo {
  private coinData: CoinData[] = [];
  private config: Configuration = null;

  constructor() {
    const fs = require('fs');
    try {
      this.config = JSON.parse(fs.readFileSync(CONFIG, "UTF-8")) as Configuration;
    } catch (e) {
      this.config = {
        application: {
          apiKey: "",
        },
        rules: {
          tradingVolume: {
            high: 0.6,
            medium: 0.3
           }
         }
      }
    }
  }
  
  update(): Promise<CoinData[]> {
    // Fetch from CoinmarketCap
    console.log("Fetching from CoinMarketCap")

    if (ENABLE_WEB_FETCH) {
      return this.getData()
      .then((data) => {
        this.saveToCache(data);
        return this.handleData(data);
      })
        .then(() => {
          console.log("saved data to cache");
          return this.coinData;
        });

    } else {
      return this.loadData()
        .then((data) => {
          return this.handleData(data);
        });
    }
  }

  decorateResults(data: CoinData[]): Promise<void> {
    return this.fetchExtendedInfo(data)
  }

  private fetchExtendedInfo(data: CoinData[]): Promise<void> {

    const fetch = require("node-fetch");
    const idList = data.map((d) => d.coin.id).join(',');
    
    return fetch(`${BASE_URL}info?id=${idList}`, {
      headers: {
        "X-CMC_PRO_API_KEY": this.config.application.apiKey,
        "Accept": "application/json"
      }
    })
      .then((r) => r.json(), err => {
        console.error(err);
      })
      .then((json) => {
        data.forEach((entry) => {
          const details = json.data[entry.coin.id];
          if (details) {
            entry.coin.extendedInfo = <ExtendedDetails>{
              competitors: GenericScale.UNKNOWN,
              dateAdded: details.date_added,
              description: details.description,
              growth: GenericScale.UNKNOWN,
              lifetime: GenericScale.UNKNOWN,
              numberOfWallets: GenericScale.UNKNOWN,
              socialAttention: [
                ...details.urls.website,
                ...details.urls.twitter,
                ...details.urls.reddit,
                ...details.urls.message_board,
                ...details.urls.announcement,
                ...details.urls.chat
              ]
            }
          }
        });

        return Promise.resolve();
      });
  }

  private loadData(): Promise<any> {
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(DATA_CACHE_OUT, "UTF-8"));
    return Promise.resolve(data);
  }

  private saveToCache(jsonData: any) {
    const fs = require('fs');
    fs.writeFileSync(DATA_CACHE_OUT, JSON.stringify(jsonData, null, "\t"), "UTF-8");
  }

  private getData(): Promise<any> {
    const fetch = require("node-fetch");
    
    return fetch(`${BASE_URL}listings/latest?start=1&limit=5000&convert=USD`, {
      headers: {
        "X-CMC_PRO_API_KEY": this.config.application.apiKey,
        "Accept": "application/json"
      }
    })
      .then((r) => r.json(), err => {
        console.error(err);
      });
  }

  private handleData(results: {data: any[]}) : Promise<CoinData[]> {
    this.coinData.length;
    
    const newCoinData = results.data.map(rawData => (<CoinData>{
      coin: {
          id: rawData.id,
          name: rawData.name,
          symbol: rawData.symbol,
          circulatingSupply: rawData.circulating_supply,
          totalSupply: rawData.total_supply,
          maxSupply: rawData.max_supply,
          supplyRetentionUnit: Math.min(1, (rawData.circulating_supply / (rawData.max_supply || rawData.total_supply || 1))),
          usdQuote: {
            price: rawData.quote.USD.price,
            volumeIn24Hours: rawData.quote.USD.volume_24h,
            marketCap: rawData.quote.USD.market_cap
          }
        },
        rank: rawData.cmc_rank,
        tradingVolume: this.determineTradingVolume(rawData.quote.USD.volume_24h, rawData.circulating_supply),
        network: rawData.platform ? rawData.platform.name : "N/A",
        numberOfMarketPairs: rawData.num_market_pairs
      }
    ));

    this.compareContrast(newCoinData);

    return Promise.resolve(this.coinData);
  }

  private compareContrast(newData: CoinData[]) {
    this.coinData = newData;
  }

  private determineTradingVolume(volume: number, circulatingSupply: number): GenericScale {
    if (circulatingSupply) {
      const movement = volume / circulatingSupply;

      if (movement > this.config.rules.tradingVolume.high) {
        return GenericScale.HIGH;
      } else if (movement > this.config.rules.tradingVolume.medium) {
        return GenericScale.MEDIUM;
      }
      
      return GenericScale.LOW;
    }

    return GenericScale.UNKNOWN;
  }
}