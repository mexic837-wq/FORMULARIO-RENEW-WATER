/* ============================================================
   RENEW WATER — js/creditForm.js
   Responsabilidades EXCLUSIVAS de la Aplicación de Crédito:
     · Recolección de todos los campos del formulario de crédito
     · Validación básica (campos required)
     · Limpieza del formulario tras envío exitoso
     · handleCreditFormSubmit() — handler de submit
   ============================================================ */

/* ════════════════════════════════════════════════════════════
   RECOLECTAR DATOS — Credit Application
════════════════════════════════════════════════════════════ */

/**
 * Lee todos los campos del formulario de crédito y retorna un objeto JSON.
 * Incluye campos escalares, radios y checkboxes.
 * @param {HTMLFormElement} formEl
 * @returns {Object} payload listo para enviar al webhook
 */
function collectCreditFormData(formEl) {
  const data = {};

  // ── Sección A: Aplicante Principal ──
  data.aplicante = {
    monto:            _val('ca_amount'),
    nombreCompleto:   _val('ca_fullname'),
    fechaNacimiento:  _val('ca_dob'),
    seguroSocial:     _val('ca_ssn'),
    licencia:         _val('ca_dl'),
    licenciaEstado:   _val('ca_dl_state'),
    licenciaExpedicion: _val('ca_dl_issue'),
    licenciaExpiracion: _val('ca_dl_exp'),
    telefono:         _val('ca_phone'),
    email:            _val('ca_email'),
    direccion:        _val('ca_address'),
    tiempoViviendo:   _val('ca_time_living'),
    pagoMensual:      _val('ca_mortgage_payment'),
    tipoVivienda:     _radio(formEl, 'ca_housingType'),
    estatusVivienda:  _radio(formEl, 'ca_housingStatus'),
  };

  // ── Sección B: Co-Aplicante ──
  data.coAplicante = {
    monto:            _val('cb_amount'),
    nombreCompleto:   _val('cb_fullname'),
    fechaNacimiento:  _val('cb_dob'),
    seguroSocial:     _val('cb_ssn'),
    licencia:         _val('cb_dl'),
    licenciaEstado:   _val('cb_dl_state'),
    licenciaExpedicion: _val('cb_dl_issue'),
    licenciaExpiracion: _val('cb_dl_exp'),
    telefono:         _val('cb_phone'),
    email:            _val('cb_email'),
    direccion:        _val('cb_address'),
    tiempoViviendo:   _val('cb_time_living'),
    pagoMensual:      _val('cb_mortgage_payment'),
    tipoVivienda:     _radio(formEl, 'cb_housingType'),
    estatusVivienda:  _radio(formEl, 'cb_housingStatus'),
  };

  // ── Sección C: Empleo e Ingresos — Aplicante ──
  data.empleoAplicante = {
    tipoIngreso:      _radio(formEl, 'ca_incomeType'),
    nombreEmpleo:     _val('ca_employer'),
    telefonoTrabajo:  _val('ca_work_phone'),
    direccionTrabajo: _val('ca_work_address'),
    posicion:         _val('ca_position'),
    tiempoTrabajo:    _val('ca_time_job'),
    pagoMensual:      _val('ca_monthly_income'),
    pagoAnual:        _val('ca_yearly_income'),
  };

  // ── Sección C: Empleo e Ingresos — Co-Aplicante ──
  data.empleoCoAplicante = {
    tipoIngreso:      _radio(formEl, 'cb_incomeType'),
    nombreEmpleo:     _val('cb_employer'),
    telefonoTrabajo:  _val('cb_work_phone'),
    direccionTrabajo: _val('cb_work_address'),
    posicion:         _val('cb_position'),
    tiempoTrabajo:    _val('cb_time_job'),
    pagoMensual:      _val('cb_monthly_income'),
    pagoAnual:        _val('cb_yearly_income'),
  };

  // Metadatos
  data._tipo       = 'aplicacion_credito';
  data._timestamp  = new Date().toISOString();

  return data;
}

/* ════════════════════════════════════════════════════════════
   VALIDACIÓN — Credit Application
════════════════════════════════════════════════════════════ */

/**
 * Valida los campos requeridos del formulario de crédito.
 * Marca visualmente los campos vacíos con clase .error.
 * @param {HTMLFormElement} formEl
 * @returns {boolean} true si el formulario es válido
 */
function validateCreditForm(formEl) {
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

/* ════════════════════════════════════════════════════════════
   RESET — Credit Application
════════════════════════════════════════════════════════════ */

/**
 * Limpia completamente el formulario de crédito.
 * @param {HTMLFormElement} formEl
 */
function resetCreditForm(formEl) {
  formEl.reset();
  formEl.querySelectorAll('input[type="radio"], input[type="checkbox"]')
        .forEach(el => { el.checked = false; });
  formEl.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

/* ════════════════════════════════════════════════════════════
   SUBMIT HANDLER — Credit Application
════════════════════════════════════════════════════════════ */

/**
 * Maneja el evento submit del formulario de Aplicación de Crédito.
 * Valida, recolecta datos y los envía al webhook configurado en app.js.
 * @param {SubmitEvent} e
 */
async function handleCreditFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const btn  = form.querySelector('.btn-submit');
  const span = btn.querySelector('span');
  const originalLabel = span.textContent;

  // Validación
  if (!validateCreditForm(form)) {
    showToast('Completa los campos obligatorios marcados en rojo.', 'error');
    form.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Estado de carga
  btn.classList.add('loading');
  span.textContent = 'Enviando…';
  showToast('Procesando Aplicación de Crédito… 📡', 'success', 10000);

  const payload = collectCreditFormData(form);

  try {
    const response = await fetch(APP_CONFIG.webhookUrl, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload),
    });

    if (response.ok) {
      showToast('¡Aplicación de Crédito enviada exitosamente! ✅', 'success');
      resetCreditForm(form);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    console.error('[CreditForm] Error:', err);
    showToast(`Error al enviar. (${err.message})`, 'error');
  } finally {
    btn.classList.remove('loading');
    span.textContent = originalLabel;
  }
}

/* ════════════════════════════════════════════════════════════
   PRIVATE HELPERS
════════════════════════════════════════════════════════════ */

/** Obtiene el valor trimmed de un input por ID */
function _val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/** Obtiene el valor del radio button seleccionado en un grupo */
function _radio(formEl, name) {
  const checked = formEl.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}
