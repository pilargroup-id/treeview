const API_URL = 'http://localhost:8000/api';

async function loadRevenue() {
    const accountHeader = document.getElementById('account_header').value;
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;

    try {
        document.getElementById('loading').style.display = 'inline';
        
        const url = `${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=${startDate}&end_date=${endDate}`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            renderChart(result.data);
            renderTable(result.data);
        } else {
            alert('Error: ' + (result.message || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load data: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function renderChart(data) {
    const ctx = document.getElementById('revenue_chart').getContext('2d');
    
    if (window.revenueChart) {
        window.revenueChart.destroy();
    }
    
    window.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.date),
            datasets: [{
                label: 'Total (Credit - Debit)',
                data: data.map(item => item.total),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Revenue Trend'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function renderTable(data) {
    const container = document.getElementById('data_table');
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Total (Credit - Debit)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(row => {
        html += `
            <tr>
                <td>${row.date}</td>
                <td>${formatCurrency(row.total)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

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

window.loadRevenue = loadRevenue;

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
            console.log('Invoice Data dari API:', result.data);
            console.log('Jumlah data:', result.data ? result.data.length : 0);
            
            // Pastikan data adalah array
            if (Array.isArray(result.data)) {
                renderCombinedChart(result.data);
            } else {
                console.error('Data dari API bukan array:', result.data);
                alert('Format data tidak valid dari server');
            }
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
    
    // Pastikan data dari API valid
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('Data kosong atau tidak valid dari API');
        return;
    }
    
    console.log('Data lengkap dari API:', data);
    
    const dateType = invoiceFilters.dateFilterType;
    
    // Get unique periods (dates) for X-axis - gunakan data langsung dari API
    const periods = [...new Set(data.map(item => item.period))].sort();
    
    console.log('Periods yang ditemukan:', periods);
    
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
    // Pastikan data dari API digunakan langsung
    console.log('Data untuk Business Unit Chart:', data);
    
    const businessUnits = [...new Set(data.map(item => item.business_unit))];
    
    // Prepare datasets
    const datasets = [];
    // Skema warna netral untuk business unit
    const colors = {
        'Gosave': { sales: 'rgb(33, 33, 33)', quantity: 'rgb(97, 97, 97)' },   // Hitam & abu-abu gelap
        'Goto': { sales: 'rgb(66, 66, 66)', quantity: 'rgb(117, 117, 117)' }  // Abu-abu gelap & medium
    };
    
    businessUnits.forEach(unit => {
        // Sales dataset for this BU - parse nilai numerik dari API
        const salesData = periods.map(period => {
            const record = data.find(d => d.period === period && d.business_unit === unit);
            if (record && record.total_sales !== null && record.total_sales !== undefined) {
                return parseFloat(record.total_sales) || 0;
            }
            return 0;
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
        
        // Quantity dataset for this BU - parse nilai numerik dari API
        const quantityData = periods.map(period => {
            const record = data.find(d => d.period === period && d.business_unit === unit);
            if (record && record.total_quantity !== null && record.total_quantity !== undefined) {
                return parseFloat(record.total_quantity) || 0;
            }
            return 0;
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
                    display: false
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 12,
                        font: { size: 12 },
                        color: '#424242'
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
                    grid: {
                        color: '#f5f5f5'
                    },
                    title: {
                        display: true,
                        text: 'Periode',
                        font: { size: 12, weight: 500 },
                        color: '#616161'
                    },
                    ticks: {
                        font: { size: 11 },
                        color: '#757575'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: '#f5f5f5'
                    },
                    title: {
                        display: true,
                        text: 'Penjualan (Rp)',
                        font: { size: 12, weight: 500 },
                        color: '#616161'
                    },
                    ticks: {
                        font: { size: 11 },
                        color: '#757575',
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
                        text: 'Quantity (Unit)',
                        font: { size: 12, weight: 500 },
                        color: '#616161'
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: '#f5f5f5'
                    },
                    ticks: {
                        font: { size: 11 },
                        color: '#757575',
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
    // Pastikan data dari API digunakan langsung
    console.log('Data untuk Compare Year Chart:', data);
    
    // Parse year sebagai integer untuk konsistensi
    const years = [...new Set(data.map(item => parseInt(item.year) || item.year))].sort((a, b) => a - b);
    
    const datasets = [];
    // Skema warna netral - grayscale dengan variasi subtle
    const colorPalette = [
        { sales: 'rgb(33, 33, 33)', quantity: 'rgb(97, 97, 97)' },      // Hitam & abu-abu gelap
        { sales: 'rgb(66, 66, 66)', quantity: 'rgb(117, 117, 117)' }, // Abu-abu gelap & medium
        { sales: 'rgb(97, 97, 97)', quantity: 'rgb(158, 158, 158)' },  // Abu-abu medium & terang
        { sales: 'rgb(117, 117, 117)', quantity: 'rgb(189, 189, 189)' }, // Abu-abu medium & lebih terang
        { sales: 'rgb(158, 158, 158)', quantity: 'rgb(224, 224, 224)' }  // Abu-abu terang & sangat terang
    ];
    
    years.forEach((year, index) => {
        const colorSet = colorPalette[index % colorPalette.length];
        
        // Sales dataset - parse nilai numerik dari API
        const salesData = periods.map(period => {
            const record = data.find(d => {
                const recordYear = parseInt(d.year) || d.year;
                return d.period === period && recordYear === year;
            });
            if (record && record.total_sales !== null && record.total_sales !== undefined) {
                return parseFloat(record.total_sales) || 0;
            }
            return 0;
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
        
        // Quantity dataset - parse nilai numerik dari API
        const quantityData = periods.map(period => {
            const record = data.find(d => {
                const recordYear = parseInt(d.year) || d.year;
                return d.period === period && recordYear === year;
            });
            if (record && record.total_quantity !== null && record.total_quantity !== undefined) {
                return parseFloat(record.total_quantity) || 0;
            }
            return 0;
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
                title: { display: false },
                legend: { 
                    display: true, 
                    position: 'top', 
                    labels: { 
                        usePointStyle: true, 
                        padding: 12, 
                        font: { size: 12 },
                        color: '#424242'
                    } 
                },
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
                    grid: {
                        color: '#f5f5f5'
                    },
                    title: { 
                        display: true, 
                        text: 'Tanggal',
                        font: { size: 12, weight: 500 },
                        color: '#616161'
                    },
                    ticks: {
                        font: { size: 11 },
                        color: '#757575',
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
                    display: false,
                    position: 'left',
                    grid: {
                        color: '#f5f5f5'
                    }
                },
                y1: {
                    type: 'linear',
                    display: false,
                    position: 'right',
                    grid: { 
                        drawOnChartArea: false,
                        color: '#f5f5f5'
                    }
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