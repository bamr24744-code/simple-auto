/**
 * 📅 calendar.js - نظام التقويم الهجري والميلادي
 * يعرض: التاريخ الحالي، غرة الشهر القادم، الأيام البيض
 * ✅ يعمل على الويب وElectron بدون اعتماديات خارجية
 */

// 🎯 الدالة الرئيسية: تحديث واجهة التقويم
function renderCalendar(targetDate = new Date()) {
    try {
        // 1. تحديث التاريخ الميلادي
        updateGregorianDate(targetDate);
        
        // 2. تحديث التاريخ الهجري
        updateHijriDate(targetDate);
        
        // 3. حساب وعرض غرة الشهر القادم والأيام البيض
        calculateLunarEvents(targetDate);
        
        console.log('✅ تم تحديث التقويم:', targetDate.toLocaleDateString('ar-EG'));
        return true;
    } catch (error) {
        console.error('❌ خطأ في renderCalendar:', error);
        return false;
    }
}

// 📆 تحديث التاريخ الميلادي في الواجهة
function updateGregorianDate(date) {
    const gregElem = document.getElementById('gregorian-date-main');
    const gregControl = document.getElementById('gregorian-date-control');
    
    const formatted = date.toLocaleDateString('ar-EG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    if (gregElem) gregElem.innerText = formatted;
    if (gregControl) gregControl.innerText = formatted;
}

// 🌙 تحديث التاريخ الهجري في الواجهة
function updateHijriDate(date) {
    const hijriElem = document.getElementById('hijri-today');
    if (!hijriElem) return;
    
    const offset = window.hijriOffset || 0;
    const adjusted = new Date(date);
    adjusted.setDate(date.getDate() + offset);
    
    hijriElem.innerText = adjusted.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// 🌕 حساب وعرض الأحداث القمرية (غرة الشهر + الأيام البيض)
function calculateLunarEvents(today) {
    const offset = window.hijriOffset || 0;
    
    // دالة مساعدة: تحويل تاريخ ميلادي لهجري (أرقام فقط)
    const getHijriParts = (date) => {
        const d = new Date(date);
        d.setDate(date.getDate() + offset);
        const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
            day: 'numeric', month: 'numeric', year: 'numeric'
        }).formatToParts(d);
        const res = {};
        parts.forEach(p => res[p.type] = parseInt(p.value));
        return res;
    };
    
    const todayH = getHijriParts(today);
    let moonDays = [];      // الأيام البيض القادمة
    let nextMonthInfo = ""; // غرة الشهر القادم
    let foundNext = false;
    
    // فحص 45 يوماً قادمة (كافية لتغطية شهر هجري كامل)
    for (let i = 1; i <= 45; i++) {
        const testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        const h = getHijriParts(testDate);
        
        // 🔹 تحديد غرة الشهر الهجري القادم
        if (!foundNext && h.month !== todayH.month && h.day === 1) {
            const hName = testDate.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { month: 'long' });
            const gDate = testDate.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
            nextMonthInfo = `🌙 غرة <b>${hName}</b><br><span style="color:var(--accent-gold)">${gDate}</span>`;
            foundNext = true;
        }
        
        // 🔹 جمع الأيام البيض القادمة (13، 14، 15 هجري)
        if (moonDays.length < 3 && [13, 14, 15].includes(h.day)) {
            // تجنب أيام الشهر الحالي إذا كنا قد تجاوزنا يوم 15
            if (h.month !== todayH.month || (h.month === todayH.month && h.day > todayH.day)) {
                const gDay = testDate.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
                moonDays.push(`<b>${h.day}</b>: ${gDay}`);
            }
        }
        
        // إنهاء الحلقة مبكراً إذا اكتملت البيانات
        if (foundNext && moonDays.length >= 3) break;
    }
    
    // 🖼️ تحديث الواجهة
    const nextMonthEl = document.getElementById('next-month');
    const moonDaysEl = document.getElementById('moon-days');
    
    if (nextMonthEl) {
        nextMonthEl.innerHTML = nextMonthInfo || '<span style="color:var(--text-dim)">جاري الحساب...</span>';
    }
    if (moonDaysEl) {
        moonDaysEl.innerHTML = `<b>🌕 الأيام البيض:</b><br>${
            moonDays.length ? moonDays.join('<br>') : '<span style="color:var(--text-dim)">لا توجد أيام قريبة</span>'
        }`;
    }
}

// 🔄 دالة مساعدة: إعادة حساب التقويم عند تغيير الدولة (للمواقيت)
function refreshCalendar() {
    renderCalendar(new Date());
}

// 🎨 تهيئة التقويم عند تحميل الصفحة
function initCalendar() {
    // تعيين offset افتراضي إذا لم يكن موجوداً
    if (typeof window.hijriOffset === 'undefined') {
        window.hijriOffset = 0; // يمكن تعديله يدوياً ±1 حسب الرؤية
    }
    
    // تحديث فوري
    renderCalendar(new Date());
    
    // تحديث تلقائي كل ساعة (لضمان دقة الغرة)
    setInterval(() => {
        const now = new Date();
        if (now.getMinutes() === 0 && now.getSeconds() < 10) {
            renderCalendar(now);
        }
    }, 60000);
    
    console.log('📅 نظام التقويم جاهز');
}

// 🚀 التشغيل التلقائي عند تحميل الصفحة
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // تأخير بسيط لضمان تحميل العناصر
        setTimeout(initCalendar, 100);
    });
}

// ✅ تصدير الدوال للاستخدام الخارجي (اختياري)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        renderCalendar, 
        updateGregorianDate, 
        updateHijriDate, 
        calculateLunarEvents,
        refreshCalendar,
        initCalendar
    };
}
