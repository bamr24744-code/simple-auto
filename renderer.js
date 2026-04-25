// ============================================
// 📄 renderer.js - النسخة النهائية المُصححة
// ✅ مع تنبيه صوتي قبل 5 دقائق من انتهاء المؤقت
// ============================================


/**
 * 🔁 تشغيل صوت بيب 3 مرات متتالية (بفاصل 300مللي ثانية)
 */
function playTripleBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        
        let beepCount = 0;
        const totalBeeps = 3;
        const beepDuration = 2.0; // مدة كل بيب: 200 مللي ثانية
        const interval = 1.5;     // فاصل بين البيبات: 300 مللي ثانية
        
        function playSingleBeep() {
            if (beepCount >= totalBeeps) {
                ctx.close();
                return;
            }
            
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + beepDuration);
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.start();
            oscillator.stop(ctx.currentTime + beepDuration);
            
            beepCount++;
            
            // جدولة البيب التالي
            if (beepCount < totalBeeps) {
                setTimeout(playSingleBeep, interval * 1000);
            } else {
                // إغلاق السياق بعد آخر بيب
                setTimeout(() => ctx.close(), 500);
            }
        }
        
        // بدء السلسلة
        playSingleBeep();
        console.log('🔊 تم بدء سلسلة 3 بيبات');
        
    } catch (e) {
        console.warn('⚠️ فشل تشغيل البيبات:', e);
    }
}

// 🎵 دالة توليد صوت بيب بسيط (بدون ملفات خارجية)
function playWarningBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            ctx.close();
        }, 1000);
        
        console.log('🔊 تم تشغيل تنبيه الـ 5 دقائق');
    } catch (e) {
        console.warn('⚠️ فشل تشغيل الصوت:', e);
    }
}

// 🚩 متغيرات عامة
let targetTime = null;
let countdownInterval = null;
let is5MinWarningPlayed = false; // ✅ علم تنبيه الـ 5 دقائق
window.firstRunDone = false;

// ✅ دالة التحديث الشاملة
function globalUpdate() {
    try {
        const now = new Date();
        
        // 🕐 تحديث الساعة
        const clockDisplay = document.getElementById('main-view');
        if (clockDisplay) {
            clockDisplay.innerText = now.toLocaleTimeString('ar-EG');
            clockDisplay.classList.add('clock-style');
            clockDisplay.classList.remove('timer-countdown', 'error-state');
        }
    
        // ⏱️ إدارة المؤقت المحلي
        manageLocalTimer(now);
            // إشعار مرئي + نظام (يبقى كما هو)
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ تنبيه الوقت', { 
                    body: 'تبقى 5 دقائق فقط على انتهاء المؤقت!',
                    icon: 'image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚠️</text></svg>'
                });
            }
        
        // 📅 تحديث التقويم (مرة في الدقيقة)
       
        if (now.getSeconds() === 0 || !window.firstRunDone) {
            updateCalendarData(now);
            window.firstRunDone = true; 
        }
    } catch (error) {
        console.error('❌ خطأ في globalUpdate:', error);
    }

}

    /**
     * ⏱️ إدارة المؤقت المحلي - نسخة نهائية مُصححة
     * 🔔 تنبيه صوتي (3 بيبات) عند بقاء 5 دقائق
     */
    function manageLocalTimer(now) {
        const timerDisplay = document.getElementById('shutdown-timer-view');
        const setupBox = document.getElementById('timer-setup-box');
        const negativeTimer = document.getElementById('negative-timer');

        // ❌ لا يوجد مؤقت نشط: اخفِ العناصر وأعِد الضبط
        if (!targetTime) {
            if (timerDisplay) timerDisplay.style.display = 'none';
            if (negativeTimer) negativeTimer.style.display = 'none';
            if (setupBox) setupBox.style.display = 'block';
            is5MinWarningPlayed = false;
            return;
        }

        // ✅ حساب الوقت المتبقي
        const diff = targetTime - now;

        // 🟢 المؤقت لا يزال يعمل
        if (diff > 0) {
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);

            // تحديث العرض
            if (timerDisplay) {
                timerDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
                timerDisplay.style.display = 'block';
            }
            if (negativeTimer) negativeTimer.style.display = 'none';
            if (setupBox) setupBox.style.display = 'none';

            // 🔔 تنبيه الـ 5 دقائق (300,000 مللي ثانية)
            // الشرط: بين 10:00 و 9:55 + لم يُشغّل من قبل
            if (diff <= 600000 && diff > 595000 && !is5MinWarningPlayed) {
                playTripleBeep();              // ✅ تشغيل 3 بيبات
                is5MinWarningPlayed = true;    // منع التكرار

                // تحديث نص الحالة
                const status = document.getElementById('status');
                if (status) {
                    status.innerText = "⚠️ تنبيه: تبقى 5 دقائق!";
                    status.style.color = "var(--accent-warning, #ff9800)";
                }

                // إشعار نظام إن أمكن
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('⏰ تنبيه الوقت', { 
                        body: 'تبقى 5 دقائق فقط!',
                        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚠️</text></svg>'
                    });
                }
                console.log('🔔 تم تشغيل تنبيه الـ 5 دقائق');
            }
        }

        // 🔴 انتهى المؤقت
        else {
            targetTime = null;
            is5MinWarningPlayed = false;  // إعادة الضبط

            // عرض العداد السلبي
            if (negativeTimer) {
                const elapsed = Math.abs(diff);
                const mins = Math.floor(elapsed / 60000);
                const secs = Math.floor((elapsed % 60000) / 1000);
                negativeTimer.innerText = `+${mins}:${secs.toString().padStart(2, '0')}`;
                negativeTimer.style.display = 'block';
            }
            if (timerDisplay) {
                timerDisplay.innerText = "⏰ انتهى!";
                timerDisplay.style.display = 'block';
            }

            // العودة لوضع الإعداد بعد 5 ثوانٍ
            setTimeout(() => {
                if (timerDisplay) timerDisplay.style.display = 'none';
                if (negativeTimer) negativeTimer.style.display = 'none';
                if (setupBox) setupBox.style.display = 'block';
            }, 5000);
        }
    }



