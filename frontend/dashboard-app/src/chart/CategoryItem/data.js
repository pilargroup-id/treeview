export const STOCKS = [
    { symbol: "AAPL", name: "Apple Inc.", category: "Technology" },
    { symbol: "MSFT", name: "Microsoft Corporation", category: "Technology" },
    { symbol: "GOOGL", name: "Alphabet Inc.", category: "Technology" },
    { symbol: "AMZN", name: "Amazon.com, Inc.", category: "E-commerce" },
    { symbol: "TSLA", name: "Tesla, Inc.", category: "Automotive" },
    { symbol: "NVDA", name: "NVIDIA Corporation", category: "Technology" },
    { symbol: "META", name: "Meta Platforms, Inc.", category: "Social Media" },
    { symbol: "NFLX", name: "Netflix, Inc.", category: "Entertainment" },
    { symbol: "DIS", name: "The Walt Disney Company", category: "Entertainment" },
    { symbol: "INTC", name: "Intel Corporation", category: "Technology" },
  ];

export const CATEGORIES = Array.from(new Set(STOCKS.map(stock => stock.category)));
  