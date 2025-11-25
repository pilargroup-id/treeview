// Constants 
export const TWIN_DATE_PRESETS = [
  { monthDay: '01-01', label: '1 Januari' },
  { monthDay: '02-02', label: '2 Februari' },
  { monthDay: '03-03', label: '3 Maret' },
  { monthDay: '04-04', label: '4 April' },
  { monthDay: '05-05', label: '5 Mei' },
  { monthDay: '06-06', label: '6 Juni' },
  { monthDay: '07-07', label: '7 Juli' },
  { monthDay: '08-08', label: '8 Agustus' },
  { monthDay: '09-09', label: '9 September' },
  { monthDay: '10-10', label: '10 Oktober' },
  { monthDay: '11-11', label: '11 November' },
  { monthDay: '12-12', label: '12 Desember' },
];

export const MONTH_OPTIONS = [
  { value: 1, label: 'Januari', monthDay: '01-01' },
  { value: 2, label: 'Februari', monthDay: '02-02' },
  { value: 3, label: 'Maret', monthDay: '03-03' },
  { value: 4, label: 'April', monthDay: '04-04' },
  { value: 5, label: 'Mei', monthDay: '05-05' },
  { value: 6, label: 'Juni', monthDay: '06-06' },
  { value: 7, label: 'Juli', monthDay: '07-07' },
  { value: 8, label: 'Agustus', monthDay: '08-08' },
  { value: 9, label: 'September', monthDay: '09-09' },
  { value: 10, label: 'Oktober', monthDay: '10-10' },
  { value: 11, label: 'November', monthDay: '11-11' },
  { value: 12, label: 'Desember', monthDay: '12-12' },
];

export const formatDateDisplay = (dateObj) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  if (typeof dateObj === 'string') {
    const [month, day] = dateObj.split('-');
    return `${parseInt(day)} ${monthNames[parseInt(month) - 1]}`;
  }
  // Jika object, ambil monthDay dan year
  const { monthDay, year } = dateObj;
  if (!monthDay || !year) return '';
  const [month, day] = monthDay.split('-');
  return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
};

export const getIsSameDate = (date, year, monthDay) => {
  if (typeof date === 'string') {
    return date === monthDay;
  }
  return date.year === year && date.monthDay === monthDay;
};

