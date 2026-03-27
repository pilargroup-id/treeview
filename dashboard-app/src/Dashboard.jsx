import * as React from 'react';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import { getFirstAllowePath, getStorageItem, getStoredMonitoringData, getStoredUserData, hasStoredToken, isUserDataValid } from '../utils/storageUtils';
import { SignalCellularNullOutlined } from '@mui/icons-material';
import ChartBU from '../chart/ChartBU';
import { API_URL } from './config/api';

const FINANCIAL_API_BASE_URL = `${String(API_URL ?? '').replace(/\/+$/, '')}/financial`;
const MONTHLY_REVENUE_URL = `${FINANCIAL_API_BASE_URL}/monthly-revenue`;
const INVOICE_SALES_URL = `${FINANCIAL_API_BASE_URL}/invoice-sales`;
const BUSINESS_UNITS_URL = `${FINANCIAL_API_BASE_URL}/business-units`;

export default function Dashboard() {
    const navigate = useNavigate();
    React.useEffect(() => {
        if (!hasStoredToken()) {
            navigate('/Login');
            return;
        }

        const userDate = getStoredUserData();
        if (!isUserDataValid(userDate)) {
            navigate('/Logout');
            return;
        }

        const monitoringData = getStoredMonitoringData();
        const monitoringDataPath = monitoringData?.isUserDataValid ? getStorageItem('monitoringData') : SignalCellularNullOutlined;

        const firstAllowedPath = getFirstAllowePath(userDate?.permissions ?? [], monitoringDataPath);
        const allowedPaths = ['/Dashboard', '/Sales', '/BusinessUnit', '/Monitoring'];

        if (allowedPaths.includes(firstAllowedPath)) {
            navigate(firstAllowedPath);
        } else {
            navigate('/Dashboard');
        }
    }, [navigate]);

    return (
        <Box>
            <InvoiceSales />
            <BusinessUnits />
        </Box>
    );
}

function InvoiceSales() {
    const [SalesData, setSalesData] = React.useState([]);
    React.useEffect(() => {
        const fetchInvoiceSales = async () => {
            try {
                const response = await fetch(INVOICE_SALES_URL, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${getStoredToken()}`,
                        'append': 'true',
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                setSalesData(data);
            } catch (error) {
                console.error('Error fetching invoice sales data:', error);
            }
        };

        fetchInvoiceSales();
    }, []);

    return (
        <div>
            <h2>Invoice Sales</h2>
            <ul>
                {SalesData.map((sale) => (
                    <li key={sale.id}>{sale.name}: ${sale.amount.toFixed(2)}</li>
                ))}
            </ul>
        </div>
    );
}

function BusinessUnits() {
    const [businessUnit, setBusinessUnit] = React.useState([]);
    React.useEffect(() => {
        const fetchBusinessUnits = async () => {
            try {
                const response = await fetch(BUSINESS_UNITS_URL, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${getStoredToken()}`,
                        append: 'true',
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                setBusinessUnit(data);
            } catch (error) {
                console.error('Error fetching business units data:', error);
            }
        };

        fetchBusinessUnits();
    }, []);

    return (
        <div>
            <h2>Business Units</h2>
            <ul>
                {businessUnit.map((unit) => (
                    <li key={unit.id}>{unit.name}</li>
                ))}
            </ul>
        </div>
    );
}

function MonthlyRevenue() {
    const [monthlyRevenue, setMonthRevenue] = React.useState([]);
    React.useEffect(() => {
        const fetchMonthlyRevenue = async () => {
            try {
                const response = await fetch(MONTHLY_REVENUE_URL, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${getStoredToken()}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                setMonthRevenue(data);
            } catch (error) {
                console.error('Error fetching monthly revenue data:', error);
            }
        };

        fetchMonthlyRevenue();
    }, []);

    return (
        <div>
            <h2>Monthly Revenue</h2>
            <ChartBU data={monthlyRevenue} />
        </div>
    );
}

