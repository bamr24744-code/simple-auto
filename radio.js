// في radio.js - أعلى الملف
window.radioInitialized = false;
function initRadio() {
    if (window.radioInitialized) return;
    
    const player = document.getElementById('radio-player');
    const stationSelect = document.getElementById('station-select');
    
    if (!player || !stationSelect) {
        console.warn('⚠️ عناصر الراديو غير موجودة');
        return;
    }
    
    // ... منطق التهيئة الأصلي ...
    
    window.radioInitialized = true;
    console.log('✅ الراديو مهيأ');
}


/**
 * 📻 نظام الراديو الذكي - يولد القائمة تلقائياً من كائن المحطات
 */

// ✅ قائمة المحطات (أضف/احذف ما تشاء هنا فقط)
const radioStations = {
    'quran': { name: '📖 إذاعة القرآن الكريم', url: 'https://stream.radiojar.com/8s5u5tpdtwzuv', type: 'audio/mp3' },
    // أضف أو استبدل في كائن radioStations في radio.js:

    'bbc-arabic-alt1': {
        name: '📻 BBC عربي',
        url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_arabic_radio',
        type: 'audio/mp3',
        description: 'بي بي سي عربي - تجميع بث'
    },


    'bbc-world-english': {
        name: '🌍 BBC News',
        url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
        type: 'audio/aac',
        description: 'بي بي سي العالمية - إنجليزي (رابط رسمي)'
    },

    'sawt-alareej': { name: '🎵 صوت العريج', url: 'https://stream.zeno.fm/0r0xa792kwzuv', type: 'audio/mp3' },
    'quran-saudi': { name: '🕌 القرآن - السعودية', url: 'https://live.qurango.net/radio/quran', type: 'audio/mp3' },
    'panorama': { name: '🎼 بانوراما FM', url: 'https://stream.radiojar.com/hq3h7g7k5bnuv', type: 'audio/mp3' },
    'nile-fm': { name: '🎧 Nile FM', url: 'https://stream.radiojar.com/0r0xa792kwzuv', type: 'audio/mp3' },
    // ✅ أضف محطاتك الجديدة هنا بنفس التنسيق (لاحظ الفاصلة `,` بين العناصر)
    'mecca-fm': { name: '🕋 مكة FM', url: 'https://stream.radiojar.com/qg8vqmq5uwzuv', type: 'audio/mp3' },
    'voice-of-arab': { name: '📻 صوت العرب', url: 'https://stream.zeno.fm/gcw7z5n8kwzuv', type: 'audio/mp3' },

        // ✅ أضف هذه المحطات داخل كائن radioStations في radio.js
  
    'maspero-drama': {
        name: '🎭 ماسبيرو دراما',
        url: 'https://stream.radiojar.com/h7k9m5b5uwzuv',
        type: 'audio/mp3',
        description: 'مسلسلات وبرامج إذاعية مصرية'
    },
    'maspero-zaman': {
        name: '📻 ماسبيرو زمان',
        url: 'https://stream.radiojar.com/qg8vqmq5uwzuv',
        type: 'audio/mp3',
        description: 'أغاني وذكريات الزمن الجميل'
    },
    'nile-fm': {
        name: '🎧 Nile FM',
        url: 'https://stream.zeno.fm/0r0xa792kwzuv',
        type: 'audio/mp3',
        description: '104.2 - أغاني عالمية وعربية'
    }
   

};

const player = document.getElementById('radio-player');
const statusText = document.getElementById('status');
const stationSelect = document.getElementById('station-select');
const currentStationText = document.getElementById('current-station');
let currentStationId = 'quran';

/**
 * 🔄 توليد قائمة المحطات ديناميكياً
 */
function populateStationList() {
    if (!stationSelect) return;
    
    stationSelect.innerHTML = ''; // مسح خيار "جاري التحميل"
    
    Object.entries(radioStations).forEach(([id, station]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = station.name;
        
        // تحديد آخر محطة تم الاستماع لها
        const lastStation = localStorage.getItem('lastStation') || 'quran';
        if (id === lastStation) option.selected = true;
        
        stationSelect.appendChild(option);
    });
    
    currentStationId = stationSelect.value;
}

/**
 * 🎵 تحميل وتشغيل محطة
 */
function loadStation(stationId) {
    const station = radioStations[stationId];
    if (!station) return console.error('المحطة غير موجودة:', stationId);
    
    const source = player.querySelector('source');
    if (source) {
        source.src = station.url;
        source.type = station.type;
    }
    
    player.load();
    currentStationId = stationId;
    localStorage.setItem('lastStation', stationId);
    updateStatus(`📡 ${station.name}`);
    
    if (currentStationText) currentStationText.innerText = station.description || station.name;
}

function updateStatus(msg) {
    if (!navigator.onLine) {
        statusText.innerText = '⚠️ لا يوجد اتصال';
        statusText.style.color = 'var(--text-error, #ff6b6b)';
    } else {
        statusText.innerText = msg;
        statusText.style.color = 'var(--text-dim, #adb5bd)';
    }
}

// 🎮 ربط الأحداث
document.addEventListener('DOMContentLoaded', () => {
    populateStationList(); // ✅ توليد القائمة فوراً
    
    stationSelect?.addEventListener('change', (e) => loadStation(e.target.value));
    
    player.onplay = () => updateStatus('▶️ جاري البث...');
    player.onerror = () => updateStatus('⚠️ فشل تحميل المحطة');
    player.onpause = () => updateStatus('⏸️ متوقف');
    
    window.addEventListener('offline', () => updateStatus('⚠️ انقطع الاتصال'));
    window.addEventListener('online', () => {
        updateStatus('✅ متصل');
        if (!player.paused) player.load();
    });
    
    // تحميل المحطة المحفوظة أو الافتراضية
    loadStation(localStorage.getItem('lastStation') || 'quran');
    console.log(`✅ تم تحميل ${Object.keys(radioStations).length} محطة`);
});




