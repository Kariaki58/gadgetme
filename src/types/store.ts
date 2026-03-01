export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string;
  colorHex: string;
  stock: number;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  baseStock: number;
  imageUrl?: string;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number; // Price at time of order
}

export interface Order {
  id: string;
  productId?: string; // For backward compatibility with single-item orders
  items?: CartItem[]; // For cart-based orders
  customerName: string;
  customerPhone: string;
  quantity?: number; // For backward compatibility
  totalAmount: number;
  status: 'pending' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'confirmed';
  orderStatus: 'pending' | 'paid' | 'packaged' | 'shipped' | 'delivered';
  type: 'online' | 'in-person' | 'cart';
  createdAt: string;
  paymentConfirmedAt?: string;
  notes?: string;
}

export interface POSTransaction {
  id: string;
  customerName: string;
  items: CartItem[];
  expectedAmount: number;
  actualAmountCollected: number;
  extraCharge: number;
  profit: number;
  loss: number;
  createdAt: string;
}

export interface StoreAccountDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  phoneNumber?: string; // For mobile money
}

export interface StoreData {
  storeId: string;
  storeName: string;
  ownerEmail: string;
  accountDetails?: StoreAccountDetails;
  products: Product[];
  orders: Order[];
  posTransactions: POSTransaction[];
}

export interface AuthState {
  isLoggedIn: boolean;
  currentStoreId: string | null;
}