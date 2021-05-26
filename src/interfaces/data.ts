export interface TradingVolume {
  high: number;
  medium: number;
}

export interface AppRules {
  tradingVolume: TradingVolume;
}

export interface AppCredentials {
  apiKey: string;
}

export interface Configuration {
  application: AppCredentials;
  rules: AppRules;
}

export interface PriceQuote {
  price: number;
  volumeIn24Hours: number;
  marketCap: number;
}

export interface ExtendedDetails {
  description: string;
  dateAdded: string;
  socialAttention: string[];
  growth: GenericScale;
  competitors: GenericScale;
  lifetime: GenericScale;
  numberOfWallets: number;
}

export interface Coin {
  id: string;
  name: string;
  symbol: string;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  supplyRetentionUnit: number;
  usdQuote: PriceQuote;
  extendedInfo: ExtendedDetails;
}

export enum GenericScale {
  UNKNOWN,
  LOW,
  MEDIUM,
  HIGH
}

export interface CoinData {
  coin: Coin;
  rank: number;
  network: string;
  tradingVolume: GenericScale;
  numberOfMarketPairs: number;
}