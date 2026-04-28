document.addEventListener('DOMContentLoaded', () => {
    // ✅ كشف بيئة التشغيل بدقة
    const isElectron = typeof window.electronAPI !== 'undefined';

    // 🚫 تعطيل أزرار النظام في الويب فقط
    const monitorBtn = document.getElementById('btn-monitor-off');
    const cancelBtn = document.getElementById('btn-cancel-timer'); // زر إلغاء الإغلاق المجدول

    if (!isElectron) {
        if (monitorBtn) {
            monitorBtn.disabled = true;
            monitorBtn.title = 'غير متاح في الويب';
            monitorBtn.style.opacity = '0.5';
            monitorBtn.style.cursor = 'not-allowed';
        }
        // ملاحظة: زر Cancel يظل مفعلاً في الويب لإلغاء المؤقت المحلي فقط
        // لكن نمنع منه إرسال أمر إلغاء جدولة النظام عبر IPC (تمت معالجة ذلك في systemAction)
    }

    // ... بقية كود التهيئة الأصلي ...
});


// ============================================
// 📄 renderer.js - نسخة سطح المكتب المُحسّنة
// ✅ عزل الفريمات + تهيئة شرطية + تحسين الأبعاد
// ============================================

// 🚩 متغيرات عامة (مُعرّفة مرة واحدة)
let targetTime = null;
let isTimerRunning = false;
let is5MinWarningPlayed = false;
window.firstRunDone = false;

// 🎯 تتبع الفريم النشط حاليًا
let activeFrameId = 'power-frame'; // الافتراضي

// 🔊 دالة تشغيل 3 بيبات (محسّنة)
function playTripleBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        
        let beepCount = 0;
        const totalBeeps = 5 , beepDuration = 2.0, interval = 1.5;
        
        function playSingleBeep() {
            if (beepCount >= totalBeeps) { ctx.close(); return; }
            const osc = ctx.createOscillator(), gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + beepDuration);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + beepDuration);
            beepCount++;
            if (beepCount < totalBeeps) setTimeout(playSingleBeep, interval * 1000);
            else setTimeout(() => ctx.close(), 500);
        }
        playSingleBeep();
    } catch (e) { console.warn('⚠️ فشل الصوت:', e); }
}

// 📝 تحديث نص الحالة (آمن)
function updateStatus(msg) {
    const el = document.getElementById('status');
    if (el) {
        el.innerText = msg;
        el.style.color = msg.includes('⚠️') ? 'var(--text-error, #ff6b6b)' : 'var(--text-dim, #adb5bd)';
    }
}

// 🔄 تحديث حالة الأزرار (مع فحص الوجود)
function updateButtonStates(running) {
    const ids = ['btn-timer-up', 'btn-timer-down', 'btn-start-timer', 'btn-cancel-timer'];
    ids.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            if (id === 'btn-cancel-timer') btn.disabled = !running;
            else btn.disabled = running;
        }
    });
}

// ⏱️ إدارة المؤقت المحلي (مع عزل التنبيه)
function manageLocalTimer(now) {
    // ✅ لا تُنفّذ إلا إذا كان فريم التحكم نشطاً
    if (activeFrameId !== 'power-frame') return;
    
    const timerDisplay = document.getElementById('shutdown-timer-view');
    const setupBox = document.getElementById('timer-setup-box');
    const negativeTimer = document.getElementById('negative-timer');
    
    if (!targetTime) {
        if (timerDisplay) timerDisplay.style.display = 'none';
        if (negativeTimer) negativeTimer.style.display = 'none';
        if (setupBox) setupBox.style.display = 'block';
        is5MinWarningPlayed = false;
        return;
    }
    
    const diff = targetTime - now;
    
    if (diff > 0) {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        
        if (timerDisplay) {
            timerDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
            timerDisplay.style.display = 'block';
        }
        if (negativeTimer) negativeTimer.style.display = 'none';
        if (setupBox) setupBox.style.display = 'none';
        
        // 🔔 تنبيه الـ 10 دقائق (مفتاح ثابت)
        const warnKey = 'warned_target_' + Math.floor(targetTime.getTime() / 60000);
        if (diff <= 600000 && diff > 595000 && localStorage.getItem(warnKey) !== 'true') {
            playTripleBeep();
            localStorage.setItem(warnKey, 'true');
            is5MinWarningPlayed = true;
            updateStatus("⚠️ تنبيه: تبقى 10 دقائق!");
            
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('⏰ تنبيه الوقت', { 
                    body: 'تبقى 10 دقائق فقط!',
                    icon: 'image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚠️</text></svg>'
                });
            }
        }
    } else {
        targetTime = null;
        isTimerRunning = false;
        is5MinWarningPlayed = false;
        updateButtonStates(false);
        
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('warned_target_')) localStorage.removeItem(k);
        });
        
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
        
        setTimeout(() => {
            if (timerDisplay) timerDisplay.style.display = 'none';
            if (negativeTimer) negativeTimer.style.display = 'none';
            if (setupBox) setupBox.style.display = 'block';
        }, 5000);
    }
}

