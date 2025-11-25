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
    specificDates: []
};

//  Tombol Tahun
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
    
    document.getElementById('year_filter_container').style.display = 'none';
    document.getElementById('range_filter_container').style.display = 'none';
    document.getElementById('specific_date_container').style.display = 'none';
    
    if (type === 'year') {
        document.getElementById('year_filter_container').style.display = 'block';
    } else if (type === 'range') {
        document.getElementById('range_filter_container').style.display = 'block';
    } else if (type === 'specific') {
        document.getElementById('specific_date_container').style.display = 'block';
    }
}

function addSpecificDate() {
    const input = document.getElementById('add_date_input');
    const date = input.value;
    
    if (!date) {
        alert('Pilih tanggal terlebih dahulu');
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
    // Ambil tipe filter
    const dateType = invoiceFilters.dateFilterType;
    
    // Validation
    if (invoiceFilters.businessUnits.length === 0) {
        alert('Pilih minimal 1 Business Unit');
        return;
    }
    
    // Validasi Filter
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
    
    try {
        document.getElementById('invoice_loading').style.display = 'inline';
        
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
        }
        
        const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
        console.log('Request URL:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('Invoice Data dari API:', result.data);
            console.log('Jumlah data:', result.data ? result.data.length : 0);
            
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
    
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('Data kosong atau tidak valid dari API');
        return;
    }
    
    console.log('Data lengkap dari API:', data);
    
    const dateType = invoiceFilters.dateFilterType;
    
    const periods = [...new Set(data.map(item => item.period))].sort();
    
    console.log('Periods yang ditemukan:', periods);
    
    renderBusinessUnitChart(ctx, data, periods);
}

function renderBusinessUnitChart(ctx, data, periods) {
    console.log('Data untuk Business Unit Chart:', data);
    
    const businessUnits = [...new Set(data.map(item => item.business_unit))];
    
    const datasets = [];
    // Warna BU
    const colors = {
        'Gosave': { sales: 'rgb(33, 33, 33)', quantity: 'rgb(97, 97, 97)' },   
        'Goto': { sales: 'rgb(66, 66, 66)', quantity: 'rgb(117, 117, 117)' }  
    };
    
    businessUnits.forEach(unit => {
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
            borderDash: [5, 5] 
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

// Load page
document.addEventListener('DOMContentLoaded', function() {
    initYearButtons();
});

// func
window.toggleBusinessUnit = toggleBusinessUnit;
window.toggleDateFilter = toggleDateFilter;
window.addSpecificDate = addSpecificDate;
window.removeSpecificDate = removeSpecificDate;
window.loadInvoiceSales = loadInvoiceSales;