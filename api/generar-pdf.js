// =============================================================================
// api/generar-pdf.js
// Vercel Serverless Function para generación dinámica de PDFs con pdf-lib.
//
// Uso:
//   POST /api/generar-pdf
//   Body (JSON):
//     {
//       "moldeUrl": "https://example.com/plantilla.pdf",  // URL pública del PDF molde
//       "datos": {
//         "NombreCliente": "Juan Pérez",
//         "Telefono": "555-1234",
//         ...                                              // Coincide con nombres de campos del PDF
//       }
//     }
// =============================================================================

import { PDFDocument } from "pdf-lib";

/**
 * Handler principal de la Serverless Function de Vercel.
 * @param {import('@vercel/node').VercelRequest}  req
 * @param {import('@vercel/node').VercelResponse} res
 */
export default async function handler(req, res) {
  // ------------------------------------------------------------------
  // 1. Validar método HTTP — solo se acepta POST
  // ------------------------------------------------------------------
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Método no permitido. Usa POST." });
  }

  // ------------------------------------------------------------------
  // 2. Extraer y validar el cuerpo del request
  // ------------------------------------------------------------------
  const { moldeUrl, datos } = req.body ?? {};

  if (!moldeUrl || typeof moldeUrl !== "string") {
    return res
      .status(400)
      .json({ error: "Se requiere 'moldeUrl' (string) en el body." });
  }

  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return res
      .status(400)
      .json({ error: "Se requiere 'datos' (objeto clave-valor) en el body." });
  }

  try {
    // ----------------------------------------------------------------
    // 3. Descargar el PDF molde desde la URL proporcionada
    // ----------------------------------------------------------------
    const response = await fetch(moldeUrl);

    if (!response.ok) {
      return res.status(422).json({
        error: `No se pudo obtener el PDF molde. HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const moldeBytes = await response.arrayBuffer();

    // ----------------------------------------------------------------
    // 4. Cargar el PDF con pdf-lib
    // ----------------------------------------------------------------
    const pdfDoc = await PDFDocument.load(moldeBytes);

    // ----------------------------------------------------------------
    // 5. Obtener el formulario AcroForm del PDF
    // ----------------------------------------------------------------
    const form = pdfDoc.getForm();

    // ----------------------------------------------------------------
    // 6. Llenar cada campo de texto con los datos recibidos
    //    Se usa try/catch por campo para que un campo inexistente no
    //    detenga el procesamiento del resto.
    // ----------------------------------------------------------------
    for (const [key, value] of Object.entries(datos)) {
      try {
        const field = form.getTextField(key);
        field.setText(String(value ?? ""));
      } catch (fieldError) {
        // El campo no existe en el PDF o no es de tipo TextField.
        // Se registra la advertencia y se continúa.
        console.warn(
          `[generar-pdf] Campo ignorado: "${key}" — ${fieldError.message}`
        );
      }
    }

    // ----------------------------------------------------------------
    // 7. Aplanar el formulario (los datos quedan fijos / no editables)
    // ----------------------------------------------------------------
    form.flatten();

    // ----------------------------------------------------------------
    // 8. Serializar el PDF resultante a bytes
    // ----------------------------------------------------------------
    const pdfBytes = await pdfDoc.save();

    // ----------------------------------------------------------------
    // 9. Enviar el PDF como respuesta con los headers correctos
    // ----------------------------------------------------------------
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="documento-generado.pdf"'
    );
    res.setHeader("Content-Length", pdfBytes.length);

    return res.status(200).send(Buffer.from(pdfBytes));
  } catch (error) {
    // ----------------------------------------------------------------
    // 10. Manejo de errores inesperados
    // ----------------------------------------------------------------
    console.error("[generar-pdf] Error inesperado:", error);
    return res.status(500).json({
      error: "Error interno al generar el PDF.",
      detalle: error.message,
    });
  }
}
