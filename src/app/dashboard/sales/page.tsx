"use client";

import { useState } from 'react';
import { useStoreData } from '@/hooks/use-store-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CircleDollarSign, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SalesPage() {
  const { store, addInPersonSale } = useStoreData();
  const { toast } = useToast();

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [actualAmount, setActualAmount] = useState(0);

  const selectedProduct = store?.products.find(p => p.id === selectedProductId);
  const expectedAmount = selectedProduct ? selectedProduct.sellingPrice * quantity : 0;

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    const success = addInPersonSale(selectedProductId, quantity, actualAmount);
    
    if (success) {
      toast({
        title: "Sale Recorded",
        description: `Profit calculated: ₦${(actualAmount - (selectedProduct!.costPrice * quantity)).toLocaleString()}`,
      });
      setSelectedProductId('');
      setQuantity(1);
      setActualAmount(0);
    } else {
      toast({
        title: "Error",
        description: "Insufficient stock for this sale.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary">In-Person Sales</h1>
        <p className="text-muted-foreground">Record walk-in sales and calculate instant profits.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-primary" />
              New Sale Entry
            </CardTitle>
            <CardDescription>Record collection from a customer in person.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecordSale} className="space-y-6">
              <div className="space-y-2">
                <Label>Select Gadget</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {store?.products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stock: {product.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input 
                    id="qty" 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={e => setQuantity(Number(e.target.value))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual">Actual Collected (₦)</Label>
                  <Input 
                    id="actual" 
                    type="number" 
                    placeholder="Enter amount"
                    value={actualAmount} 
                    onChange={e => setActualAmount(Number(e.target.value))} 
                  />
                </div>
              </div>

              {selectedProduct && (
                <div className="p-4 bg-secondary/50 rounded-xl space-y-2 border border-primary/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expected (Selling Price × {quantity}):</span>
                    <span className="font-bold">₦{expectedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-primary/10 pt-2">
                    <span className="text-muted-foreground">Difference:</span>
                    <span className={actualAmount >= expectedAmount ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {actualAmount >= expectedAmount ? '+' : '-'} ₦{Math.abs(actualAmount - expectedAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full bg-primary" disabled={!selectedProductId}>
                Confirm Sale <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Recent Sales History
            </CardTitle>
            <CardDescription>Track profit and loss on previous transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {store?.inPersonSales.slice(0, 10).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="text-xs">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-bold text-sm">₦{sale.actualAmountCollected.toLocaleString()}</TableCell>
                      <TableCell>
                        {sale.profit > 0 ? (
                          <span className="text-green-600 text-xs flex items-center gap-1 font-medium">
                            <TrendingUp className="h-3 w-3" /> +₦{sale.profit.toLocaleString()} Profit
                          </span>
                        ) : (
                          <span className="text-red-600 text-xs flex items-center gap-1 font-medium">
                            <TrendingDown className="h-3 w-3" /> -₦{sale.loss.toLocaleString()} Loss
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!store?.inPersonSales.length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-muted-foreground italic">
                        No sales recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}