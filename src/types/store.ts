export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  imageUrl?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'completed';
  type: 'online' | 'in-person';
  createdAt: string;
}

export interface InPersonSale extends Order {
  actualAmountCollected: number;
  expectedAmount: number;
  extraCharge: number;
  profit: number;
  loss: number;
}

export interface StoreData {
  storeId: string;
  storeName: string;
  ownerEmail: string;
  products: Product[];
  orders: Order[];
  inPersonSales: InPersonSale[];
}

export interface AuthState {
  isLoggedIn: boolean;
  currentStoreId: string | null;
}