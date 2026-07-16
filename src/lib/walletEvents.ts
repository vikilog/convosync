import { paiseToCc } from './convocoins';

export const WALLET_BALANCE_EVENT = 'convosync:wallet-balance';

export function dispatchWalletBalance(balancePaise: number) {
  window.dispatchEvent(
    new CustomEvent(WALLET_BALANCE_EVENT, {
      detail: { balanceCc: paiseToCc(balancePaise), balancePaise },
    })
  );
}

export async function fetchWalletBalanceCc(): Promise<number> {
  const { api } = await import('./api');
  const wallet = (await api.getBillingWallet()) as { balancePaise?: number };
  return paiseToCc(wallet.balancePaise ?? 0);
}
