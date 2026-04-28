/**
 * 🔌 preload.js - الجسر الآمن بين واجهة المستخدم وعملية Electron الرئيسية
 * ✅ يدعم: send/on (أحادي الاتجاه) + invoke (طلب/رد) + تنظيف تلقائي
 */

const { contextBridge, ipcRenderer } = require('electron');

// 🛡️ قائمة القنوات المسموح بها (أمان: منع الوصول العشوائي)
const VALID_SEND_CHANNELS = ['system-command', 'app-command'];
const VALID_RECEIVE_CHANNELS = ['system-reply', 'app-reply'];
const VALID_INVOKE_CHANNELS = ['invoke-action'];

// 🗂️ تخزين المستمعات النشطة لإزالتها لاحقاً (منع التسرب)
const activeListeners = new Map();

/**
 * 📤 إرسال أمر إلى العملية الرئيسية (أحادي الاتجاه - لا يتوقع رد)
 * @param {string} channel - اسم القناة (يجب أن يكون في القائمة المسموحة)
 * @param {any} data - البيانات المرسلة
 */
const send = (channel, data) => {
    if (!VALID_SEND_CHANNELS.includes(channel)) {
        console.warn(`⚠️ قناة إرسال غير مسموحة: ${channel}`);
        return;
    }
    ipcRenderer.send(channel, data);
};

/**
 * 📥 الاستماع لردود من العملية الرئيسية (مع تنظيف تلقائي)
 * @param {string} channel - اسم القناة (يجب أن يكون في القائمة المسموحة)
 * @param {Function} func - الدالة التي تُنفّذ عند استقبال البيانات
 * @returns {Function} دالة لإلغاء الاستماع (مررها لـ removeListener)
 */
const receive = (channel, func) => {
    if (!VALID_RECEIVE_CHANNELS.includes(channel)) {
        console.warn(`⚠️ قناة استقبال غير مسموحة: ${channel}`);
        return () => {};
    }

    // غلاف آمن للدالة يمنع الأخطاء من إيقاف المستمع
    const safeFunc = (event, ...args) => {
        try {
            func(...args);
        } catch (error) {
            console.error(`❌ خطأ في معالجة رد ${channel}:`, error);
        }
    };

    // إضافة المستمع
    ipcRenderer.on(channel, safeFunc);

    // تخزين المرجع للتنظيف لاحقاً
    const listenerKey = `${channel}_${Date.now()}_${Math.random()}`;
    activeListeners.set(listenerKey, { channel, listener: safeFunc });

    // إرجاع دالة الإلغاء
    return () => {
        ipcRenderer.removeListener(channel, safeFunc);
        activeListeners.delete(listenerKey);
        console.log(`🧹 تم إزالة مستمع من ${channel}`);
    };
};

/**
 * 🧹 إزالة جميع المستمعات المرتبطة بقناة معينة (أو كلها)
 * @param {string} [channel] - اسم القناة (اختياري: إذا حُذف تُزال كلها)
 */
const removeListeners = (channel) => {
    for (const [key, { channel: ch, listener }] of activeListeners) {
        if (!channel || ch === channel) {
            ipcRenderer.removeListener(ch, listener);
            activeListeners.delete(key);
        }
    }
    console.log(`🧹 تم تنظيف مستمعات${channel ? ` لـ ${channel}` : ''}`);
};

/**
 * 🔄 إرسال طلب وانتظار رد (نمط طلب/رد - الأفضل للأوامر التي تحتاج تأكيد)
 * @param {string} channel - اسم القناة (يجب أن يكون في القائمة المسموحة)
 * @param {any} data - البيانات المرسلة
 * @returns {Promise<any>} وعد يحتوي على الرد من العملية الرئيسية
 */
const invoke = async (channel, data) => {
    if (!VALID_INVOKE_CHANNELS.includes(channel)) {
        console.warn(`⚠️ قناة استدعاء غير مسموحة: ${channel}`);
        throw new Error(`قناة غير مسموحة: ${channel}`);
    }
    try {
        return await ipcRenderer.invoke(channel, data);
    } catch (error) {
        console.error(`❌ فشل في استدعاء ${channel}:`, error);
        throw error;
    }
};

/**
 * 🎯 التعريض الآمن للواجهة العالمية (يصل له الـ renderer.js فقط)
 */
contextBridge.exposeInMainWorld('electronAPI', {
    send,
    receive,
    removeListeners,
    invoke,
    
    // 🧰 أدوات مساعدة للتصحيح (تُحذف في نسخة الإنتاج)
    __debug: {
        getActiveListeners: () => Array.from(activeListeners.keys()),
        getValidChannels: () => ({
            send: VALID_SEND_CHANNELS,
            receive: VALID_RECEIVE_CHANNELS,
            invoke: VALID_INVOKE_CHANNELS
        })
    }
});

// 🧹 تنظيف تلقائي عند إغلاق النافذة (منع تسرب الذاكرة)
window.addEventListener('beforeunload', () => {
    removeListeners();
    console.log('👋 preload.js: تم تنظيف جميع المستمعات');
});
