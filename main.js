/**
 * 🖥️ main.js - العملية الرئيسية لـ Electron
 * ✅ Node.js فقط - لا يوجد document أو window هنا
 * 🛡️ أمان: contextIsolation + preload + قنوات محددة
 */

// ========== 1. الاستيراد (في أعلى الملف دائماً) ==========
const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const path = require('path');

// ========== 2. المتغيرات العامة ==========
let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development';

// ========== 3. قنوات IPC المسموح بها (أمان) ==========
const VALID_SYSTEM_COMMANDS = ['shutdown', 'cancel', 'monitor-off'];
const VALID_APP_COMMANDS = ['get-version', 'get-platform', 'get-path'];
const VALID_INVOKE_ACTIONS = ['get-version', 'get-platform', 'get-path'];

// ========== 4. إنشاء نافذة التطبيق ==========
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 520,
        height: 560,
        minWidth: 400,
        minHeight: 500,
        resizable: true,
        alwaysOnTop: false,
        frame: true,
        show: false, // إظهار بعد التحميل لمنع الوميض
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            spellcheck: false,
            devTools: isDev
        }
    });

    // إخفاء شريط القوائم العلوي
    mainWindow.setMenuBarVisibility(false);

    // تحميل واجهة المستخدم
    mainWindow.loadFile('index.html');

    // إظهار النافذة بعد التحميل الكامل
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (isDev) {
            mainWindow.webContents.openDevTools({ mode: 'bottom' });
        }
    });

    // معالجة الأخطاء أثناء التحميل
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ فشل تحميل الصفحة:', errorDescription);
    });

    // تنظيف المرجع عند الإغلاق
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ========== 5. معالجة أوامر النظام (shutdown, cancel, monitor-off) ==========
ipcMain.on('system-command', (event, data) => {
    const { action, minutes = 0 } = data || {};
    
    // 🔐 التحقق من صلاحية الأمر
    if (!VALID_SYSTEM_COMMANDS.includes(action)) {
        console.warn(`⚠️ أمر نظام غير مسموح: ${action}`);
        event.reply('system-reply', { success: false, message: 'أمر غير معروف' });
        return;
    }

    console.log(`🔧 أمر نظام: ${action} | ${minutes} دقيقة`);

    // دعم ويندوز فقط حالياً (يمكن إضافة macOS/Linux لاحقاً)
    if (process.platform === 'win32') {
        switch (action) {
            case 'shutdown':
                // جدولة الإغلاق (الحد الأدنى 60 ثانية لأمان النظام)
                const seconds = Math.max(60, minutes * 60);
                exec(`shutdown /s /t ${seconds}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error('❌ فشل جدولة الإغلاق:', err);
                        event.reply('system-reply', { 
                            success: false, 
                            message: `فشل الجدولة: ${err.message}` 
                        });
                    } else {
                        event.reply('system-reply', { 
                            success: true, 
                            message: `تم جدولة الإغلاق بعد ${minutes} دقيقة` 
                        });
                    }
                });
                break;

            case 'cancel':
                // إلغاء الإغلاق المجدول
                exec('shutdown /a', (err, stdout, stderr) => {
                    if (err) {
                        console.error('❌ فشل إلغاء الإغلاق:', err);
                        event.reply('system-reply', { 
                            success: false, 
                            message: 'فشل الإلغاء (ربما لا يوجد إغلاق مجدول)' 
                        });
                    } else {
                        event.reply('system-reply', { 
                            success: true, 
                            message: 'تم إلغاء جدولة الإغلاق' 
                        });
                    }
                });
                break;

   
            case 'monitor-off':
                if (process.platform === 'win32') {
                    console.log('🌙 جاري إطفاء الشاشة...');

                    // ✅ أمر PowerShell الآمن (بدون مشاكل علامات اقتباس)
                    const psScript = `(Add-Type '[DllImport("user32.dll")]public static extern int SendMessage(int hWnd, int hMsg, int wParam, int lParam);' -Name a -PassThru)::SendMessage(-1, 0x0112, 0xF170, 2)`;

                    // ترميز إلى Base64 (PowerShell يدعم utf16le لـ -EncodedCommand)
                    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

                    // تنفيذ الأمر بشكل غير متزامن
                    exec(`powershell -NoProfile -EncodedCommand ${encoded}`, (err) => {
                        if (err) {
                            console.error('❌ فشل إطفاء الشاشة:', err.message);
                            event.reply('system-reply', { 
                                success: false, 
                                message: 'فشل إطفاء الشاشة (تحقق من الصلاحيات)' 
                            });
                        } else {
                            event.reply('system-reply', { 
                                success: true, 
                                message: 'تم إطفاء الشاشة بنجاح' 
                            });
                        }
                    });
                } else {
                    event.reply('system-reply', { 
                        success: false, 
                        message: `إطفاء الشاشة غير مدعوم على ${process.platform}` 
                    });
                }
            break;
   
       
         }
    } else {
        // أنظمة غير مدعومة
        console.warn(`⚠️ النظام غير مدعوم لأوامر الطاقة: ${process.platform}`);
        event.reply('system-reply', { 
            success: false, 
            message: `أوامر الطاقة غير مدعومة على ${process.platform}` 
        });
    }
});

// ========== 6. معالجة أوامر التطبيق العامة ==========
ipcMain.on('app-command', (event, data) => {
    const { action } = data || {};
    
    if (!VALID_APP_COMMANDS.includes(action)) {
        console.warn(`⚠️ أمر تطبيق غير معروف: ${action}`);
        return;
    }

    switch (action) {
        case 'get-version':
            event.reply('app-reply', { 
                version: app.getVersion(),
                electron: process.versions.electron,
                success: true 
            });
            break;
            
        case 'get-platform':
            event.reply('app-reply', { 
                platform: process.platform,
                arch: process.arch,
                success: true 
            });
            break;
            
        case 'get-path':
            event.reply('app-reply', { 
                userData: app.getPath('userData'),
                exe: app.getPath('exe'),
                success: true 
            });
            break;
    }
});

// ========== 7. معالجة طلبات الاستدعاء الفوري (invoke/handle) ==========
ipcMain.handle('invoke-action', async (event, data) => {
    const { action } = data || {};
    
    if (!VALID_INVOKE_ACTIONS.includes(action)) {
        throw new Error(`أمر استدعاء غير مسموح: ${action}`);
    }

    switch (action) {
        case 'get-version':
            return { 
                version: app.getVersion(),
                electron: process.versions.electron,
                success: true 
            };
            
        case 'get-platform':
            return { 
                platform: process.platform,
                arch: process.arch,
                success: true 
            };
            
        case 'get-path':
            return { 
                userData: app.getPath('userData'),
                exe: app.getPath('exe'),
                success: true 
            };
            
        default:
            throw new Error(`أمر غير معروف: ${action}`);
    }
});

// ========== 8. تهيئة التطبيق ==========
app.whenReady().then(() => {
    // تعيين اسم التطبيق (يظهر في شريط المهام والإشعارات)
    app.setName('Simple Desktop');
    
    // إنشاء النافذة
    createWindow();

    // منع إنشاء نوافذ متعددة (اختياري)
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // دعم macOS: إعادة إنشاء النافذة عند النقر على الأيقونة
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    console.log('✅ تطبيق Electron جاهز | الإصدار:', app.getVersion());
});

// ========== 9. إغلاق التطبيق ==========
app.on('window-all-closed', () => {
    // على غير macOS: إغلاق التطبيق عند إغلاق آخر نافذة
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ========== 10. تنظيف قبل الخروج (اختياري لكن موصى به) ==========
app.on('before-quit', (event) => {
    console.log('👋 جاري إغلاق التطبيق...');
    
    // إلغاء أي إغلاق مجدول للنظام عند خروج التطبيق
    if (process.platform === 'win32') {
        exec('shutdown /a', () => {
            // تجاهل الخطأ إذا لم يكن هناك إغلاق مجدول
        });
    }
    
    // تنظيف مراجع النوافذ
    mainWindow = null;
});

// ========== 11. معالجة الأخطاء غير المتوقعة ==========
process.on('uncaughtException', (error) => {
    console.error('💥 خطأ غير متوقع في العملية الرئيسية:', error);
    // لا نغلق التطبيق تلقائياً، لكن نسجل الخطأ
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 وعد مرفوض غير معالج:', reason);
});
