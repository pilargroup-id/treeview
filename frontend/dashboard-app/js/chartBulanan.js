const API_URL = 'http://localhost:8000/api';
let revenueChart = null;
let allData = { data2024: [], data2025: [] };
let selectedMonths = new Set();
let tempSelectedMonths = new Set();
let showPercentage = false;
let show2024 = true;
let show2025 = true;

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                         'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

async function loadRevenue() {
    const accountHeader = document.getElementById('accountHeader').value;
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadBtn = document.getElementById('loadDataBtn');

    try {
        loadingOverlay.classList.add('active');
        loadBtn.disabled = true;
        
        const url2024 = `${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=2024-01-01&end_date=2024-12-31`;
        const response2024 = await fetch(url2024);
        const result2024 = await response2024.json();
        
        const url2025 = `${API_URL}/financial/monthly-revenue?account_header=${accountHeader}&start_date=2025-01-01&end_date=2025-12-31`;
        const response2025 = await fetch(url2025);
        const result2025 = await response2025.json();
        
        if (result2024.status === 'success' && result2025.status === 'success') {
            allData.data2024 = processData(result2024.data);
            allData.data2025 = processData(result2025.data);
            
            populateMonthOptions();
            renderChart();
        } else {
            alert('Error loading data');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to load data: ' + error.message);
    } finally {
        loadingOverlay.classList.remove('active');
        loadBtn.disabled = false;
    }
}

function processData(apiData) {
    const processed = [];
    apiData.forEach(item => {
        const date = new Date(item.date + '-01');
        const monthIndex = date.getMonth();
        processed.push({
            month: monthNames[monthIndex],
            monthShort: monthShortNames[monthIndex],
            total: item.total
        });
    });
    return processed;
}

function populateMonthOptions() {
    const monthGrid = document.getElementById('monthGrid');
    monthGrid.innerHTML = '';

    monthNames.forEach(month => {
        const btn = document.createElement('div');
        btn.className = 'month-btn';
        btn.dataset.month = month;
        btn.textContent = month.substring(0, 3);
        btn.addEventListener('click', () => {
            if (tempSelectedMonths.has(month)) {
                tempSelectedMonths.delete(month);
            } else {
                tempSelectedMonths.add(month);
            }
            updateMonthSelectionUI();
        });
        monthGrid.appendChild(btn);
    });
}

function updateMonthSelectionUI() {
    const monthGrid = document.getElementById('monthGrid');
    monthGrid.querySelectorAll('.month-btn').forEach(btn => {
        const month = btn.dataset.month;
        if (tempSelectedMonths.has(month)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

function updateButtonLabel() {
    const monthPickerLabel = document.getElementById('monthPickerLabel');
    
    if (selectedMonths.size === 0) {
        monthPickerLabel.textContent = 'Pilih Bulan';
    } else if (selectedMonths.size === 1) {
        monthPickerLabel.textContent = Array.from(selectedMonths)[0];
    } else {
        monthPickerLabel.textContent = `${selectedMonths.size} Bulan`;
    }
}

function getFilteredData() {
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

function calculatePercentageChange(val2024, val2025) {
    if (val2024 === 0) {
        return val2025 > 0 ? 100 : 0;
    }
    return ((val2025 - val2024) / val2024) * 100;
}

function renderChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const filteredData = getFilteredData();
    const labels = filteredData.data2024.map(item => item.monthShort);
    
    const percentageChanges = filteredData.data2024.map((item, index) => {
        const val2024 = item.total;
        const val2025 = filteredData.data2025[index]?.total || 0;
        return calculatePercentageChange(val2024, val2025);
    });
    
    const datasets = [];
    
    const barConfig = {
        type: 'bar',
        yAxisID: 'y',
        barPercentage: 0.8, 
        categoryPercentage: 0.6, 
        borderSkipped: false,
        borderRadius: 4,
        borderWidth: 1
    };
    
    if (show2024) {
        datasets.push({
            label: '2024 Revenue',
            data: filteredData.data2024.map(item => item.total),
            backgroundColor: 'rgba(54, 162, 235, 0.75)',
            borderColor: 'rgb(54, 162, 235)',
            ...barConfig
        });
    }
    
    if (show2025) {
        datasets.push({
            label: '2025 Revenue',
            data: filteredData.data2025.map(item => item.total),
            backgroundColor: 'rgba(255, 99, 132, 0.75)',
            borderColor: 'rgb(255, 99, 132)',
            ...barConfig
        });
    }
    
    if (showPercentage) {
        datasets.push({
            label: 'Persentase Perubahan',
            data: percentageChanges,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: 'rgb(16, 185, 129)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            type: 'line',
            yAxisID: 'y1',
            tension: 0,
            fill: false
        });
    }
    

    const scales = {
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
    };
    
    if (showPercentage) {
        scales.y1 = {
            beginAtZero: false,
            position: 'right',
            title: {
                display: true,
                text: 'Persentase (%)',
                font: {
                    size: 13,
                    weight: 'bold'
                },
                color: 'rgb(16, 185, 129)'
            },
            grid: {
                drawOnChartArea: false
            },
            ticks: {
                callback: function(value) {
                    return value.toFixed(1) + '%';
                },
                font: {
                    size: 11
                },
                color: 'rgb(16, 185, 129)'
            }
        };
    }
    
    const plugins = [
        {
            id: 'percentageLabels',
            afterDatasetsDraw: function(chart) {
                if (!showPercentage || !show2024 || !show2025) return;
                
                const ctx = chart.ctx;
                const meta2024 = chart.getDatasetMeta(0);
                const meta2025 = chart.getDatasetMeta(1);
                
                if (!meta2024 || !meta2025) return;
                
                meta2025.data.forEach((bar, index) => {
                    const bar2024 = meta2024.data[index];
                    if (!bar2024) return;
                    
                    const val2024 = filteredData.data2024[index]?.total || 0;
                    const val2025 = filteredData.data2025[index]?.total || 0;
                    const percentChange = calculatePercentageChange(val2024, val2025);
                    
                    if (val2024 > 0 || val2025 > 0) {
                        const x = (bar2024.x + bar.x) / 2;
                        const y = Math.min(bar2024.y, bar.y) - 15;
                        
                        ctx.save();
                        ctx.font = 'bold 11px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        
                        if (percentChange >= 0) {
                            ctx.fillStyle = '#10b981';
                        } else {
                            ctx.fillStyle = '#ef4444';
                        }
                        
                        const arrow = percentChange >= 0 ? '▲' : '▼';
                        const text = `${arrow} ${Math.abs(percentChange).toFixed(1)}%`;
                        
                        ctx.fillText(text, x, y);
                        ctx.restore();
                    }
                });
            }
        }
    ];
    
    revenueChart = new Chart(ctx, {
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
                            
                            if (context.dataset.yAxisID === 'y1') {
                                label += context.parsed.y.toFixed(2) + '%';
                            } else {
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                            }
                            return label;
                        },
                        afterBody: function(context) {
                            if (context.length > 0 && !showPercentage) {
                                const dataIndex = context[0].dataIndex;
                                const val2024 = filteredData.data2024[dataIndex]?.total || 0;
                                const val2025 = filteredData.data2025[dataIndex]?.total || 0;
                                const percentChange = calculatePercentageChange(val2024, val2025);
                                
                                const arrow = percentChange >= 0 ? '↑' : '↓';
                                const color = percentChange >= 0 ? 'Naik' : 'Turun';
                                
                                return [
                                    '',
                                    `${color} ${arrow} ${Math.abs(percentChange).toFixed(2)}%`
                                ];
                            }
                            return [];
                        }
                    }
                }
            },
            scales: scales,
            interaction: {
                intersect: false,
                mode: 'index'
            }
        },
        plugins: plugins
    });
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

function openPicker() {
    const monthPickerCard = document.getElementById('monthPickerCard');
    tempSelectedMonths = new Set(selectedMonths);
    updateMonthSelectionUI();
    monthPickerCard.classList.add('active');
}

function closePicker() {
    const monthPickerCard = document.getElementById('monthPickerCard');
    monthPickerCard.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', function() {
    const monthPickerBtn = document.getElementById('monthPickerBtn');
    const monthPickerCard = document.getElementById('monthPickerCard');
    const closeMonthPickerBtn = document.getElementById('closeMonthPicker');
    const cancelBtn = document.getElementById('cancelBtn');
    const applyBtn = document.getElementById('applyBtn');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const toggle2024 = document.getElementById('toggle2024');
    const toggle2025 = document.getElementById('toggle2025');
    const togglePercentage = document.getElementById('togglePercentage');

    toggle2024.addEventListener('click', () => {
        show2024 = !show2024;
        toggle2024.classList.toggle('inactive', !show2024);
        renderChart();
    });

    toggle2025.addEventListener('click', () => {
        show2025 = !show2025;
        toggle2025.classList.toggle('inactive', !show2025);
        renderChart();
    });

    togglePercentage.addEventListener('click', () => {
        showPercentage = !showPercentage;
        togglePercentage.classList.toggle('inactive', !showPercentage);
        renderChart();
    });

    loadDataBtn.addEventListener('click', loadRevenue);

    monthPickerBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (monthPickerCard.classList.contains('active')) {
            closePicker();
        } else {
            openPicker();
        }
    });

    closeMonthPickerBtn.addEventListener('click', (event) => {
        event.preventDefault();
        tempSelectedMonths = new Set(selectedMonths);
        updateMonthSelectionUI();
        closePicker();
    });

    cancelBtn.addEventListener('click', (event) => {
        event.preventDefault();
        tempSelectedMonths = new Set(selectedMonths);
        updateMonthSelectionUI();
        closePicker();
    });

    applyBtn.addEventListener('click', (event) => {
        event.preventDefault();
        selectedMonths = new Set(tempSelectedMonths);
        updateButtonLabel();
        closePicker();
        renderChart();
    });

    document.addEventListener('click', (event) => {
        if (!monthPickerCard.contains(event.target) && !monthPickerBtn.contains(event.target)) {
            closePicker();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePicker();
        }
    });
});