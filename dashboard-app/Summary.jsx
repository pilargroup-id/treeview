import * as React from 'react';
import DashboardLayout from './dashboardLayout/DashboardLayout';
import ChartBusinessUnit from './chart/ChartBusinessUnit/ChartBusinessUnit';
import BackgroundMobile from './mobile/BackgroundMobile';
import MobileYearsCardBU from './mobile/mobileComponents/revenue/revenueBU/MobileYearsCardBU';

<BackgroundMobile />
export default function Summary() {
    const [isMobile, setMobile] = React.useState(false);
    const [isTablet, setTablet] = React.useState(false);

    React.useEffect((SetMobile, SetTablet) => {
        const handleResize = () => {
            setMobile(window.innerWidth < 768);
            setTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    

}return () => {
    console.log('Summary component unmounted');
    if (isMobile) {
        return <MobileYearsCardBU />;
    } else if (isTablet) {
        return <BackgroundMobile />;
    }
}

function renderContent() {
    const MobileCard = new MobileYearsCardBU();
    if (isMobile) {
        return <MobileYearsCardBU />;
    } else if (isTablet) {
        return <BackgroundMobile />;
    } else {
        return <DashboardLayout><ChartBusinessUnit /></DashboardLayout>;
    }
}