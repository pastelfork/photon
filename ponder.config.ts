import { createConfig, mergeAbis } from "ponder";
import { StrategyProxyAbi } from "./abis/StrategyProxyAbi";
import { StrategyImplAbi } from "./abis/StrategyImplAbi";

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: process.env.DATABASE_URL!,
  },
  chains: {
    mainnet: {
      id: 1,
      rpc: process.env.PONDER_RPC_URL_1!,
      ws: process.env.PONDER_WS_RPC_URL_1!,
    },
  },
  contracts: {
    Strategy: {
      chain: "mainnet",
      abi: mergeAbis([StrategyProxyAbi, StrategyImplAbi]),
      address: JSON.parse(process.env.CONTRACTS!) as `0x${string}`[],
      startBlock: Number(process.env.START_BLOCK!),
    },
  },
});
