'use client';

import {
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction';
import { useCallback } from 'react';

export default function OnchainTransactionDemo({ 
  calls, 
  children, 
  isSponsored = false,
  onSuccess,
  onError,
  ...props 
}) {
  const handleOnStatus = useCallback((status) => {
    console.log('Transaction status:', status);
    
    if (status.statusName === 'success' && onSuccess) {
      onSuccess(status);
    } else if (status.statusName === 'error' && onError) {
      onError(status);
    }
  }, [onSuccess, onError]);

  return (
    <Transaction
      calls={calls}
      onStatus={handleOnStatus}
      {...props}
    >
      {isSponsored && <TransactionSponsor />}
      <TransactionButton />
      <TransactionStatus>
        <TransactionStatusLabel />
        <TransactionStatusAction />
      </TransactionStatus>
      {children}
    </Transaction>
  );
}

export { OnchainTransactionDemo as OnchainTransaction };