// ✅ دالة التحديث الشاملة (شرطية حسب الفريم النشط)
function globalUpdate() {
    try {
        const now = new Date();
        
        // 🕐 تحديث الساعة (دائمًا)
        const clock = document.getElementById('main-view');
        if (clock) {
            clock.innerText = now.toLocaleTimeString('ar-EG');
            clock.classList.add('clock-style');
        }
        
        // ⏱️ إدارة المؤقت (فقط في فريم التحكم)
        if (activeFrameId === 'power-frame') {
            manageLocalTimer(now);
        }
        
        // 📅 تحديث التقويم (فقط في فريم التقويم + مرة في الدقيقة)
        if (activeFrameId === 'date-frame' && (now.getSeconds() === 0 || !window.firstRunDone)) {
            if (typeof updateCalendarData === 'function') updateCalendarData(now);
            window.firstRunDone = true;
        }
        
        // 📻 تحديث حالة الراديو (فقط في فريم الراديو)
        if (activeFrameId === 'radio-frame' && typeof updateRadioStatus === 'function') {
            updateRadioStatus();
        }
        
    } catch (e) {
        console.error('❌ خطأ في globalUpdate:', e);
    }
}

// ➕➖ تعديل قيمة المؤقت (آمن)
function changeTimer(val) {
    if (isTimerRunning) return;
    const input = document.getElementById('timer-input');
    if (!input) return;
    let current = parseInt(input.value) || 75;
    let newValue = Math.max(5, Math.min(480, current + val));
    input.value = newValue;
}

// 🎮 إدارة أوامر الأزرار (هجين: ويب + Electron)
function systemAction(action) {
    const input = document.getElementById('timer-input');
    const mins = parseInt(input?.value) || 75;
    const isElectron = typeof window.electronAPI !== 'undefined';
    
    switch(action) {
        case 'shutdown':
            if (isTimerRunning) return;
            if (isElectron) {
                window.electronAPI.send('system-command', { action: 'shutdown', minutes: mins });
            }
            targetTime = new Date(Date.now() + mins * 60000);
            isTimerRunning = true;
            updateButtonStates(true);
            updateStatus(`⏱️ جاري العد: ${mins} دقيقة`);
            break;
            
        case 'cancel':
            if (!isTimerRunning) return;
            if (isElectron) {
                window.electronAPI.send('system-command', { action: 'cancel' });
            }
            targetTime = null;
            isTimerRunning = false;
            updateButtonStates(false);
            updateStatus(isElectron ? '❌ تم إلغاء الإغلاق المجدول' : '❌ تم إلغاء المؤقت المحلي');
            break;
            
        case 'monitor-off':
            if (isElectron) {
                window.electronAPI.send('system-command', { action: 'monitor-off' });
                updateStatus('🌙 الشاشة مُطفأة');
           
              } else {
            // ✅ في الويب: رسالة توضيحية فقط
            updateStatus('⚠️ إطفاء الشاشة غير مدعوم في المتصفح');
            // يمكنك إزالة الـ alert المزعج إذا أردت
            }
            break; 

        case 'toggle-theme': {
            const html = document.documentElement;
            const body = document.body;
            const btn = document.getElementById('theme-toggle');
            
            // قراءة الحالة الحالية
            const current = html.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            
            // تطبيق فوري
            html.setAttribute('data-theme', next);
            body.classList.remove('dark-mode', 'light-mode');
            body.classList.add(next === 'dark' ? 'dark-mode' : 'light-mode');
            
            // تحديث نص الزر
            if (btn) btn.innerText = next === 'dark' ? '☀️ وضع نهاري' : '🌙 وضع ليلي';
            
            // حفظ واسترجاع فلتر الراديو
            const player = document.getElementById('radio-player');
            if (player) player.style.filter = next === 'dark' ? 'invert(85%)' : 'none';
            
            localStorage.setItem('theme', next);
            console.log(`🌓 تم التبديل إلى: ${next}`);
            break;
        }
    }

}

