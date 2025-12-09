export interface ItemData {
  display_name: string;
  name: string;
  QTY: string;
}

export interface CategoryData {
  main_category: string;
  DPP: number;
  items_file: string;
}

export interface CategoryJsonData {
  tanggal: string;
  categories: CategoryData[];
}

export interface StockData {
  id: number;
  symbol: string; // display_name
  name: string;
  logoUrl: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  qty: number;
  category: string;
  history: Array<{
    date: string;
    price: number;
  }>;
  prediction: Array<{
    date: string;
    price: number;
  }>;
}

