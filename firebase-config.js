// ══════════════════════════════════════════════════════════════
//  FIREBASE КОНФИГУРАЦИЯ — Синтез Вкуса
//  Заполните свои данные из Firebase Console
//  Инструкция: см. FIREBASE_SETUP.md
// ══════════════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDXtlJAHH5sOBlQgnOu1Xyb148gBi2pAc4",
  authDomain:        "sintezvkusa.firebaseapp.com",
  projectId:         "sintezvkusa",
  storageBucket:     "sintezvkusa.firebasestorage.app",
  messagingSenderId: "754567308513",
  appId:             "1:754567308513:web:fb5d4d47e9859abd25c3a0"
};

// ── Экспорт для использования в других файлах ──
if (typeof module !== 'undefined') module.exports = FIREBASE_CONFIG;