// 🖼️ التبديل بين الفريمات - النسخة المُصححة والمعزولة
function showFrame(frameId) {
    // 1️⃣ إخفاء كل الفريمات وإزالة الكلاس النشط
    document.querySelectorAll('.frame').forEach(f => {
        f.style.display = 'none';
        f.classList.remove('active');
    });
    
    // 2️⃣ إظهار الفريم المطلوب فقط
    const target = document.getElementById(frameId);
    if (target) {
        target.style.display = 'flex';
        setTimeout(() => target.classList.add('active'), 10);
        
        // تحديث عنوان النافذة
        const titles = {
            'radio-frame': '📻 راديو', 
            'date-frame': '📅 تقويم',
            'prayer-frame': '🕌 مواقيت', 
            'power-frame': '⚙️ تحكم'
        };
        document.title = titles[frameId] || 'Simpel';
        
        // ✅ تحديث تتبع الفريم النشط
        activeFrameId = frameId;
        
        // 3️⃣ تهيئة مخصصة لكل فريم عند تفعيله (لمرة واحدة)
        initFrameOnActivate(frameId);
    }
}

// 🎯 دالة تهيئة الفريمات عند التفعيل (عزل كامل)
function initFrameOnActivate(frameId) {
    switch(frameId) {
        case 'radio-frame':
            // تهيئة الراديو فقط عند فتح فريم الراديو
            if (typeof initRadio === 'function' && !window.radioInitialized) {
                initRadio();
                window.radioInitialized = true;
            }
            break;
            
        case 'date-frame':
            // تحديث التقويم فوراً عند الفتح
            if (typeof renderCalendar === 'function') {
                renderCalendar(new Date());
            }
            break;
            
        case 'prayer-frame':
            // جلب مواقيت الصلاة عند الفتح
            if (typeof fetchPrayerTimes === 'function') {
                const country = document.getElementById('country-select')?.value || 'EG';
                fetchPrayerTimes(country);
            }
            break;
            
        case 'power-frame':
            // إعادة ضبط حالة المؤقت عند العودة لفريم التحكم
            if (!targetTime) {
                updateButtonStates(false);
            }
            break;
    }
}

// 🔁 استرجاع المؤقت المحفوظ (آمن)
function restoreSavedTimer() {
    const saved = localStorage.getItem('targetTime');
    if (saved) {
        const savedTime = parseInt(saved);
        if (savedTime > Date.now()) {
            targetTime = new Date(savedTime);
            is5MinWarningPlayed = false;
        } else {
            localStorage.removeItem('targetTime');
        }
    }
}

// 🎨 تهيئة السمة (محسّنة)
function initTheme() {
    const html = document.documentElement;
    const saved = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', saved);
    document.body.classList.add(saved === 'dark' ? 'dark-mode' : 'light-mode');
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerText = saved === 'dark' ? '☀️ وضع نهاري' : '🌙 وضع ليلي';
}

// 🎵 تفعيل الصوت عند أول تفاعل
function unlockAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
    }
}

// 🚀 التهيئة الأولية
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    restoreSavedTimer();
    globalUpdate(); // تشغيل فوري
    
    // تفعيل الصوت عند أول تفاعل (مرة واحدة)
    document.addEventListener('click', unlockAudioContext, { once: true });
    document.addEventListener('touchstart', unlockAudioContext, { once: true });
    
    // ربط أزرار [data-action]
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            systemAction(action);
        });
    });
   
    // داخل DOMContentLoaded:
    document.getElementById('theme-toggle')?.addEventListener('click', (e) => {
        e.preventDefault();
        systemAction('toggle-theme');
    });
    
    // زر تبديل السمة
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        systemAction('toggle-theme');
    });
    



    
    // اختصارات الكيبورد
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') systemAction('cancel');
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
            e.preventDefault(); 
            systemAction('toggle-theme');
        }
        if (activeFrameId === 'power-frame') {
            if (e.key === 'ArrowUp') { e.preventDefault(); changeTimer(5); }
            if (e.key === 'ArrowDown') { e.preventDefault(); changeTimer(-5); }
        }
    });
    
    // تغيير الدولة في مواقيت الصلاة
    document.getElementById('country-select')?.addEventListener('change', (e) => {
        if (typeof fetchPrayerTimes === 'function') {
            fetchPrayerTimes(e.target.value);
        }
    });
    
    // جسر Electron (إن وُجد)
    if (window.electronAPI) {
        console.log('🔗 Electron متصل');
        window.electronAPI.send('app-command', { action: 'get-platform' });
        window.electronAPI.receive('app-reply', (data) => {
            const status = document.getElementById('status');
            if (status && data.platform) status.innerText += ` | ${data.platform}`;
        });
    }
    
    console.log('✅ renderer.js جاهز - مع عزل الفريمات');
});

// التحديث الدوري كل ثانية
setInterval(globalUpdate, 1000);

// ✅ تصدير للدوال (للاستخدام الخارجي)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        globalUpdate, 
        systemAction, 
        changeTimer, 
        showFrame,
        initFrameOnActivate,
        updateCalendarData: typeof updateCalendarData === 'function' ? updateCalendarData : null,
        manageLocalTimer, 
        playTripleBeep
    };
}