// =============================
// 📅 تحديث بيانات التقويم
function updateCalendarData(today) {
    const updateGregorian = (dateString) => {
        ['gregorian-date-main', 'gregorian-date-control', 'gregorian-date'].forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.hasAttribute('aria-hidden')) {
                el.innerText = dateString;
            }
        });
    };
    
    const gregorianDate = today.toLocaleDateString('ar-EG', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    updateGregorian(gregorianDate);

    const hijriElem = document.getElementById('hijri-today');
    if (hijriElem) {
        const hijriOffset = window.hijriOffset || 0;
        const adjustedDate = new Date(today);
        adjustedDate.setDate(today.getDate() + hijriOffset);
        hijriElem.innerText = adjustedDate.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }
    calculateMoonPhases(today);
}

// 🌙 حساب الأيام القمرية
function calculateMoonPhases(today) {
    const hijriOffset = window.hijriOffset || 0;
    
    const getHijri = (date) => {
        const d = new Date(date);
        d.setDate(d.getDate() + hijriOffset);
        const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
            day: 'numeric', month: 'numeric', year: 'numeric'
        }).formatToParts(d);
        const res = {};
        parts.forEach(p => res[p.type] = parseInt(p.value));
        return res;
    };

    const todayH = getHijri(today);
    let moonDays = [];
    let nextMonthInfo = "";
    let foundNext = false;

    for (let i = 1; i <= 45; i++) {
        let testDate = new Date(today);
        testDate.setDate(today.getDate() + i);
        let h = getHijri(testDate);

        if (!foundNext && h.month !== todayH.month && h.day === 1) {
            const hName = testDate.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { month: 'long' });
            // يظهر: 🌙 غرة رمضان: الاثنين 1 مارس
            nextMonthInfo = `🌙 غرة <b>${hName}</b><br><span style="color:var(--accent-gold)">${testDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' })}</span>`;
            
        }

        if (moonDays.length < 3 && [13, 14, 15].includes(h.day)) {
            if (h.month !== todayH.month || (h.month === todayH.month && h.day > todayH.day)) {
                moonDays.push(`<b>${h.day}</b>: ${testDate.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}`);
            }
        }
        if (foundNext && moonDays.length >= 3) break;
    }

    const nextMonthEl = document.getElementById('next-month');
    const moonDaysEl = document.getElementById('moon-days');
    
    if (nextMonthEl) nextMonthEl.innerHTML = nextMonthInfo || "جاري الحساب...";
    if (moonDaysEl) {
        moonDaysEl.innerHTML = "<b>🌕 الأيام البيض:</b><br>" + 
            (moonDays.length ? moonDays.join("<br>") : "لا توجد أيام قريبة");
    }
}

