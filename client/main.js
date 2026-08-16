// main.js — JOBDENI Kiosk Entry Point
import KioskController from './KioskController.js';

console.log('[main.js] Starting JOBDENI Kiosk...');
const app = new KioskController();
await app.init();
console.log('[main.js] ✅ Kiosk Ready');
