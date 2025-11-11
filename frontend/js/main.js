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