// 🎮 إدارة الأزرار والتحكم
function systemAction(action, data = {}) {
    const input = document.getElementById('timer-input');
    const mins = parseInt(input?.value) || 75;
    
    switch(action) {
        case 'shutdown':
            targetTime = new Date(new Date().getTime() + mins * 60000);
            is5MinWarningPlayed = false; // إعادة ضبط العلم عند بدء جديد
            
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
            localStorage.setItem('targetTime', targetTime.getTime());
            console.log(`⏱️ بدأ مؤقت: ${mins} دقيقة`);
            break;
            
        case 'cancel':
            targetTime = null;
            is5MinWarningPlayed = false; // ✅ إعادة الضبط عند الإلغاء
            localStorage.removeItem('targetTime');
            console.log('❌ تم إلغاء المؤقت');
            break;
            
        case 'toggle-theme':
            if (typeof window.toggleTheme === 'function') {
                window.toggleTheme();
            } else {
                const html = document.documentElement;
                const body = document.body;
                const isDark = html.getAttribute('data-theme') !== 'light';
                const newTheme = isDark ? 'light' : 'dark';
                
                html.setAttribute('data-theme', newTheme);
                body.classList.toggle('light-mode', newTheme === 'light');
                body.classList.toggle('dark-mode', newTheme === 'dark');
                localStorage.setItem('theme', newTheme);
                
                const btn = document.getElementById('theme-toggle');
                if (btn) btn.innerText = newTheme === 'dark' ? '☀️ وضع نهاري' : '🌙 وضع ليلي';
            }
            break;
            
        case 'monitor-off':
        case 'power-off':
            const msg = '⚠️ غير متاح في الويب لأسباب أمنية.\nاستخدم المؤقت المحلي بدلاً من ذلك.';
            if (typeof alert !== 'undefined') alert(msg);
            console.warn(`⚠️ "${action}" غير مدعوم في المتصفح`);
            break;
            
        default:
            console.log(`🎯 إجراء: ${action}`, data);
    }
}

// ➕➖ تعديل قيمة المؤقت
function changeTimer(val) {
    const input = document.getElementById('timer-input');
    if (!input) return;
    
    let current = parseInt(input.value) || 75;
    let newValue = Math.max(5, Math.min(480, current + val));
    input.value = newValue;
    
    if (targetTime) {
        targetTime = new Date(targetTime.getTime() + val * 60000);
        localStorage.setItem('targetTime', targetTime.getTime());
    }
}

// 🖼️ التبديل بين الفريمات
function showFrame(frameId) {
    document.querySelectorAll('.frame').forEach(f => {
        f.style.display = 'none'; 
        f.classList.remove('active');
    });

    const target = document.getElementById(frameId);
    if (target) {
        target.style.display = 'flex';
        setTimeout(() => target.classList.add('active'), 10);
        
        const titles = {
            'radio-frame': '📻 راديو ',
            'date-frame': '📅 التقويم الهجري',
            'prayer-frame': '🕌 مواقيت الصلاة',
            'power-frame': '⚙️ لوحة التحكم'
        };
        document.title = titles[frameId] || 'Simpel';
        
        document.querySelectorAll('.nav-bar button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick')?.includes(frameId)) {
                btn.classList.add('active');
            }
        });
    }
}

// 🔁 استرجاع المؤقت المحفوظ
function restoreSavedTimer() {
    const saved = localStorage.getItem('targetTime');
    if (saved) {
        const savedTime = parseInt(saved);
        if (savedTime > Date.now()) {
            targetTime = new Date(savedTime);
            is5MinWarningPlayed = false;
            console.log('🔄 المؤقت المحفوظ: ' + targetTime.toLocaleTimeString('ar-EG'));
        } else {
            localStorage.removeItem('targetTime');
        }
    }
}

// 🎨 تهيئة السمة
function initTheme() {
    const html = document.documentElement;
    const saved = localStorage.getItem('theme') || 'dark';
    
    html.setAttribute('data-theme', saved);
    document.body.classList.add(saved === 'dark' ? 'dark-mode' : 'light-mode');
    
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerText = saved === 'dark' ? '☀️ وضع نهاري' : '🌙 وضع ليلي';
}

// 🚀 التهيئة الأولية
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    restoreSavedTimer();
    globalUpdate();
    
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            systemAction(e.currentTarget.dataset.action);
        });
    });
    
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        systemAction('toggle-theme');
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') systemAction('cancel');
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            systemAction('toggle-theme');
        }
        if (document.getElementById('power-frame')?.classList.contains('active')) {
            if (e.key === 'ArrowUp') { e.preventDefault(); changeTimer(5); }
            if (e.key === 'ArrowDown') { e.preventDefault(); changeTimer(-5); }
        }
    });
    
    document.getElementById('country-select')?.addEventListener('change', (e) => {
        if (typeof fetchPrayerTimes === 'function') {
            fetchPrayerTimes(e.target.value);
        }
    });
    
    console.log('✅ renderer.js جاهز - مع تنبيه الـ 5 دقائق');
});

// التحديث الدوري
setInterval(globalUpdate, 1000);

// ✅ تصدير للدوال
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        globalUpdate, 
        systemAction, 
        changeTimer, 
        showFrame,
        updateCalendarData,
        manageLocalTimer,
        playWarningBeep
    };
}
