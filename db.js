// ══════════════════════════════════════════════════════════════
//  db.js — Слой данных для Синтез Вкуса
//  Использует Firebase Firestore для глобального хранения данных.
//  Если Firebase недоступен — откатывается на localStorage (offline-режим).
// ══════════════════════════════════════════════════════════════

(function(global) {
  'use strict';

  // ── Ключи localStorage (fallback) ──
  const LS_TAPS   = 'sv_taps';
  const LS_PHOTOS = 'sv_photos';
  const LS_BG     = 'sv_bg';

  // ── Определяем, инициализирован ли Firebase ──
  function isFirebaseReady() {
    return typeof firebase !== 'undefined' &&
           typeof firebase.firestore === 'function';
  }

  function getDb() {
    return isFirebaseReady() ? firebase.firestore() : null;
  }

  // ════════════════════════════════════════════
  //  КРАНЫ — текстовые данные
  // ════════════════════════════════════════════

  /**
   * Загрузить данные всех 28 кранов.
   * @returns {Promise<Object>} { 1: {name, style, ...}, 2: {...}, ... }
   */
  async function loadTaps() {
    const db = getDb();
    if (!db) {
      // fallback → localStorage
      try { return JSON.parse(localStorage.getItem(LS_TAPS)) || {}; } catch { return {}; }
    }
    try {
      const snap = await db.collection('taps').get();
      const result = {};
      snap.forEach(doc => {
        result[doc.id] = doc.data();
      });
      return result;
    } catch (e) {
      console.warn('[db] Firestore read error, using localStorage:', e);
      try { return JSON.parse(localStorage.getItem(LS_TAPS)) || {}; } catch { return {}; }
    }
  }

  /**
   * Загрузить данные одного крана.
   * @param {number|string} n — номер крана (1..28)
   */
  async function loadTap(n) {
    const db = getDb();
    if (!db) {
      try {
        const all = JSON.parse(localStorage.getItem(LS_TAPS)) || {};
        return all[n] || {};
      } catch { return {}; }
    }
    try {
      const doc = await db.collection('taps').doc(String(n)).get();
      return doc.exists ? doc.data() : {};
    } catch (e) {
      console.warn('[db] Firestore read error:', e);
      try {
        const all = JSON.parse(localStorage.getItem(LS_TAPS)) || {};
        return all[n] || {};
      } catch { return {}; }
    }
  }

  /**
   * Сохранить данные крана.
   * @param {number|string} n — номер крана
   * @param {Object} data — объект с полями { name, style, desc, abv, ibu, og, color, price }
   */
  async function saveTap(n, data) {
    // Всегда сохраняем в localStorage как кеш
    try {
      const all = JSON.parse(localStorage.getItem(LS_TAPS)) || {};
      all[n] = data;
      localStorage.setItem(LS_TAPS, JSON.stringify(all));
    } catch {}

    const db = getDb();
    if (!db) return;
    try {
      await db.collection('taps').doc(String(n)).set(data, { merge: true });
    } catch (e) {
      console.error('[db] Firestore write error:', e);
      throw e;
    }
  }

  /**
   * Удалить данные крана.
   */
  async function deleteTap(n) {
    try {
      const all = JSON.parse(localStorage.getItem(LS_TAPS)) || {};
      delete all[n];
      localStorage.setItem(LS_TAPS, JSON.stringify(all));
    } catch {}

    const db = getDb();
    if (!db) return;
    try {
      await db.collection('taps').doc(String(n)).delete();
    } catch (e) {
      console.error('[db] Firestore delete error:', e);
    }
  }

  // ════════════════════════════════════════════
  //  ФОТО кранов
  // ════════════════════════════════════════════

  /**
   * Загрузить все фото.
   * @returns {Promise<Object>} { 1: "data:image/jpeg;base64,...", ... }
   */
  async function loadPhotos() {
    const db = getDb();
    if (!db) {
      try { return JSON.parse(localStorage.getItem(LS_PHOTOS)) || {}; } catch { return {}; }
    }
    try {
      const snap = await db.collection('photos').get();
      const result = {};
      snap.forEach(doc => {
        const d = doc.data();
        if (d.dataUrl) result[doc.id] = d.dataUrl;
      });
      return result;
    } catch (e) {
      console.warn('[db] Photos read error:', e);
      try { return JSON.parse(localStorage.getItem(LS_PHOTOS)) || {}; } catch { return {}; }
    }
  }

  /**
   * Загрузить фото одного крана.
   */
  async function loadPhoto(n) {
    const db = getDb();
    if (!db) {
      try {
        const all = JSON.parse(localStorage.getItem(LS_PHOTOS)) || {};
        return all[n] || null;
      } catch { return null; }
    }
    try {
      const doc = await db.collection('photos').doc(String(n)).get();
      return doc.exists ? (doc.data().dataUrl || null) : null;
    } catch (e) {
      console.warn('[db] Photo read error:', e);
      try {
        const all = JSON.parse(localStorage.getItem(LS_PHOTOS)) || {};
        return all[n] || null;
      } catch { return null; }
    }
  }

  /**
   * Сохранить фото крана (base64 dataUrl).
   */
  async function savePhoto(n, dataUrl) {
    // localStorage кеш
    try {
      const all = JSON.parse(localStorage.getItem(LS_PHOTOS)) || {};
      all[n] = dataUrl;
      localStorage.setItem(LS_PHOTOS, JSON.stringify(all));
    } catch {}

    const db = getDb();
    if (!db) return;
    try {
      await db.collection('photos').doc(String(n)).set({ dataUrl });
    } catch (e) {
      console.error('[db] Photo save error:', e);
      throw e;
    }
  }

  /**
   * Удалить фото крана.
   */
  async function deletePhoto(n) {
    try {
      const all = JSON.parse(localStorage.getItem(LS_PHOTOS)) || {};
      delete all[n];
      localStorage.setItem(LS_PHOTOS, JSON.stringify(all));
    } catch {}

    const db = getDb();
    if (!db) return;
    try {
      await db.collection('photos').doc(String(n)).delete();
    } catch (e) {
      console.error('[db] Photo delete error:', e);
    }
  }

  // ════════════════════════════════════════════
  //  ФОНЫ страниц (index / menu / taps)
  // ════════════════════════════════════════════

  /**
   * Загрузить настройки фонов.
   * @returns {Promise<Object>} { index: {...}, menu: {...}, taps: {...} }
   */
  async function loadBgAll() {
    const db = getDb();
    if (!db) {
      try { return JSON.parse(localStorage.getItem(LS_BG)) || {}; } catch { return {}; }
    }
    try {
      const doc = await db.collection('settings').doc('backgrounds').get();
      return doc.exists ? doc.data() : {};
    } catch (e) {
      console.warn('[db] BG read error:', e);
      try { return JSON.parse(localStorage.getItem(LS_BG)) || {}; } catch { return {}; }
    }
  }

  /**
   * Сохранить все настройки фонов.
   */
  async function saveBgAll(obj) {
    try { localStorage.setItem(LS_BG, JSON.stringify(obj)); } catch {}

    const db = getDb();
    if (!db) return;
    try {
      await db.collection('settings').doc('backgrounds').set(obj);
    } catch (e) {
      console.error('[db] BG save error:', e);
      throw e;
    }
  }

  // ════════════════════════════════════════════
  //  Удалить ВСЕ данные
  // ════════════════════════════════════════════
  async function deleteAllData() {
    localStorage.removeItem(LS_TAPS);
    localStorage.removeItem(LS_PHOTOS);
    localStorage.removeItem(LS_BG);

    const db = getDb();
    if (!db) return;

    try {
      const batch = db.batch();
      // Удаляем все краны
      const tapsSnap = await db.collection('taps').get();
      tapsSnap.forEach(doc => batch.delete(doc.ref));
      // Удаляем все фото
      const photosSnap = await db.collection('photos').get();
      photosSnap.forEach(doc => batch.delete(doc.ref));
      // Удаляем фоны
      batch.delete(db.collection('settings').doc('backgrounds'));
      await batch.commit();
    } catch (e) {
      console.error('[db] Delete all error:', e);
    }
  }

  // ════════════════════════════════════════════
  //  Публичный API
  // ════════════════════════════════════════════
  global.SV_DB = {
    isFirebaseReady,
    loadTaps,
    loadTap,
    saveTap,
    deleteTap,
    loadPhotos,
    loadPhoto,
    savePhoto,
    deletePhoto,
    loadBgAll,
    saveBgAll,
    deleteAllData
  };

})(window);
