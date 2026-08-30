// src/pages/earn.tsx
import { useEffect, useState, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useVetroContract } from '@/hooks/useVetroContract';
import { useToast } from '@/components/ui/use-toast';
import { formatAmount } from '@/utils/numbers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface EarnState {
  earnedAmount: string;
  exitTicketAmount: string;
  isCancelling: boolean;
}

export default function EarnPage() {
  const { account, chainId } = useWeb3React();
  const vetroContract = useVetroContract();
  const { toast } = useToast();
  const [state, setState] = useState<EarnState>({
    earnedAmount: '0',
    exitTicketAmount: '0',
    isCancelling: false,
  });

  // Fetch initial state when account or chain changes
  const fetchEarnState = useCallback(async () => {
    if (!account || !vetroContract) return;

    try {
      const earned = await vetroContract.earned(account);
      const exitTicket = await vetroContract.exitTickets(account);
      
      setState(prev => ({
        ...prev,
        earnedAmount: formatAmount(earned.toString()),
        exitTicketAmount: formatAmount(exitTicket.toString()),
      }));
    } catch (error) {
      console.error('Failed to fetch earn state:', error);
    }
  }, [account, vetroContract]);

  // Initial fetch on mount
  useEffect(() => {
    fetchEarnState();
  }, [fetchEarnState]);

  // Listen for events to update state after transactions
  useEffect(() => {
    if (!vetroContract) return;

    const handleExitTicketCancelled = (accountAddress: string) => {
      if (accountAddress === account) {
        fetchEarnState();
      }
    };

    const listener = (event: any) => {
      if (event.event === 'ExitTicketCancelled') {
        handleExitTicketCancelled(event.args?.account);
      }
    };

    vetroContract.on('ExitTicketCancelled', listener);

    return () => {
      vetroContract.off('ExitTicketCancelled', listener);
    };
  }, [vetroContract, account, fetchEarnState]);

  const handleCancelExitTicket = async () => {
    if (!vetroContract || !account || state.isCancelling) return;

    try {
      setState(prev => ({ ...prev, isCancelling: true }));
      
      const tx = await vetroContract.cancelExitTicket();
      await tx.wait();

      toast({
        title: 'Exit ticket cancelled',
        description: 'Your earned amount has been updated',
      });
    } catch (error) {
      console.error('Failed to cancel exit ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel exit ticket',
        variant: 'destructive',
      });
    } finally {
      setState(prev => ({ ...prev, isCancelling: false }));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Earned Amount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Your earned amount</p>
            <p className="text-3xl font-bold">
              {state.earnedAmount} VETRO
            </p>
          </div>
          
          {state.exitTicketAmount !== '0' && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                Active exit ticket: {state.exitTicketAmount} VETRO
              </p>
              <Button
                onClick={handleCancelExitTicket}
                disabled={state.isCancelling}
                variant="outline"
                className="w-full"
              >
                {state.isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel Exit Ticket'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}