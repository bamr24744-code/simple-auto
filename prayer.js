/**
 * 🕌 prayer.js - جلب وعرض مواقيت الصلاة من Aladhan API
 * ✅ يعمل على الويب وElectron بدون اعتماديات خارجية
 */

async function fetchPrayerTimes(country = 'Egypt') {
    const statusEl = document.getElementById('prayer-status');
    if (statusEl) {
        statusEl.innerText = '⏳ جاري الجلب...';
        statusEl.style.color = 'var(--text-dim)';
    }

    try {
        // اختيار المدينة تلقائياً حسب الدولة
        const cityMap = {
            'Egypt': 'Cairo', 'Saudi Arabia': 'Makkah', 'UAE': 'Dubai',
            'Palestine': 'Jerusalem', 'Jordan': 'Amman', 'Kuwait': 'Kuwait City',
            'Qatar': 'Doha', 'Bahrain': 'Manama', 'Oman': 'Muscat',
            'Lebanon': 'Beirut', 'Iraq': 'Baghdad', 'Algeria': 'Algiers',
            'Morocco': 'Rabat', 'Tunisia': 'Tunis', 'Sudan': 'Khartoum'
        };
        const city = cityMap[country] || country;

        const url = `https://api.aladhan.com/v1/timingsByCity?country=${encodeURIComponent(country)}&city=${encodeURIComponent(city)}&method=4`;
        
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`فشل الاتصال: ${res.status}`);
        
        const data = await res.json();
        if (data.code !== 200 || !data.data?.timings) throw new Error('بيانات غير صالحة من الخادم');

        const timings = data.data.timings;
        const elements = {
            fajr: timings.Fajr,
            dhuhr: timings.Dhuhr,
            asr: timings.Asr,
            maghrib: timings.Maghrib,
            isha: timings.Isha
        };

        // تحديث الواجهة بأمان
        for (const [id, time] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.innerText = time;
        }

        if (statusEl) {
            statusEl.innerText = `✅ تم التحديث (${new Date().toLocaleTimeString('ar-EG')})`;
            statusEl.style.color = 'var(--accent-green)';
        }
        localStorage.setItem('lastPrayerCountry', country);

    } catch (error) {
        console.error('❌ خطأ في جلب المواقيت:', error);
        if (statusEl) {
            statusEl.innerHTML = `⚠️ ${error.message}<br><small>تحقق من الاتصال وأعد المحاولة</small>`;
            statusEl.style.color = 'var(--text-error)';
        }
    }
}

// 🚀 تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const lastCountry = localStorage.getItem('lastPrayerCountry') || 'Egypt';
    const select = document.getElementById('country-select');
    if (select) select.value = lastCountry;
    
    // استدعاء فوري
    fetchPrayerTimes(lastCountry);
});

// 🔓 جعل الدالة متاحة عالمياً (لربطها بـ onchange في HTML)
window.fetchPrayerTimes = fetchPrayerTimes;

