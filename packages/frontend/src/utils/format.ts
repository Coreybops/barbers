export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDistance = (distanceInMiles: number): string => {
  if (distanceInMiles < 0.1) {
    return 'Very close';
  } else if (distanceInMiles < 1) {
    return `${(distanceInMiles * 5280).toFixed(0)} ft`;
  } else {
    return `${distanceInMiles.toFixed(1)} mi`;
  }
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${remainingMinutes} min`;
    }
  }
};

export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
};

export const formatTime = (time: string | Date, format12Hour: boolean = true): string => {
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  return timeObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format12Hour,
  });
};

export const formatDateTime = (dateTime: string | Date): string => {
  const dateTimeObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return `${formatDate(dateTimeObj, { month: 'short', day: 'numeric' })} at ${formatTime(dateTimeObj)}`;
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatRating = (rating: number, showDecimals: boolean = true): string => {
  return showDecimals ? rating.toFixed(1) : Math.round(rating).toString();
};

export const getRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMinutes = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 0) {
    const pastMinutes = Math.abs(diffInMinutes);
    if (pastMinutes < 60) return `${pastMinutes} minutes ago`;
    if (pastMinutes < 1440) return `${Math.floor(pastMinutes / 60)} hours ago`;
    return `${Math.floor(pastMinutes / 1440)} days ago`;
  }
  
  if (diffInMinutes === 0) return 'Now';
  if (diffInMinutes < 60) return `In ${diffInMinutes} minutes`;
  if (diffInMinutes < 1440) return `In ${Math.floor(diffInMinutes / 60)} hours`;
  if (diffInMinutes < 10080) return `In ${Math.floor(diffInMinutes / 1440)} days`;
  
  return formatDate(targetDate);
};

export const getDayName = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { weekday: 'long' });
};

export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
};

export const isTomorrow = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateObj.toDateString() === tomorrow.toDateString();
};

export const formatDateRelative = (date: string | Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' });
};