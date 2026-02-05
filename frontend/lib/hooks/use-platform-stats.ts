import { useGasSwapPlatformRead } from "./use-contracts";

export interface PlatformStats {
  totalCompanies: bigint;
  totalBranches: bigint;
  totalCylinders: bigint;
  totalVouchers: bigint;
  completedSwaps: bigint;
  launchDate: bigint;
}

export function usePlatformStats() {
  const { data, isLoading, error, refetch } = useGasSwapPlatformRead(
    "getPlatformStats",
    [],
    true
  );

  const stats = data as
    | [bigint, bigint, bigint, bigint, bigint, bigint]
    | undefined;

  return {
    stats: stats
      ? {
          totalCompanies: stats[0],
          totalBranches: stats[1],
          totalCylinders: stats[2],
          totalVouchers: stats[3],
          completedSwaps: stats[4],
          launchDate: stats[5],
        }
      : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function usePlatformStatsFormatted() {
  const { stats, isLoading, error, refetch } = usePlatformStats();

  if (!stats) {
    return { stats: undefined, isLoading, error, refetch };
  }

  return {
    stats: {
      totalCompanies: Number(stats.totalCompanies),
      totalBranches: Number(stats.totalBranches),
      totalCylinders: Number(stats.totalCylinders),
      totalVouchers: Number(stats.totalVouchers),
      completedSwaps: Number(stats.completedSwaps),
      launchDate: new Date(Number(stats.launchDate) * 1000),
      successRate:
        stats.totalVouchers > BigInt(0)
          ? (Number(stats.completedSwaps) / Number(stats.totalVouchers)) * 100
          : 0,
    },
    isLoading,
    error,
    refetch,
  };
}
