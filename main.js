
// متغير للتحكم في حالة السمة
let isDarkMode = false;

// دالة تهيئة التطبيق للويب
function initWebApp() {
    document.addEventListener('DOMContentLoaded', () => {
        setupThemeToggle();
        setupResponsiveDesign();
        console.log('✅ التطبيق جاهز للعمل على الويب');
    });
}

// ⚙️ دالة إعداد زر تبديل السمة (بديل أزرار التحكم بالنظام)
function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle'); // تأكد من وجود هذا الزر في HTML
    
    if (themeBtn) {
        // استرجاع التفضيل المحفوظ
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            enableDarkMode();
            themeBtn.innerText = '☀️ وضع نهاري';
        }

        themeBtn.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            if (isDarkMode) {
                enableDarkMode();
                themeBtn.innerText = '☀️ وضع نهاري';
                localStorage.setItem('theme', 'dark');
            } else {
                disableDarkMode();
                themeBtn.innerText = '🌙 وضع ليلي';
                localStorage.setItem('theme', 'gold');
            }
        });
    }
}

// 🌓 تفعيل الوضع الليلي
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    document.documentElement.style.setProperty('color-scheme', 'dark');
}

// ☀️ تفعيل الوضع النهاري
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    document.documentElement.style.setProperty('color-scheme', 'gold');
}

// 📱 جعل العرض متجاوباً ومناسباً للشاشات المختلفة
function setupResponsiveDesign() {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewport);
    }
    
    // إضافة أنماط متجاوبة ديناميكياً إن لم تكن موجودة
    if (!document.getElementById('responsive-styles')) {
        const style = document.createElement('style');
        style.id = 'responsive-styles';
        style.textContent = `
            .frame { 
                width: min(320px, 95vw); 
                margin: 10px auto; 
                box-sizing: border-box;
            }
            @media (max-width: 400px) {
                .frame { width: 95vw; padding: 10px; }
                #theme-toggle { width: 100%; padding: 12px; }
            }
            /* أنماط الوضع الليلي */
            .dark-mode { 
                background: #076380 !important; 
                color: #c3ce30 !important; 
            }
            .dark-mode .frame { 
                background: #16213e; 
                border-color: #041f3f; 
            }
            .dark-mode audio { 
                filter: invert(0.9) hue-rotate(180deg); 
            }
        `;
        document.head.appendChild(style);
    }
}

// 🎯 معالجة الأوامر السابقة (تم تحويلها لتتوافق مع الويب)
function handleWebCommand(action, data = {}) {
    // ⚠️ تم إزالة: shutdown, monitor-off, cancel (لا تعمل على الويب)
    
    switch(action) {
        case 'toggle-theme':
            setupThemeToggle();
            return { success: true, message: 'تم تبديل السمة' };
        case 'get-theme':
            return { success: true, theme: localStorage.getItem('theme') || 'light' };
        default:
            console.warn(`⚠️ الأمر "${action}" غير مدعوم في نسخة الويب`);
            return { success: false, message: 'أمر غير مدعوم' };
    }
}

// 🚀 بدء التشغيل
initWebApp();

// ✅ تصدير الدوال للاستخدام الخارجي (اختياري)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { enableDarkMode, disableDarkMode, handleWebCommand };
}
