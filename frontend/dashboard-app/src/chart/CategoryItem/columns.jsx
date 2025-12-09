import React from "react";
import SparkLine from "./sparklines";

export const columns = [
  { field: "symbol", headerName: "Display Name", width: 200 },
  { field: "name", headerName: "Name", width: 180 },
  {
    field: "spark",
    headerName: "Graph",
    width: 150,
    sortable: false,
    filterable: false,
    renderCell: (params) => <SparkLine data={params.value} />,
  },
  { field: "price", headerName: "Quantity", width: 120, type: "number" },
];
