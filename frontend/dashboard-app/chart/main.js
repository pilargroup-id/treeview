const API_URL = 'http://localhost:8000/api';

// Constants
const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

// State management
let allData = { data2024: [], data2025: [] };
let selectedMonths = new Set();
let tempSelectedMonths = new Set();
let monthPickerOpen = false;
let selectedBusinessUnits = new Set(['Gosave', 'Goto']); // Default: both selected
let showCredit = true;
let showDebit = true;
let showTotal = true;

// Format currency
function formatCurrency(num) {
    const value = parseFloat(num);
    if (isNaN(value)) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Process API data
function processData(apiData) {
    const processed = [];
    apiData.forEach(item => {
        const date = new Date(item.period + '-01');
        const monthIndex = date.getMonth();
        processed.push({
            month: monthNames[monthIndex],
            monthShort: monthShortNames[monthIndex],
            credit: item.total_credit || 0,
            debit: item.total_debit || 0,
            total: item.total_difference || 0
        });
    });
    return processed;
}

// Get filtered data based on selected months
function getFilteredData(allData, selectedMonths) {
    if (selectedMonths.size === 0) {
        return {
            data2024: allData.data2024,
            data2025: allData.data2025
        };
    }
    
    return {
        data2024: allData.data2024.filter(item => selectedMonths.has(item.month)),
        data2025: allData.data2025.filter(item => selectedMonths.has(item.month))
    };
}

// Load revenue data for both years
async function loadRevenue() {
    const accountHeader = document.getElementById('account_header').value;
    
    // Build business units query params
    const buParams = Array.from(selectedBusinessUnits).map(bu => `business_units[]=${bu}`).join('&');
    const buQuery = selectedBusinessUnits.size > 0 ? `&${buParams}` : '';
    
    try {
        document.getElementById('loading_overlay').style.display = 'flex';
        document.getElementById('load_revenue_btn').disabled = true;
        
        // Load data for both years in parallel
        const [response2024, response2025] = await Promise.all([
            fetch(`${API_URL}/financial/monthly-revenue?account_header=4000&start_date=2024-01-01&end_date=2024-12-31${buQuery}`),
            fetch(`${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=2025-01-01&end_date=2025-12-31${buQuery}`)
        ]);

        const [result2024, result2025] = await Promise.all([
            response2024.json(),
            response2025.json()
        ]);

        if (result2024.status === 'success' && result2025.status === 'success') {
            allData = {
                data2024: processData(result2024.data),
                data2025: processData(result2025.data)
            };
            renderChart();
        } else {
            alert('Error: ' + (result2024.message || result2025.message || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load data: ' + error.message);
    } finally {
        document.getElementById('loading_overlay').style.display = 'none';
        document.getElementById('load_revenue_btn').disabled = false;
    }
}

// Render chart
function renderChart() {
    const ctx = document.getElementById('revenue_chart').getContext('2d');
    
    if (window.revenueChart) {
        window.revenueChart.destroy();
    }
    
    const filteredData = getFilteredData(allData, selectedMonths);
    
    // Check if we have any data to display
    if (filteredData.data2024.length === 0 && filteredData.data2025.length === 0) {
        return; // No data to display
    }
    
    // Combine data from both years (sum by month)
    const combinedData = [];
    const maxLength = Math.max(filteredData.data2024.length, filteredData.data2025.length);
    
    for (let i = 0; i < maxLength; i++) {
        const item2024 = filteredData.data2024[i] || { credit: 0, debit: 0, total: 0, month: '', monthShort: '' };
        const item2025 = filteredData.data2025[i] || { credit: 0, debit: 0, total: 0, month: '', monthShort: '' };
        
        // Use month info from whichever has data
        const monthInfo = filteredData.data2024[i] || filteredData.data2025[i];
        
        combinedData.push({
            month: monthInfo?.month || item2024.month || item2025.month,
            monthShort: monthInfo?.monthShort || item2024.monthShort || item2025.monthShort,
            credit: (item2024.credit || 0) + (item2025.credit || 0),
            debit: (item2024.debit || 0) + (item2025.debit || 0),
            total: (item2024.total || 0) + (item2025.total || 0)
        });
    }
    
    // Prepare labels from combined data
    const labels = combinedData.map(item => item.monthShort);
    
    // Prepare datasets
    const datasets = [];
    
    // Credit dataset
    if (showCredit) {
        datasets.push({
            label: 'Credit',
            data: combinedData.map(item => item.credit || 0),
            backgroundColor: 'rgba(75, 192, 192, 0.75)',
            borderColor: 'rgb(75, 192, 192)',
            type: 'bar',
            yAxisID: 'y',
            barPercentage: 0.8,
            categoryPercentage: 0.6,
            borderSkipped: false,
            borderRadius: 4,
            borderWidth: 1
        });
    }
    
    // Debit dataset
    if (showDebit) {
        datasets.push({
            label: 'Debit',
            data: combinedData.map(item => item.debit || 0),
            backgroundColor: 'rgba(255, 99, 132, 0.75)',
            borderColor: 'rgb(255, 99, 132)',
            type: 'bar',
            yAxisID: 'y',
            barPercentage: 0.8,
            categoryPercentage: 0.6,
            borderSkipped: false,
            borderRadius: 4,
            borderWidth: 1
        });
    }
    
    // Total (Credit - Debit) as line chart
    if (showTotal) {
        datasets.push({
            label: 'Total (Credit - Debit)',
            data: combinedData.map(item => item.total || 0),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgb(16, 185, 129)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            type: 'line',
            yAxisID: 'y',
            tension: 0,
            fill: false
        });
    }
    
    // Don't render if no datasets
    if (datasets.length === 0) {
        return;
    }
    
    window.revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            plugins: {
                title: {
                    display: false
                },
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            const shortMonth = context[0].label;
                            const monthIndex = monthShortNames.indexOf(shortMonth);
                            return monthNames[monthIndex] || shortMonth;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Rupiah (IDR)',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.06)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        },
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Bulan',
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        maxRotation: 0,
                        minRotation: 0,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// Month Picker Functions
function initMonthPicker() {
    const container = document.getElementById('month_picker_body');
    container.innerHTML = '<div class="month-picker-grid"></div>';
    const grid = container.querySelector('.month-picker-grid');
    
    monthNames.forEach(month => {
        const btn = document.createElement('button');
        btn.className = 'month-picker-month';
        btn.textContent = month.substring(0, 3);
        btn.onclick = () => toggleMonth(month, btn);
        grid.appendChild(btn);
    });
    
    updateMonthPickerLabel();
}

function toggleMonth(month, btn) {
    if (tempSelectedMonths.has(month)) {
        tempSelectedMonths.delete(month);
        btn.classList.remove('selected');
    } else {
        tempSelectedMonths.add(month);
        btn.classList.add('selected');
    }
}

function toggleMonthPicker() {
    monthPickerOpen = !monthPickerOpen;
    const dropdown = document.getElementById('month_picker_dropdown');
    
    if (monthPickerOpen) {
        tempSelectedMonths = new Set(selectedMonths);
        updateMonthPickerButtons();
        dropdown.classList.add('open');
    } else {
        dropdown.classList.remove('open');
    }
}

function closeMonthPicker() {
    monthPickerOpen = false;
    document.getElementById('month_picker_dropdown').classList.remove('open');
}

function cancelMonthPicker() {
    tempSelectedMonths = new Set(selectedMonths);
    updateMonthPickerButtons();
    closeMonthPicker();
}

function applyMonthPicker() {
    selectedMonths = new Set(tempSelectedMonths);
    updateMonthPickerLabel();
    closeMonthPicker();
    if (allData.data2024.length > 0) {
        renderChart();
    }
}

function updateMonthPickerButtons() {
    const buttons = document.querySelectorAll('.month-picker-month');
    buttons.forEach((btn, index) => {
        const month = monthNames[index];
        if (tempSelectedMonths.has(month)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function updateMonthPickerLabel() {
    const label = document.getElementById('month_picker_label');
    if (selectedMonths.size === 0) {
        label.textContent = 'Pilih Bulan';
    } else if (selectedMonths.size === 1) {
        label.textContent = Array.from(selectedMonths)[0];
    } else {
        label.textContent = `${selectedMonths.size} Bulan`;
    }
}

// Business Unit Toggle Functions
function toggleBusinessUnit(bu) {
    if (selectedBusinessUnits.has(bu)) {
        selectedBusinessUnits.delete(bu);
    } else {
        selectedBusinessUnits.add(bu);
    }
    
    const card = document.getElementById(`bu_${bu.toLowerCase()}`);
    if (selectedBusinessUnits.has(bu)) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
    
    // Auto-reload if data already loaded
    if (allData.data2024.length > 0 || allData.data2025.length > 0) {
        loadRevenue();
    }
}

// Initialize BU filter cards
function initBusinessUnitFilters() {
    // Set default selected state
    if (selectedBusinessUnits.has('Gosave')) {
        document.getElementById('bu_gosave').classList.add('selected');
    }
    if (selectedBusinessUnits.has('Goto')) {
        document.getElementById('bu_goto').classList.add('selected');
    }
}

// Legend Toggle Functions
function toggleLegendCredit() {
    showCredit = !showCredit;
    const legendItem = document.getElementById('legend_credit');
    const indicator = legendItem.querySelector('.legend-indicator');
    
    if (showCredit) {
        legendItem.classList.remove('inactive');
        indicator.classList.remove('inactive');
    } else {
        legendItem.classList.add('inactive');
        indicator.classList.add('inactive');
    }
    
    if (allData.data2024.length > 0 || allData.data2025.length > 0) {
        renderChart();
    }
}

function toggleLegendDebit() {
    showDebit = !showDebit;
    const legendItem = document.getElementById('legend_debit');
    const indicator = legendItem.querySelector('.legend-indicator');
    
    if (showDebit) {
        legendItem.classList.remove('inactive');
        indicator.classList.remove('inactive');
    } else {
        legendItem.classList.add('inactive');
        indicator.classList.add('inactive');
    }
    
    if (allData.data2024.length > 0 || allData.data2025.length > 0) {
        renderChart();
    }
}

function toggleLegendTotal() {
    showTotal = !showTotal;
    const legendItem = document.getElementById('legend_total');
    const indicator = legendItem.querySelector('.legend-indicator');
    
    if (showTotal) {
        legendItem.classList.remove('inactive');
        indicator.classList.remove('inactive');
    } else {
        legendItem.classList.add('inactive');
        indicator.classList.add('inactive');
    }
    
    if (allData.data2024.length > 0 || allData.data2025.length > 0) {
        renderChart();
    }
}

// Close month picker when clicking outside
document.addEventListener('click', function(event) {
    const container = document.getElementById('month_picker_container');
    if (container && !container.contains(event.target) && monthPickerOpen) {
        closeMonthPicker();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initMonthPicker();
    initBusinessUnitFilters();
});

// Expose functions
window.loadRevenue = loadRevenue;
window.toggleMonthPicker = toggleMonthPicker;
window.closeMonthPicker = closeMonthPicker;
window.cancelMonthPicker = cancelMonthPicker;
window.applyMonthPicker = applyMonthPicker;
window.toggleBusinessUnit = toggleBusinessUnit;
window.toggleLegendCredit = toggleLegendCredit;
window.toggleLegendDebit = toggleLegendDebit;
window.toggleLegendTotal = toggleLegendTotal;

// ========== INVOICE SALES SECTION ==========

// State management
const invoiceFilters = {
    businessUnits: [],
    dateFilterType: 'year',
    years: [],
    rangeStart: null,
    rangeEnd: null,
    specificDates: [],
    compareDates: [],
    compareYears: [] 
};

// Initialize year buttons (last 5 years)
function initYearButtons() {
    const currentYear = new Date().getFullYear();
    const container = document.getElementById('year_buttons');
    
    for (let i = 0; i < 5; i++) {
        const year = currentYear - i;
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = year;
        btn.onclick = () => toggleYear(year, btn);
        container.appendChild(btn);
    }
}


function toggleBusinessUnit(unit) {
    const index = invoiceFilters.businessUnits.indexOf(unit);
    const btn = document.querySelector(`[data-unit="${unit}"]`);
    
    if (index > -1) {
        invoiceFilters.businessUnits.splice(index, 1);
        btn.classList.remove('active');
    } else {
        invoiceFilters.businessUnits.push(unit);
        btn.classList.add('active');
    }
}

function toggleYear(year, btn) {
    const index = invoiceFilters.years.indexOf(year);
    
    if (index > -1) {
        invoiceFilters.years.splice(index, 1);
        btn.classList.remove('active');
    } else {
        invoiceFilters.years.push(year);
        btn.classList.add('active');
    }
}

function toggleDateFilter() {
    const type = document.getElementById('date_filter_type').value;
    invoiceFilters.dateFilterType = type;
    
    // Hide all containers
    document.getElementById('year_filter_container').style.display = 'none';
    document.getElementById('range_filter_container').style.display = 'none';
    document.getElementById('specific_date_container').style.display = 'none';
    document.getElementById('compare_year_container').style.display = 'none';
    
    // Show relevant container
    if (type === 'year') {
        document.getElementById('year_filter_container').style.display = 'block';
    } else if (type === 'range') {
        document.getElementById('range_filter_container').style.display = 'block';
    } else if (type === 'specific') {
        document.getElementById('specific_date_container').style.display = 'block';
    } else if (type === 'compare_year') {
        document.getElementById('compare_year_container').style.display = 'block';
        initCompareYearButtons();
    }
}

function addSpecificDate() {
    const input = document.getElementById('add_date_input');
    const date = input.value;
    
    if (!date) {
        alert('Pilih tanggal terlebih dahulu');
        return;
    }
    
    if (invoiceFilters.specificDates.length >= 30) {
        alert('Maksimal 30 tanggal');
        return;
    }
    
    if (invoiceFilters.specificDates.includes(date)) {
        alert('Tanggal sudah dipilih');
        return;
    }
    
    invoiceFilters.specificDates.push(date);
    invoiceFilters.specificDates.sort(); 
    renderSpecificDates();
    input.value = '';
}

function removeSpecificDate(date) {
    const index = invoiceFilters.specificDates.indexOf(date);
    if (index > -1) {
        invoiceFilters.specificDates.splice(index, 1);
        renderSpecificDates();
    }
}

function initCompareYearButtons() {
    const container = document.getElementById('compare_year_buttons');
    if (container.children.length > 0) return; // Already initialized
    
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 5; i++) {
        const year = currentYear - i;
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = year;
        btn.onclick = () => toggleCompareYear(year, btn);
        container.appendChild(btn);
    }
}

function addCompareDate() {
    const input = document.getElementById('compare_date_input');
    const fullDate = input.value;
    
    if (!fullDate) {
        alert('Pilih tanggal terlebih dahulu');
        return;
    }
    
    // Extract month and day only (MM-DD format)
    const dateObj = new Date(fullDate);
    const monthDay = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    
    if (invoiceFilters.compareDates.includes(monthDay)) {
        alert('Tanggal & bulan ini sudah dipilih');
        return;
    }
    
    invoiceFilters.compareDates.push(monthDay);
    renderCompareDates();
    
    // Show year selector after first date is added
    if (invoiceFilters.compareDates.length > 0) {
        document.getElementById('compare_year_selector').style.display = 'block';
    }
    
    input.value = '';
}

function removeCompareDate(monthDay) {
    const index = invoiceFilters.compareDates.indexOf(monthDay);
    if (index > -1) {
        invoiceFilters.compareDates.splice(index, 1);
        renderCompareDates();
        
        // Hide year selector if no dates
        if (invoiceFilters.compareDates.length === 0) {
            document.getElementById('compare_year_selector').style.display = 'none';
        }
    }
}

function renderCompareDates() {
    const container = document.getElementById('compare_dates_selected');
    container.innerHTML = '';
    
    if (invoiceFilters.compareDates.length === 0) {
        container.innerHTML = '<span style="color:#999;">Belum ada tanggal dipilih</span>';
        return;
    }
    
    invoiceFilters.compareDates.forEach(monthDay => {
        const [month, day] = monthDay.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const displayDate = `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
        
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${displayDate}
            <span class="remove-tag" onclick="removeCompareDate('${monthDay}')">×</span>
        `;
        container.appendChild(tag);
    });
}

function toggleCompareYear(year, btn) {
    const index = invoiceFilters.compareYears.indexOf(year);
    
    if (index > -1) {
        invoiceFilters.compareYears.splice(index, 1);
        btn.classList.remove('active');
    } else {
        invoiceFilters.compareYears.push(year);
        btn.classList.add('active');
    }
}

function renderSpecificDates() {
    const container = document.getElementById('selected_dates');
    container.innerHTML = '';
    
    if (invoiceFilters.specificDates.length === 0) {
        container.innerHTML = '<span style="color:#999;">Belum ada tanggal dipilih</span>';
        return;
    }
    
    invoiceFilters.specificDates.forEach(date => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${date}
            <span class="remove-tag" onclick="removeSpecificDate('${date}')">×</span>
        `;
        container.appendChild(tag);
    });
}

async function loadInvoiceSales() {
    // Get date type first
    const dateType = invoiceFilters.dateFilterType;
    
    // Validation
    if (invoiceFilters.businessUnits.length === 0) {
        alert('Pilih minimal 1 Business Unit');
        return;
    }
    
    // Validate based on filter type
    if (dateType === 'year' && invoiceFilters.years.length === 0) {
        alert('Pilih minimal 1 tahun');
        return;
    }
    
    if (dateType === 'range') {
        const startDate = document.getElementById('range_start_date').value;
        const endDate = document.getElementById('range_end_date').value;
        
        if (!startDate || !endDate) {
            alert('Pilih tanggal mulai dan akhir');
            return;
        }
        
        invoiceFilters.rangeStart = startDate;
        invoiceFilters.rangeEnd = endDate;
    }
    
    if (dateType === 'specific' && invoiceFilters.specificDates.length === 0) {
        alert('Tambahkan minimal 1 tanggal');
        return;
    }
    
    if (dateType === 'compare_year') {
        if (invoiceFilters.compareDates.length === 0) {
            alert('Tambahkan minimal 1 tanggal');
            return;
        }
        if (invoiceFilters.compareYears.length === 0) {
            alert('Pilih minimal 1 tahun untuk perbandingan');
            return;
        }
    }
    
    try {
        document.getElementById('invoice_loading').style.display = 'inline';
        
        // Build query params
        const params = new URLSearchParams();
        invoiceFilters.businessUnits.forEach(unit => params.append('business_units[]', unit));
        params.append('date_type', dateType);
        
        if (dateType === 'year') {
            invoiceFilters.years.forEach(year => params.append('years[]', year));
        } else if (dateType === 'range') {
            params.append('start_date', invoiceFilters.rangeStart);
            params.append('end_date', invoiceFilters.rangeEnd);
        } else if (dateType === 'specific') {
            invoiceFilters.specificDates.forEach(date => {
                params.append('specific_dates[]', date);
            });
        } else if (dateType === 'compare_year') {
            invoiceFilters.compareDates.forEach(date => {
                params.append('compare_dates[]', date);
            });
            invoiceFilters.compareYears.forEach(year => {
                params.append('compare_years[]', year);
            });
        }
        
        const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
        console.log('Request URL:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('Invoice Data:', result.data);
            renderCombinedChart(result.data);
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load data: ' + error.message);
    } finally {
        document.getElementById('invoice_loading').style.display = 'none';
    }
}

function renderCombinedChart(data) {
    const ctx = document.getElementById('invoice_combined_chart').getContext('2d');
    
    if (window.combinedChart) {
        window.combinedChart.destroy();
    }
    
    const dateType = invoiceFilters.dateFilterType;
    
    // Get unique periods (dates) for X-axis
    const periods = [...new Set(data.map(item => item.period))].sort();
    
    // Determine grouping logic
    const isCompareYear = dateType === 'compare_year';
    
    if (isCompareYear) {
        // Group by year instead of business unit
        renderCompareYearChart(ctx, data, periods);
    } else {
        // Group by business unit (existing logic)
        renderBusinessUnitChart(ctx, data, periods);
    }
}

function renderBusinessUnitChart(ctx, data, periods) {
    const businessUnits = [...new Set(data.map(item => item.business_unit))];
    
    // Prepare datasets
    const datasets = [];
    const colors = {
        'Gosave': { sales: 'rgb(75, 192, 192)', quantity: 'rgb(54, 162, 235)' },
        'Goto': { sales: 'rgb(255, 99, 132)', quantity: 'rgb(255, 159, 64)' }
    };
    
    businessUnits.forEach(unit => {
        // Sales dataset for this BU
        const salesData = periods.map(period => {
            const record = data.find(d => d.period === period && d.business_unit === unit);
            return record ? record.total_sales : 0;
        });
        
        datasets.push({
            label: `${unit} - Penjualan`,
            data: salesData,
            borderColor: colors[unit].sales,
            backgroundColor: colors[unit].sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            yAxisID: 'y',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
        });
        
        // Quantity dataset for this BU
        const quantityData = periods.map(period => {
            const record = data.find(d => d.period === period && d.business_unit === unit);
            return record ? record.total_quantity : 0;
        });
        
        datasets.push({
            label: `${unit} - Quantity`,
            data: quantityData,
            borderColor: colors[unit].quantity,
            backgroundColor: colors[unit].quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            yAxisID: 'y1',
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5] // Dashed line for quantity
        });
    });
    
    window.combinedChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: periods,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Sales & Quantity Trend by Business Unit',
                    font: { size: 18 }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (label.includes('Penjualan')) {
                                    label += formatCurrency(context.parsed.y);
                                } else {
                                    label += context.parsed.y.toLocaleString() + ' unit';
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Period'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Penjualan (Rp)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Quantity (Unit)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderCompareYearChart(ctx, data, periods) {
    const years = [...new Set(data.map(item => item.year))].sort();
    
    const datasets = [];
    const colorPalette = [
        { sales: 'rgb(75, 192, 192)', quantity: 'rgb(255, 99, 132)' },   // Hijau & Merah
        { sales: 'rgb(255, 159, 64)', quantity: 'rgb(153, 102, 255)' },  // Orange & Ungu
        { sales: 'rgb(54, 162, 235)', quantity: 'rgb(255, 206, 86)' },   // Biru & Kuning
        { sales: 'rgb(201, 203, 207)', quantity: 'rgb(75, 192, 192)' },  // Abu & Tosca
        { sales: 'rgb(255, 99, 71)', quantity: 'rgb(60, 179, 113)' }     // Tomat & Hijau Laut
    ];
    
    years.forEach((year, index) => {
        const colorSet = colorPalette[index % colorPalette.length];
        
        // Sales dataset
        const salesData = periods.map(period => {
            const record = data.find(d => d.period === period && d.year === year);
            return record ? record.total_sales : 0;
        });
        
        datasets.push({
            label: `${year} - Penjualan`,
            data: salesData,
            borderColor: colorSet.sales,
            backgroundColor: colorSet.sales.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6
        });
        
        // Quantity dataset
        const quantityData = periods.map(period => {
            const record = data.find(d => d.period === period && d.year === year);
            return record ? record.total_quantity : 0;
        });
        
        datasets.push({
            label: `${year} - Quantity`,
            data: quantityData,
            borderColor: colorSet.quantity,
            backgroundColor: colorSet.quantity.replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.3,
            fill: false,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderDash: [5, 5]
        });
    });
    
    window.combinedChart = new Chart(ctx, {
        type: 'line',
        data: { labels: periods, datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                title: { display: true, text: 'Year-over-Year Comparison', font: { size: 18 } },
                legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 15 } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += label.includes('Penjualan') 
                                    ? formatCurrency(context.parsed.y)
                                    : context.parsed.y.toLocaleString() + ' unit';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    display: true, 
                    title: { display: true, text: 'Date (MM-DD)' },
                    ticks: {
                        callback: function(value, index) {
                            const label = this.getLabelForValue(value);
                            const [month, day] = label.split('-');
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: false, // Hide left axis
                    position: 'left'
                },
                y1: {
                    type: 'linear',
                    display: false, // Hide right axis
                    position: 'right',
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initYearButtons();
});

// Expose functions
window.toggleBusinessUnit = toggleBusinessUnit;
window.toggleDateFilter = toggleDateFilter;
window.addSpecificDate = addSpecificDate;
window.removeSpecificDate = removeSpecificDate;
window.loadInvoiceSales = loadInvoiceSales;
window.addCompareDate = addCompareDate;
window.removeCompareDate = removeCompareDate;