import React from 'react';
import DateRangePickerWithPresets from './DateRangePickerWithPresets';

export interface RangeDate {
  start: string;
  end: string;
  year: number;
}

interface RangeDateFilterProps {
  rangeDates?: RangeDate[];
  onAddRange: (range: RangeDate) => void;
  onRemoveRange: (range: RangeDate) => void;
  availableYears?: number[];
  selectedYears?: number[];
  businessUnits?: string[];
  onBusinessUnitToggle?: (unit: string) => void;
  dataType?: 'both' | 'invoice' | 'payment';
  onDataTypeChange?: (type: 'both' | 'invoice' | 'payment') => void;
  invoiceData?: any[];
  open?: boolean;
  onClose?: () => void;
}

function RangeDateFilter({ 
  rangeDates = [], 
  onAddRange, 
  onRemoveRange, 
  availableYears = [], 
  selectedYears = [],
  businessUnits = [],
  onBusinessUnitToggle,
  dataType = 'both',
  onDataTypeChange,
  invoiceData = [],
  open,
  onClose
}: RangeDateFilterProps) {
  return (
    <DateRangePickerWithPresets
      rangeDates={rangeDates}
      onAddRange={onAddRange}
      onRemoveRange={onRemoveRange}
      availableYears={availableYears}
      selectedYears={selectedYears}
      businessUnits={businessUnits}
      onBusinessUnitToggle={onBusinessUnitToggle}
      dataType={dataType}
      onDataTypeChange={onDataTypeChange}
      invoiceData={invoiceData}
      open={open}
      onClose={onClose}
    />
  );
}

export default RangeDateFilter;

