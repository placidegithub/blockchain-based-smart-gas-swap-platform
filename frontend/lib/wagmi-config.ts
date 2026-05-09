import { http, createConfig, createStorage } from "wagmi";
import { polygon, polygonMumbai, sepolia } from "viem/chains";
import { injected } from "wagmi/connectors";
import { localhost } from "./chains";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const wagmiConfig = createConfig({
  chains: [localhost, sepolia, polygonMumbai, polygon],
  connectors: [injected()],
  ssr: true,
  storage: createStorage({
    storage: typeof window === "undefined" ? noopStorage : window.localStorage,
  }),
  multiInjectedProviderDiscovery: false,
  transports: {
    [localhost.id]: http("http://127.0.0.1:8545", {
      timeout: 10000,
      retryCount: 2,
    }),
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com", {
      timeout: 10000,
    }),
    [polygonMumbai.id]: http(undefined, {
      timeout: 10000,
    }),
    [polygon.id]: http(undefined, {
      timeout: 10000,
    }),
  },
});
declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
