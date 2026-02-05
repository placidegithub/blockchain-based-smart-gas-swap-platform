import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { isChainSupported, defaultChain } from "../chains";

export interface WalletState {
  isConnected: boolean;
  address: `0x${string}` | undefined;
  chainId: number | undefined;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isCorrectNetwork: boolean;
}

export interface WalletActions {
  connect: () => void;
  disconnect: () => void;
  switchToDefaultChain: () => void;
}

export interface UseWalletReturn extends WalletState, WalletActions {
  connectors: { id: string; name: string }[];
}

export function useWallet(): UseWalletReturn {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const isCorrectNetwork = chainId ? isChainSupported(chainId) : false;

  const handleConnect = () => {
    const injectedConnector = connectors.find(c => c.id === 'injected') || connectors[0];
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const switchToDefaultChain = () => {
    switchChain({ chainId: defaultChain.id });
  };

  return {
    isConnected,
    address,
    chainId,
    isConnecting,
    isDisconnecting,
    isCorrectNetwork,
    connectors: connectors.map(c => ({ id: c.id, name: c.name })),
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchToDefaultChain,
  };
}

export function useRequireWallet() {
  const wallet = useWallet();

  if (!wallet.isConnected) {
    return {
      ...wallet,
      isReady: false as const,
      address: undefined,
    };
  }

  if (!wallet.isCorrectNetwork) {
    return {
      ...wallet,
      isReady: false as const,
      needsNetworkSwitch: true,
    };
  }

  return {
    ...wallet,
    isReady: true as const,
    address: wallet.address!,
  };
}
