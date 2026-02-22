import { useTransactions } from "@/hooks/use-transactions";
import { 
  CreditCard, 
  Wallet,
  ShoppingBag
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Transactions() {
  const { data: transactions, isLoading } = useTransactions();

  if (isLoading) {
    return <TransactionsSkeleton />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold font-display">Transactions</h1>
          <p className="text-muted-foreground">
            View all your financial transactions
          </p>
        </div>
        
        <div className="bg-card rounded-2xl border shadow-sm p-8 text-center text-muted-foreground">
          No transactions found.
        </div>
      </div>
    );
  }

  const getTransactionIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('shopping') || desc.includes('grocery')) {
      return <ShoppingBag className="w-5 h-5" />;
    } else if (desc.includes('transfer') || desc.includes('savings')) {
      return <Wallet className="w-5 h-5" />;
    } else {
      return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold font-display">Transactions</h1>
        <p className="text-muted-foreground">
          View all your financial transactions
        </p>
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {transactions.map((tx, index) => (
          <div 
            key={tx.id} 
            className={`flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${
              index !== transactions.length - 1 ? 'border-b' : ''
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                {getTransactionIcon(tx.description)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{tx.description}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(tx.date), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-foreground">
                ${parseFloat(tx.amount).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className={`flex items-center justify-between p-4 ${
              i !== 5 ? 'border-b' : ''
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
