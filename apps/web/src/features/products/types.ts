export interface Product {
  id: number;
  name: string;
  category: string | null;
  price: number;
  current_stock: number;
  image_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface PaginatedProducts {
  data: Product[];
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

export interface ProductFilters {
  search?: string;
  status?: 'active' | 'inactive' | '';
  page?: number;
}
