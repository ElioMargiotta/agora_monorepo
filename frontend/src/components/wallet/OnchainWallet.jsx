'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance
} from '@coinbase/onchainkit/identity';

export default function OnchainWalletDemo() {
  return (
    <Wallet>
      <ConnectWallet className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
        Connect Wallet
      </ConnectWallet>
      <WalletDropdown>
        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address />
          <EthBalance />
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
}

// Export as OnchainWallet for consistency
export { OnchainWalletDemo as OnchainWallet };