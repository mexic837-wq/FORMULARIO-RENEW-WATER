/* ============================================================
   RENEW WATER — js/forms.js
   Responsabilidades:
     · Recolectar todos los datos del formulario → objeto JSON
     · Validación básica (campos required)
     · Envío via fetch POST al webhook configurado en config.js
     · Limpiar el formulario tras envío exitoso
   ============================================================ */

/* ── Recolectar datos del formulario ───────────────────────── */
function collectFormData(formEl) {
  const data = {};
  const fd   = new FormData(formEl);

  // Campos escalares (text, number, date, email, tel, password, textarea)
  for (const [key, value] of fd.entries()) {
    if (Array.isArray(data[key])) {
      data[key].push(value);
    } else if (data[key] !== undefined) {
      data[key] = [data[key], value];
    } else {
      data[key] = value;
    }
  }

  // Radio buttons: garantizar que estén en el objeto aunque no estén marcados
  formEl.querySelectorAll('input[type="radio"]').forEach(r => {
    if (!data[r.name]) data[r.name] = '';
    if (r.checked)     data[r.name] = r.value;
  });

  // Checkboxes → array de valores marcados
  const cbGroups = {};
  formEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    if (!cbGroups[cb.name]) cbGroups[cb.name] = [];
    if (cb.checked)         cbGroups[cb.name].push(cb.value);
  });
  Object.assign(data, cbGroups);

  // Metadatos
  data._timestamp = new Date().toISOString();
  data._formId    = formEl.id;

  return data;
}

/* ── Validación: campos marcados como required ────────────── */
function validateForm(formEl) {
  let valid = true;
  formEl.querySelectorAll('[required]').forEach(field => {
    field.classList.remove('error');
    if (!field.value.trim()) {
      field.classList.add('error');
      valid = false;
    }
  });
  return valid;
}

/* ── Limpiar formulario completamente ─────────────────────── */
function resetForm(formEl) {
  formEl.reset();
  // Desmarcar pills (radios/checkboxes hidden en pill-group)
  formEl.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(el => {
    el.checked = false;
  });
  // Ocultar wrappers condicionales
  formEl.querySelectorAll('.other-input-wrapper').forEach(w => {
    w.classList.remove('visible');
  });
  // Limpiar errores
  formEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

/* ── Handler de envío ─────────────────────────────────────── */
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('.btn-submit');
  const span = btn.querySelector('span');
  const originalLabel = span.textContent;

  // Validar campos obligatorios
  if (!validateForm(form)) {
    showToast('Por favor completa los campos obligatorios.', 'error');
    form.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Estado de carga
  btn.classList.add('loading');
  span.textContent = 'Enviando…';
  showToast('Procesando documento… 📡', 'success', 10000);

  const payload = collectFormData(form);

  try {
    const response = await fetch(APP_CONFIG.webhookUrl, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload),
    });

    if (response.ok) {
      showToast('¡Documento enviado exitosamente! ✅', 'success');
      resetForm(form);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    console.error('[RENEW WATER] Error al enviar:', err);
    showToast(`Error al enviar. Intente de nuevo. (${err.message})`, 'error');
  } finally {
    btn.classList.remove('loading');
    span.textContent = originalLabel;
  }
}

/* ── Vincular formularios al cargar el DOM ────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const creditForm    = document.getElementById('form-credit');
  const workOrderForm = document.getElementById('form-workorder');

  if (creditForm)    creditForm.addEventListener('submit', handleSubmit);
  if (workOrderForm) workOrderForm.addEventListener('submit', handleSubmit);
});
