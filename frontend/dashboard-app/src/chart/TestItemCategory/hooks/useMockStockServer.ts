import * as React from 'react';
import { GridGetRowsResponse, GridRowModel } from '@mui/x-data-grid';
import type { StockData, ItemData, CategoryJsonData } from '../types/stocks';
import dataItems from '../data/dataItem.json';
import dataCategories from '../data/dataCategory.json';

/**
 * Returns a price evolution simulation before a given date
 * @param basePrice The price before the returned array
 * @param size The number of element in the returned array
 * @param stepMs The gap between each item in milliseconds
 * @param baseDate The end date of the array
 */
const generateHistoricalData = (
  basePrice: number,
  size: number = 30,
  stepMs: number = 1000,
  baseDate?: Date,
) => {
  const data: Array<{ date: string; price: number }> = [];
  const now = baseDate ?? new Date();
  let price = basePrice;

  for (let step = size; step > 0; step -= 1) {
    const date = new Date(now.getTime() - step * stepMs);

    const variation = (Math.random() - 0.5) * (price * 0.03);
    price += variation;

    data.push({
      date: date.toISOString(),
      price: Number(price.toFixed(2)),
    });
  }

  return data;
};

const generatePredictionData = (
  lastPrice: number,
  size: number = 7,
  stepMs: number = 1000,
  baseDate?: Date,
) => {
  const data: Array<{ date: string; price: number }> = [];
  const now = baseDate ?? new Date();

  let price = lastPrice;
  for (let step = 1; step <= size; step += 1) {
    const date = new Date(now.getTime() + step * stepMs);

    const variation = (Math.random() - 0.5) * (price * 0.03);
    price += variation;

    data.push({
      date: date.toISOString(),
      price: Number(price.toFixed(2)),
    });
  }

  return data;
};

const DATA_STEP = 100; 
const DATA_SIZE = 100; 

const getCategoryFromItemName = (itemName: string, categories: CategoryJsonData['categories']): string => {
  const itemNameUpper = itemName.toUpperCase();
  
  const categoryKeywords: Record<string, string[]> = {
    'PUMP': ['GALLON PUMP', 'PUMP'],
    'HOME SLIPPER': ['SLIPPER', 'HOME SLIPPER'],
    'MOMS, KIDS & BABY': ['KIDS BOTTLE', 'BABY', 'KIDS', 'MPASI', 'TAMMIE', 'PINGUI'],
    'TRAVEL EQUIPMENT': ['TRAVEL', 'THERMOS', 'MUG'],
    'BEAUTY & PERSONAL CARE': ['MAKEUP', 'ORGANIZER', 'BODY', 'MIST', 'DIFFUSER', 'BEAUTY', 'PERSONAL'],
    'ELECTRONIC': ['DIGITAL SCALE', 'SCALE', 'DIGITAL', 'LED', 'BATTERY', 'RECHARGEABLE', 'ELECTRONIC'],
    'TECH & ACCESSORIES': ['TECH', 'ACCESSORIES', 'DIGITAL'],
    'SPORT & HEALTH': ['SPORT', 'HEALTH', 'WATER BOTTLE'],
    'FASHION': ['FASHION', 'CLOTH', 'COVER'],
    'OUTDOOR': ['OUTDOOR'],
    'TOOLS & HOME IMPROVEMENT': ['TOOLS', 'WRENCH', 'SOCKET', 'CUTTER', 'IMPROVEMENT'],
    'OFFICE & STATIONERY': ['OFFICE', 'STATIONERY', 'BOOK'],
    'HOBBIES & LIFESTYLE': ['HOBBIES', 'LIFESTYLE'],
    'AUTOMOTIVE': ['AUTOMOTIVE', 'CAR'],
    'TOYS': ['TOYS', 'TOY'],
    'DISNEY': ['DISNEY'],
    'BUNDLING SKU': ['BUNDLING', 'BUNDLE'],
    'DISCONTINUE': ['DISCONTINUE'],
    'LISENCE': ['LISENCE', 'LICENSE'],
    'PARTNERSHIP PRODUCT': ['PARTNERSHIP'],
    'TRADING PRODUCT': ['TRADING'],
    'LAINNYA': [], 
    'HOME & LIVING': ['GALLON', 'MOP', 'BOTTLE', 'STORAGE', 'RACK', 'CHAIR', 'BAG', 'BOX', 'LUNCH', 'FOOD', 'KITCHEN', 'UTENSIL', 'SOAP', 'TOWEL', 'BLANKET', 'CUSHION', 'BROOM', 'BRUSH', 'VACUUM', 'OIL', 'JAR', 'DISPENSER', 'HANGER', 'SHOE', 'TOILET', 'TRASH', 'BIN', 'ALARM', 'LOCK', 'DOOR', 'CLOSER', 'FLOOR', 'TABLE', 'DRAWER', 'ORGANIZER', 'CIVA', 'MERLYN', 'AQUATIC', 'ABEL', 'STACKO'],
  };

  const sortedCategories = Object.entries(categoryKeywords).sort((a, b) => {
    const maxLengthA = Math.max(...a[1].map(k => k.length));
    const maxLengthB = Math.max(...b[1].map(k => k.length));
    return maxLengthB - maxLengthA;
  });

  for (const [category, keywords] of sortedCategories) {
    if (!categories.some(cat => cat.main_category === category)) {
      continue;
    }
    
    for (const keyword of keywords) {
      if (keyword && itemNameUpper.includes(keyword)) {
        return category;
      }
    }
  }

  const lainnyaCategory = categories.find(cat => cat.main_category === 'LAINNYA');
  if (lainnyaCategory) {
    return 'LAINNYA';
  }
  
  return categories.length > 0 ? categories[0].main_category : 'HOME & LIVING';
};

