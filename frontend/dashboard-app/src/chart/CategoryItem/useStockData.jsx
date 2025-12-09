import React from "react";
import { STOCKS } from "./data";
import { randomWalk } from "./randomWalk";

export function useStockData(selectedCategory = null) {
  const [rows, setRows] = React.useState(
    STOCKS.map((s, id) => ({
      id,
      symbol: s.symbol,
      name: s.name,
      category: s.category,
      spark: [100],
      price: 100,
    }))
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRows((prev) =>
        prev.map((row) => {
          const newPrice = randomWalk(row.price);

          return {
            ...row,
            price: newPrice,
            spark: [...row.spark.slice(-20), newPrice],
          };
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Filter rows by selected category
  const filteredRows = selectedCategory
    ? rows.filter(row => row.category === selectedCategory)
    : rows;

  return { rows: filteredRows, allRows: rows };
}
