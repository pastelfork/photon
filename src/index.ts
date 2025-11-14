import { ponder } from "ponder:registry";
import { BalanceUpdate, PriceFeed } from "ponder:schema";
import { OracleAbi } from "../abis/OracleAbi";
import { v4 as uuidv4 } from "uuid";
import { zeroAddress } from "viem";

// records the price feed address when Strategy is deployed to reduce RPC calls
ponder.on("Strategy:NewTokenizedStrategy", async ({ event, context }) => {
  const priceFeed: `0x${string}` = await context.client.readContract({
    address: event.log.address,
    abi: context.contracts.Strategy.abi,
    functionName: "PRICE_FEED",
  });

  await context.db.insert(PriceFeed).values({
    strategy: event.log.address,
    priceFeed: priceFeed,
  });
});

ponder.on("Strategy:Deposit", async ({ event, context }) => {
  // find the price feed for the strategy
  const row = await context.db.find(PriceFeed, {
    strategy: event.log.address,
  });

  if (!row) {
    // this should never happen
    throw new Error("Price feed not found");
  }

  // get current asset price
  const [, answer] = await context.client.readContract({
    address: row.priceFeed,
    abi: OracleAbi,
    functionName: "latestRoundData",
  });

  // insert update
  await context.db.insert(BalanceUpdate).values({
    id: uuidv4(),
    account: event.args.owner,
    strategy: event.log.address,
    assetChange: event.args.assets,
    sharesChange: event.args.shares,
    assetPrice: answer,
    eventName: "Deposit",
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("Strategy:Withdraw", async ({ event, context }) => {
  // find the price feed for the strategy
  const row = await context.db.find(PriceFeed, {
    strategy: event.log.address,
  });

  if (!row) {
    // this should never happen
    throw new Error("Price feed not found");
  }

  // get current asset price
  const [, answer] = await context.client.readContract({
    address: row.priceFeed,
    abi: OracleAbi,
    functionName: "latestRoundData",
  });

  // insert update
  await context.db.insert(BalanceUpdate).values({
    id: uuidv4(),
    account: event.args.owner,
    strategy: event.log.address,
    assetChange: -event.args.assets,
    sharesChange: -event.args.shares,
    assetPrice: answer,
    eventName: "Withdraw",
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("Strategy:Transfer", async ({ event, context }) => {
  const from = event.args.from;
  const to = event.args.to;

  // as deposit/withdrawal also emit transfer events
  // we ignore them and only index transfers between accounts
  // this should only be useful if there are future integrations for the ERC20
  if (from !== zeroAddress && to !== zeroAddress) {
    // transfer between two accounts
    const row = await context.db.find(PriceFeed, {
      strategy: event.log.address,
    });

    if (!row) {
      // this should never happen
      throw new Error("Price feed not found");
    }

    // get current asset price
    const [, answer] = await context.client.readContract({
      address: row.priceFeed,
      abi: OracleAbi,
      functionName: "latestRoundData",
    });

    // convertToAssets from transfer value
    const assetChange = await context.client.readContract({
      address: event.log.address,
      abi: context.contracts.Strategy.abi,
      functionName: "convertToAssets",
      args: [event.args.value],
    });

    // shares sender
    await context.db.insert(BalanceUpdate).values({
      id: uuidv4(),
      account: from,
      strategy: event.log.address,
      assetChange: -assetChange,
      sharesChange: -event.args.value,
      assetPrice: answer,
      eventName: "Transfer",
      timestamp: event.block.timestamp,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    });

    // shares receiver
    await context.db.insert(BalanceUpdate).values({
      id: uuidv4(),
      account: to,
      strategy: event.log.address,
      assetChange: assetChange,
      sharesChange: event.args.value,
      assetPrice: answer,
      eventName: "Transfer",
      timestamp: event.block.timestamp,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    });
  }
});