const convertItemsToStockData = (items: ItemData[]): StockData[] => {
  const categoryData = dataCategories as CategoryJsonData;

  return items.map((item, index) => {
    const qty = parseInt(item.QTY) || 0;
    const basePrice = 100 + (qty * 0.1) + Math.random() * 100; 
    const change = (Math.random() - 0.5) * 20;
    const changePercent = (change / basePrice) * 100;
    const volume = Math.floor(Math.random() * 10000000);
    
    const category = getCategoryFromItemName(item.name, categoryData.categories);

    const now = new Date();
    now.setMilliseconds(0);
    const history = generateHistoricalData(basePrice, DATA_SIZE, DATA_STEP, now);
    const lastPrice = history[history.length - 1].price;
    const prediction = generatePredictionData(lastPrice, 10, DATA_STEP, now);

    return {
      id: index,
      symbol: item.display_name,
      name: item.name,
      logoUrl: '', 
      price: Number(basePrice.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume,
      qty,
      category,
      history,
      prediction,
    };
  });
};

export const useMockStockServer = () => {
  const [isDataReady, setDataReady] = React.useState(false);
  const dataRef = React.useRef<{
    rows: GridRowModel[];
  } | null>(null);

  React.useEffect(() => {
    try {
      const items = dataItems as ItemData[];
      const rows = convertItemsToStockData(items);
      console.log('Loaded item data:', rows.length, 'rows');
      const data: { rows: GridRowModel[] } = {
        rows,
      };
      dataRef.current = data;
      setDataReady(true);
    } catch (error) {
      console.error('Error loading item data:', error);
      dataRef.current = { rows: [] };
      setDataReady(true);
    }
  }, []);

  const fetchRows = React.useCallback(
    async (url: string): Promise<GridGetRowsResponse> => {
      if (!dataRef.current || !isDataReady) {
        console.warn('Data not ready yet:', { hasData: !!dataRef.current, isReady: isDataReady });
        return { rows: [], rowCount: 0 };
      }

      const queryString = url.startsWith('?') ? url.slice(1) : url;
      const params = new URLSearchParams(queryString);

      const page = parseInt(params.get('page') || '0', 10);
      const pageSize = parseInt(params.get('pageSize') || '25', 10);
      const sortModel = JSON.parse(params.get('sortModel') || '[]') as {
        field: keyof StockData;
        sort: 'asc' | 'desc';
      }[];
      const filterModel = JSON.parse(params.get('filterModel') || '{}') as Record<
        string,
        { value: string }
      >;

      const currentData = dataRef.current;
      if (!currentData) {
        return { rows: [], rowCount: 0 };
      }

      let rows = [...currentData.rows];

      if (sortModel.length > 0) {
        const { field, sort } = sortModel[0];
        rows.sort((a, b) => {
          const aValue = a[field];
          const bValue = b[field];
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sort === 'asc' ? aValue - bValue : bValue - aValue;
          }
          return 0;
        });
      }

      if (Object.keys(filterModel).length > 0) {
        rows = rows.filter((row) => {
          return Object.entries(filterModel).every(([field, filter]) => {
            const value = row[field as keyof StockData];
            return value?.toString().toLowerCase().includes(filter.value.toLowerCase()) ?? false;
          });
        });
      }

      const start = page * pageSize;
      const end = start + pageSize;
      const paginatedRows = rows.slice(start, end);

      console.log('Fetching rows:', { 
        totalRows: rows.length, 
        paginatedRows: paginatedRows.length,
        page,
        pageSize 
      });

      return {
        rows: paginatedRows,
        rowCount: rows.length,
      };
    },
    [isDataReady],
  );

  return {
    fetchRows,
    isReady: isDataReady,
  };
};

