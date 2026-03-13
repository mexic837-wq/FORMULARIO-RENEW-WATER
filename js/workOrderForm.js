/* ============================================================
   RENEW WATER — js/workOrderForm.js
   Responsabilidades EXCLUSIVAS de la Orden de Trabajo:
     · Recolección de todos los campos del Work Order
     · Validación básica (campos required)
     · Limpieza del formulario tras envío exitoso
     · handleWorkOrderSubmit() — handler de submit
   ============================================================ */

/* ════════════════════════════════════════════════════════════
   RECOLECTAR DATOS — Work Order
════════════════════════════════════════════════════════════ */

/**
 * Lee todos los campos del formulario de Orden de Trabajo y retorna un objeto JSON.
 * @param {HTMLFormElement} formEl
 * @returns {Object} payload listo para enviar al webhook
 */
function collectWorkOrderData(formEl) {
  const data = {};

  // ── Sección A: Datos del Comprador ──
  data.comprador = {
    fecha:     _woVal('wo_date'),
    nombre:    _woVal('wo_purchaser'),
    telefono:  _woVal('wo_phone'),
    email:     _woVal('wo_email'),
    direccion: _woVal('wo_address'),
    ciudad:    _woVal('wo_city'),
    estado:    _woVal('wo_state'),
    zipCode:   _woVal('wo_zip'),
  };

  // ── Sección B: Equipos a Instalar ──
  data.equipos = {
    suavizadorCasa:  _woChecked('eq_softener'),
    osmosisReverso:  _woChecked('eq_ro'),
    aguaAlcalina:    _woChecked('eq_alkaline'),
    aguaPozo:        _woChecked('eq_well'),
    otro:            _woChecked('eq_other'),
    otro_texto:      _woVal('eq_other_text'),
  };

  // ── Sección C: Instrucciones de Instalación ──
  data.instalacion = {
    fechaEstimada:        _woVal('wo_install_date'),
    personasEnCasa:       _woVal('wo_people'),
    tipoPiso:             _woRadio(formEl, 'wo_floor'),
    piso_otro_texto:      _woVal('wo_floor_other_text'),
    conexionRefrigerador: _woRadio(formEl, 'wo_icemaker'),
    horario:              _woRadio(formEl, 'wo_schedule'),
    horarioOtro:          _woVal('wo_schedule_other_text'),
    granossDureza:        _woVal('wo_hardness'),
    instruccionesEspeciales: _woVal('wo_special_instructions'),
  };

  // ── Sección D: Finanzas y Pago ──
  data.finanzas = {
    precioContado:       _woVal('wo_cash_price'),
    instalacion:         _woVal('wo_installation'),
    totalContado:        _woVal('wo_total_cash_price'),
    cuotaInicial:        _woVal('wo_down_payment'),
    saldo_financiado:    _woVal('wo_balance_financed'),
    cantidad_financiar:  _woVal('wo_amount_financed'),
    terminos_pago:       _woVal('wo_terms'),
    apr:                 _woVal('wo_apr'),
    cargosFinancieros:   _woVal('wo_finance_charge'),
    totalPagos:          _woVal('wo_total_payments'),
  };

  data.tarjeta = {
    numero:       _woVal('wo_cc_number'),
    expiracion:   _woVal('wo_cc_exp'),
    cvv:          _woVal('wo_cc_cvv'),
  };

  // ── Representante de Ventas y Firmas ──
  data.nombre_dealer = _woVal('wo_rep_name');
  data.firmas = {};
  const canvasRep = document.getElementById('wo-firma-rep');
  if (canvasRep && checkSignatureDrawn('wo-firma-rep')) {
    data.firmas.representante = canvasRep.toDataURL('image/png');
  } else {
    data.firmas.representante = "";
  }

  // Metadatos
  data._tipo      = 'orden_trabajo';
  data._timestamp = new Date().toISOString();

  return data;
}

/* ════════════════════════════════════════════════════════════
   VALIDACIÓN — Work Order
════════════════════════════════════════════════════════════ */

/**
 * Valida los campos requeridos del formulario de Orden de Trabajo.
 * @param {HTMLFormElement} formEl
 * @returns {boolean}
 */
function validateWorkOrderForm(formEl) {
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
   RESET — Work Order
════════════════════════════════════════════════════════════ */

/**
 * Limpiar completamente el formulario de Orden de Trabajo.
 * @param {HTMLFormElement} formEl
 */
function resetWorkOrderForm(formEl) {
  formEl.reset();
  formEl.querySelectorAll('input[type="radio"], input[type="checkbox"]')
        .forEach(el => { el.checked = false; });
  formEl.querySelectorAll('.other-input-wrapper')
        .forEach(w => w.classList.remove('visible'));
  formEl.querySelectorAll('.error')
        .forEach(el => el.classList.remove('error'));

  // Limpiar firmas
  if (typeof clearSignature === 'function') {
    clearSignature('wo-firma-rep');
  }

  // Re-establecer fecha de hoy
  const woDate = document.getElementById('wo_date');
  if (woDate) woDate.value = new Date().toISOString().split('T')[0];
}

/* ════════════════════════════════════════════════════════════
   SUBMIT HANDLER — Work Order
════════════════════════════════════════════════════════════ */

/**
 * Maneja el evento submit del formulario de Orden de Trabajo.
 * Valida, recolecta y envía los datos al webhook configurado en app.js.
 * @param {SubmitEvent} e
 */
async function handleWorkOrderSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const btn  = form.querySelector('.btn-submit');
  const span = btn.querySelector('span');
  const originalLabel = span.textContent;

  // Validación
  if (!validateWorkOrderForm(form)) {
    showToast('Completa los campos obligatorios marcados en rojo.', 'error');
    form.querySelector('.error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // Estado de carga
  btn.classList.add('loading');
  span.textContent = 'Enviando…';
  showToast('Procesando Orden de Trabajo… 📡', 'success', 10000);

  const payload = collectWorkOrderData(form);

  try {
    const response = await fetch(APP_CONFIG.webhookUrl, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload),
    });

    if (response.ok) {
      showToast('¡Orden de Trabajo enviada exitosamente! ✅', 'success');
      resetWorkOrderForm(form);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (err) {
    console.error('[WorkOrderForm] Error:', err);
    showToast(`Error al enviar. (${err.message})`, 'error');
  } finally {
    btn.classList.remove('loading');
    span.textContent = originalLabel;
  }
}

/* ════════════════════════════════════════════════════════════
   PRIVATE HELPERS (prefijo _wo para evitar colisiones)
════════════════════════════════════════════════════════════ */

/** Obtiene el valor trimmed de un input por ID */
function _woVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/** Retorna true si un checkbox está marcado */
function _woChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

/** Obtiene el valor del radio button seleccionado en un grupo */
function _woRadio(formEl, name) {
  const checked = formEl.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : '';
}

// Inicializar canvas de firma de Work Order si existe la función global
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof initSignatureCanvas === 'function') {
      initSignatureCanvas('wo-firma-rep', 'btn-limpiar-wo-firma-rep');
    }
  });
}
