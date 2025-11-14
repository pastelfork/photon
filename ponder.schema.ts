import { onchainTable } from "ponder";

export const BalanceUpdate = onchainTable("balance_update", (t) => ({
  id: t.text().primaryKey(),
  account: t.hex().notNull(),
  strategy: t.hex().notNull(),
  assetChange: t.bigint().notNull(),
  sharesChange: t.bigint().notNull(),
  assetPrice: t.bigint().notNull(),
  eventName: t.text().notNull(),
  timestamp: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));

export const PriceFeed = onchainTable("price_feed", (t) => ({
  strategy: t.hex().primaryKey(),
  priceFeed: t.hex().notNull(),
}));
