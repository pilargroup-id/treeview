import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook untuk mengelola state month picker
 */
export const useMonthPicker = (selectedMonths) => {
  const [tempSelectedMonths, setTempSelectedMonths] = useState(new Set());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target)) {
        setMonthPickerOpen(false);
      }
    };

    if (monthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [monthPickerOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMonthPickerOpen(false);
      }
    };

    if (monthPickerOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [monthPickerOpen]);

  const handleMonthToggle = (month) => {
    const newSet = new Set(tempSelectedMonths);
    if (newSet.has(month)) {
      newSet.delete(month);
    } else {
      newSet.add(month);
    }
    setTempSelectedMonths(newSet);
  };

  const handleApplyMonths = (onApply) => {
    if (onApply) {
      onApply(new Set(tempSelectedMonths));
    }
    setMonthPickerOpen(false);
  };

  const handleCancelMonths = () => {
    setTempSelectedMonths(new Set(selectedMonths));
    setMonthPickerOpen(false);
  };

  const handleOpenMonthPicker = () => {
    setTempSelectedMonths(new Set(selectedMonths));
    setMonthPickerOpen(true);
  };

  return {
    tempSelectedMonths,
    monthPickerOpen,
    monthPickerRef,
    handleMonthToggle,
    handleApplyMonths,
    handleCancelMonths,
    handleOpenMonthPicker
  };
};

