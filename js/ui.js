/* ============================================================
   RENEW WATER — js/ui.js
   Responsabilidades:
     · Cambio de pestañas (tab switching)
     · Notificaciones toast
     · Mostrar/ocultar campos condicionales ("Otro")
     · Formateo automático de campos (Exp date, etc.)
     · Fecha de hoy como valor por defecto
   ============================================================ */

/* ── Tab Switching ─────────────────────────────────────────── */
function switchTab(id, btn) {
  // Desactivar todos los paneles y botones
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  // Activar el seleccionado
  document.getElementById('panel-' + id).classList.add('active');
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');

  // Scroll suave al inicio del contenido
  document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Toast Notification ────────────────────────────────────── */
function showToast(msg, type = 'success', duration = APP_CONFIG.toastDuration) {
  const toast = document.getElementById('toast');
  const icon  = document.getElementById('toast-icon');
  const text  = document.getElementById('toast-message');

  toast.className = '';
  icon.textContent = type === 'success' ? '✅' : '❌';
  text.textContent = msg;
  toast.classList.add(type, 'show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── Toggle: campo "Otro" de equipos ──────────────────────── */
function toggleOtherEquipment(checkbox) {
  const wrapper = document.getElementById('other_equipment_wrapper');
  wrapper.classList.toggle('visible', checkbox.checked);
  if (!checkbox.checked) {
    document.getElementById('eq_other_text').value = '';
  }
}

/* ── Toggle: campo "Otro" horario ─────────────────────────── */
function toggleScheduleOther(radio) {
  const wrapper = document.getElementById('schedule_other_wrapper');
  const textInput = document.getElementById('wo_schedule_other_text');

  wrapper.classList.toggle('visible', radio.value === 'Otro' && radio.checked);

  // Si se elige otro radio → ocultar
  document.querySelectorAll('input[name="wo_schedule"]').forEach(r => {
    if (r !== radio) {
      r.addEventListener('change', () => {
        wrapper.classList.remove('visible');
        textInput.value = '';
      }, { once: true });
    }
  });
}

/* ── Auto-format: Expiración tarjeta (MM/YY) ──────────────── */
function initCreditCardExpFormat() {
  const expInput = document.getElementById('wo_cc_exp');
  if (!expInput) return;
  expInput.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').substring(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    this.value = v;
  });
}

/* ── Fecha de hoy como default ─────────────────────────────── */
function setTodayDefault() {
  const today = new Date().toISOString().split('T')[0];
  const woDate = document.getElementById('wo_date');
  if (woDate && !woDate.value) woDate.value = today;
}

/* ── Inicializar UI ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCreditCardExpFormat();
  setTodayDefault();
});
