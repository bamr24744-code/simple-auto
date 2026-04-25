// prayer.js - ملف مواقيت الصلاة الجديد
// لا يؤثر على بقية البرنامج

// متغيرات خاصة بالمواقيت
let prayerData = null;
let lastUpdate = null;

// تهيئة المواقيت عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // تحميل الدولة المحفوظة
    const savedCountry = localStorage.getItem('prayer-country');
    const selectBox = document.getElementById('country-select');
    
    if (savedCountry && selectBox) {
        selectBox.value = savedCountry;
    } else {
        // القيمة الافتراضية: مصر
        selectBox.value = 'Egypt';
        localStorage.setItem('prayer-country', 'Egypt');
    }
    
    // حدث تغيير الدولة
    selectBox.addEventListener('change', function() {
        localStorage.setItem('prayer-country', this.value);
        fetchPrayerTimes(this.value);
    });
    
    // تحميل البيانات المخزنة
    loadStoredPrayerData();
    
    // جلب البيانات أول مرة
    fetchPrayerTimes(selectBox.value);
});

// دالة جلب مواقيت الصلاة
async function fetchPrayerTimes(country) {
    const statusElem = document.getElementById('prayer-status');
    const offlineMsg = document.getElementById('offline-message');
    
    // إخفاء رسالة البيانات المخزنة
    offlineMsg.style.display = 'none';
    
    // التحقق من الاتصال
    if (!navigator.onLine) {
        showOfflineData();
        return;
    }
    
    // تحديث الحالة
    if (statusElem) {
        statusElem.textContent = '🔄 جاري التحميل...';
        statusElem.style.color = '#ff9800';
    }
    
    try {
        // الحصول على المدينة المناسبة للدولة
        const city = getCityForCountry(country);
        const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=5`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('فشل الاتصال بالخادم');
        }
        
        const data = await response.json();
        
        if (data.code === 200) {
            const timings = data.data.timings;
            
            // عرض المواقيت
            displayPrayerTimes(timings);
            
            // حفظ البيانات محلياً
            savePrayerData(timings, country);
            
            // تحديث الحالة
            if (statusElem) {
                statusElem.textContent = '✅ تم التحديث';
                statusElem.style.color = '#4CAF50';
            }
        }
    } catch (error) {
        console.error('خطأ في جلب مواقيت الصلاة:', error);
        
        // استخدام البيانات المخزنة
        showOfflineData();
        
        if (statusElem) {
            statusElem.textContent = '⚠️ استخدام البيانات المخزنة';
            statusElem.style.color = '#ff9800';
        }
    }
}

// دالة الحصول على المدينة المناسبة
function getCityForCountry(country) {
    const cities = {
        'Egypt': 'Cairo',
        'Palestine': 'Gaza',
        'Saudi Arabia': 'Makkah',
        'Jordan': 'Amman',
        'UAE': 'Dubai',
        'Kuwait': 'Kuwait City',
        'Qatar': 'Doha',
        'Bahrain': 'Manama',
        'Oman': 'Muscat',
        'Lebanon': 'Beirut',
        'Iraq': 'Baghdad',
        'Algeria': 'Algiers',
        'Morocco': 'Casablanca',
        'Tunisia': 'Tunis',
        'Sudan': 'Khartoum'
    };
    return cities[country] || 'Cairo';
}
// دالة عرض مواقيت الصلاة
function displayPrayerTimes(timings) {
    if (!timings) return;
    
    const prayers = {
        'Fajr': 'fajr',
        'Dhuhr': 'dhuhr',
        'Asr': 'asr',
        'Maghrib': 'maghrib',
        'Isha': 'isha'
    };
    
    for (const [key, elementId] of Object.entries(prayers)) {
        const element = document.getElementById(elementId);
        if (element && timings[key]) {
            element.textContent = formatPrayerTime(timings[key]);
        }
    }
}

// تنسيق وقت الصلاة
function formatPrayerTime(timeString) {
    if (!timeString) return '--:--';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    
    // تحويل إلى 12 ساعة
    if (hour >= 12) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} م`;
    } else {
        return `${hour === 0 ? 12 : hour}:${minutes} ص`;
    }
}

// حفظ البيانات محلياً
function savePrayerData(timings, country) {
    const prayerData = {
        timings: timings,
        country: country,
        lastUpdate: new Date().toISOString()
    };
    
    localStorage.setItem('prayer-data', JSON.stringify(prayerData));
    localStorage.setItem('prayer-country', country);
}

// تحميل البيانات المخزنة
function loadStoredPrayerData() {
    const savedData = localStorage.getItem('prayer-data');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            displayPrayerTimes(data.timings);
        } catch (error) {
            console.error('خطأ في تحميل البيانات المخزنة:', error);
        }
    }
}

// عرض البيانات المخزنة عند انقطاع الإنترنت
function showOfflineData() {
    const savedData = localStorage.getItem('prayer-data');
    const offlineMsg = document.getElementById('offline-message');
    const daysElem = document.getElementById('days-stored');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            displayPrayerTimes(data.timings);
            
            // حساب عدد الأيام منذ التحديث
            if (data.lastUpdate && offlineMsg && daysElem) {
                const lastUpdateDate = new Date(data.lastUpdate);
                const now = new Date();
                const diffTime = Math.abs(now - lastUpdateDate);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > 0) {
                    daysElem.textContent = diffDays;
                    offlineMsg.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('خطأ في عرض البيانات المخزنة:', error);
        }
    

        if (frameId === 'prayer-frame') {
            const selectBox = document.getElementById('country-select');
            if (selectBox) {
                fetchPrayerTimes(selectBox.value);
            }
        }
    }
}
