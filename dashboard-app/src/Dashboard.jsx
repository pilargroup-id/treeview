import * as React from 'react';
import Box from '@mui/material/Box';
import { useNavigate } from 'react-router-dom';
import { getFirstAllowePath, getStoredUserData, getStoredMonitoringData, hasStoredToken, isUserDataValid } from '../utils/storageUtils';
import { SignalCellularNullOutlined } from '@mui/icons-material';
import ChartBU from '../chart/ChartBU';
import { API_URL } from '/config/api';

const FINANCIAL_API_BASE_URL = `${String(API_URL ?? '').replace(/\/+$/, '')}/financial`;
const MONTHLY_REVENUE_URL = `${FINANCIAL_API_BASE_URL}/monthly-revenue`;
const INVOICE_SALES_URL = `${FINANCIAL_API_BASE_URL}/invoice-sales`;
const BUSINESS_UNITS_URL = `${FINANCIAL_API_BASE_URL}/business-units`;

export default function Dashboard() {
    
}

import {
    getFirstAllowePath,
    getStorageItem,
    getStoredMonitoringData,
    getStoredUserData,
    hasStoredToken,
    isUserDataValid
} from '../utils/storageUtils';
import { useNavigate } from 'react-router-dom';
import { SignalCellularNullOutlined } from '@mui/icons-material';

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

}