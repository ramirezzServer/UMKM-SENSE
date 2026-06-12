export interface TransactionItem {
  id: number;
  product_id: number;
  product_name: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

export interface Transaction {
  id: number;
  customer_name: string | null;
  transaction_date: string; // YYYY-MM-DD
  payment_method: 'Transfer' | 'Cash' | 'QRIS';
  total_amount: number;
  status: 'success' | 'pending' | 'failed';
  items?: TransactionItem[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedTransactions {
  data: Transaction[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface TransactionFilters {
  status?: 'success' | 'pending' | 'failed' | '';
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface SelectProduct {
  id: number;
  name: string;
  price: number;
  current_stock: number;
}
