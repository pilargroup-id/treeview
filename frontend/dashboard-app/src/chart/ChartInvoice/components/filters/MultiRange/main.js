const API_URL = 'http://localhost:8000/api';

// ========== INVOICE SALES SECTION (MULTI RANGE ONLY) ==========

const invoiceFilters = {
    businessUnits: [],
    multiRanges: []
};

let rangeCounter = 1;

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

function addRangeInput() {
    if (rangeCounter >= 5) {
        alert('Maksimal 5 range tanggal');
        return;
    }
    
    rangeCounter++;
    const container = document.getElementById('range_inputs_container');
    
    const rangeDiv = document.createElement('div');
    rangeDiv.className = 'range-input-group';
    rangeDiv.setAttribute('data-range-index', rangeCounter - 1);
    rangeDiv.innerHTML = `
        <span class="range-label">Range ${rangeCounter}:</span>
        <input type="date" class="range-start" placeholder="Tanggal Mulai">
        <span>sampai</span>
        <input type="date" class="range-end" placeholder="Tanggal Akhir">
        <button class="btn-small" onclick="validateRange(${rangeCounter - 1})">✓ Validasi</button>
        <span class="range-status"></span>
        <button class="btn-small" style="background:#dc3545;" onclick="removeRange(${rangeCounter - 1})">✕</button>
    `;
    
    container.appendChild(rangeDiv);
    
    if (rangeCounter >= 5) {
        document.getElementById('add_range_btn').style.display = 'none';
    }
}

function removeRange(index) {
    const rangeGroup = document.querySelector(`[data-range-index="${index}"]`);
    if (rangeGroup) {
        rangeGroup.remove();
        rangeCounter--;
        
        invoiceFilters.multiRanges = invoiceFilters.multiRanges.filter((_, i) => i !== index);
        renderValidatedRanges();
        
        document.getElementById('add_range_btn').style.display = 'inline-block';
    }
}

function validateRange(index) {
    const rangeGroup = document.querySelector(`[data-range-index="${index}"]`);
    const startInput = rangeGroup.querySelector('.range-start');
    const endInput = rangeGroup.querySelector('.range-end');
    const statusSpan = rangeGroup.querySelector('.range-status');
    
    const startDate = startInput.value;
    const endDate = endInput.value;
    
    if (!startDate || !endDate) {
        statusSpan.textContent = '⚠ Pilih kedua tanggal';
        statusSpan.className = 'range-status invalid';
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
        statusSpan.textContent = '⚠ Tanggal akhir harus setelah tanggal mulai';
        statusSpan.className = 'range-status invalid';
        return;
    }
    
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 31) {
        statusSpan.textContent = `⚠ Maksimal 31 hari (sekarang: ${diffDays} hari)`;
        statusSpan.className = 'range-status invalid';
        return;
    }
    
    statusSpan.textContent = `✓ Valid (${diffDays} hari)`;
    statusSpan.className = 'range-status valid';
    rangeGroup.classList.add('range-validated');
    
    invoiceFilters.multiRanges[index] = {
        start: startDate,
        end: endDate,
        days: diffDays,
        validated: true
    };
    
    renderValidatedRanges();
}

function renderValidatedRanges() {
    const container = document.getElementById('validated_ranges');
    container.innerHTML = '';
    
    const validRanges = invoiceFilters.multiRanges.filter(r => r && r.validated);
    
    if (validRanges.length === 0) {
        container.innerHTML = '<span style="color:#999;">Belum ada range yang divalidasi</span>';
        return;
    }
    
    validRanges.forEach((range, index) => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.style.background = '#28a745';
        tag.innerHTML = `
            Range ${index + 1}: ${formatDate(range.start)} - ${formatDate(range.end)} (${range.days} hari)
        `;
        container.appendChild(tag);
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
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

async function loadInvoiceSales() {
    if (invoiceFilters.businessUnits.length === 0) {
        alert('Pilih minimal 1 Business Unit');
        return;
    }
    
    const validRanges = invoiceFilters.multiRanges.filter(r => r && r.validated);
    if (validRanges.length === 0) {
        alert('Validasi minimal 1 range tanggal');
        return;
    }
    
    try {
        document.getElementById('invoice_loading').style.display = 'inline';
        
        const params = new URLSearchParams();
        invoiceFilters.businessUnits.forEach(unit => params.append('business_units[]', unit));
        params.append('date_type', 'multi_range');
        
        validRanges.forEach((range, index) => {
            params.append(`date_ranges[${index}][start]`, range.start);
            params.append(`date_ranges[${index}][end]`, range.end);
        });
        
        const url = `${API_URL}/financial/invoice-sales?${params.toString()}`;
        console.log('Request URL:', url);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('Invoice Data:', result.data);
            renderMultiRangeChart(result.data);
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

function renderMultiRangeChart(data) {
    const ctx = document.getElementById('invoice_combined_chart').getContext('2d');
    
    if (window.combinedChart) {
        window.combinedChart.destroy();
    }
    
    const rangeGroups = [...new Set(data.map(item => item.period))];
    const businessUnits = [...new Set(data.map(item => item.business_unit))];
    
    const datasets = [];
    
    businessUnits.forEach((unit) => {
        const colorPalette = {
            'Gosave': { sales: 'rgb(75, 192, 192)', quantity: 'rgb(54, 162, 235)' },
            'Goto': { sales: 'rgb(255, 99, 132)', quantity: 'rgb(255, 159, 64)' }
        };
        
        const colors = colorPalette[unit] || { 
            sales: 'rgb(201, 203, 207)', 
            quantity: 'rgb(153, 102, 255)' 
        };
        
        const salesData = rangeGroups.map(range => {
            const record = data.find(d => d.period === range && d.business_unit === unit);
            return record ? record.total_sales : 0;
        });
        
        datasets.push({
            label: `${unit} - Penjualan`,
            data: salesData,
            backgroundColor: colors.sales.replace('rgb', 'rgba').replace(')', ', 0.7)'),
            borderColor: colors.sales,
            borderWidth: 1
        });
        
        const quantityData = rangeGroups.map(range => {
            const record = data.find(d => d.period === range && d.business_unit === unit);
            return record ? record.total_quantity : 0;
        });
        
        datasets.push({
            label: `${unit} - Quantity`,
            data: quantityData,
            backgroundColor: colors.quantity.replace('rgb', 'rgba').replace(')', ', 0.7)'),
            borderColor: colors.quantity,
            borderWidth: 1
        });
    });
    
    window.combinedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: rangeGroups,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Multi Range Comparison',
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
                    title: {
                        display: true,
                        text: 'Date Range'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Amount'
                    },
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

// Expose functions
window.toggleBusinessUnit = toggleBusinessUnit;
window.loadInvoiceSales = loadInvoiceSales;
window.addRangeInput = addRangeInput;
window.removeRange = removeRange;
window.validateRange = validateRange;