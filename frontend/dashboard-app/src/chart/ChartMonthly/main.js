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
let allData = { data: [] }; 
let selectedMonths = new Set();
let tempSelectedMonths = new Set();
let monthPickerOpen = false;
let selectedBusinessUnits = new Set(['Gosave', 'Goto']); 
let showCredit = true;
let showDebit = true;
let showTotal = true;

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

function processData(apiData) {
    const processed = [];
    apiData.forEach(item => {
        const date = new Date(item.period + '-01');
        const monthIndex = date.getMonth();
        
        // Ensure debit data is properly extracted
        const credit = parseFloat(item.total_credit) || 0;
        const debit = parseFloat(item.total_debit) || 0;
        const total = parseFloat(item.total_difference) || (credit - debit);
        
        processed.push({
            month: monthNames[monthIndex],
            monthShort: monthShortNames[monthIndex],
            credit: credit,
            debit: debit,
            total: total
        });
    });
    
    // Debug: log processed data to check debit values
    console.log('Processed data:', processed);
    return processed;
}

// Get filtered data based on selected months
function getFilteredData(allData, selectedMonths) {
    if (selectedMonths.size === 0) {
        return {
            data: allData.data
        };
    }
    
    return {
        data: allData.data.filter(item => selectedMonths.has(item.month))
    };
}

// Load revenue data based on selected date range
async function loadRevenue() {
    const accountHeader = document.getElementById('account_header').value;
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    
    // Validate dates
    if (!startDate || !endDate) {
        alert('Mohon pilih tanggal mulai dan tanggal akhir');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
        return;
    }
    
    // Build business units query params
    const buParams = Array.from(selectedBusinessUnits).map(bu => `business_units[]=${bu}`).join('&');
    const buQuery = selectedBusinessUnits.size > 0 ? `&${buParams}` : '';
    
    try {
        document.getElementById('loading_overlay').style.display = 'flex';
        document.getElementById('load_revenue_btn').disabled = true;
        
        // Load data for the selected date range
        const response = await fetch(
            `${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=${startDate}&end_date=${endDate}${buQuery}`
        );

        const result = await response.json();

        // Debug: log raw API response to check debit data
        console.log('API Response:', result);

        if (result.status === 'success') {
            // Check if debit data exists in response
            if (result.data && result.data.length > 0) {
                console.log('Sample data item:', result.data[0]);
                console.log('Debit value:', result.data[0].total_debit);
            }
            
            allData = {
                data: processData(result.data)
            };
            
            // Debug: log final processed data
            console.log('Final allData:', allData);
            renderChart();
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
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
    if (!filteredData.data || filteredData.data.length === 0) {
        return; // No data to display
    }
    
    // Use the filtered data directly
    const chartData = filteredData.data.map(item => ({
        month: item.month,
        monthShort: item.monthShort,
        credit: parseFloat(item.credit) || 0,
        debit: parseFloat(item.debit) || 0,
        total: parseFloat(item.total) || 0
    }));
    
    // Debug: log chart data to verify debit is included
    if (chartData.length > 0) {
        console.log('First chart data item:', chartData[0]);
        console.log('Debit value:', chartData[0].debit);
    }
    
    // Prepare labels from chart data
    const labels = chartData.map(item => item.monthShort);
    
    // Prepare datasets
    const datasets = [];
    
    // Credit dataset
    if (showCredit) {
        datasets.push({
            label: 'Credit',
            data: chartData.map(item => item.credit),
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
        const debitData = chartData.map(item => item.debit);
        
        // Debug: log debit data being used in chart
        console.log('Debit data for chart:', debitData);
        console.log('Chart data for debit:', chartData.map(item => ({ month: item.month, debit: item.debit })));
        
        datasets.push({
            label: 'Debit',
            data: debitData,
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
            data: chartData.map(item => item.total),
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
    if (allData.data && allData.data.length > 0) {
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
    if (allData.data && allData.data.length > 0) {
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