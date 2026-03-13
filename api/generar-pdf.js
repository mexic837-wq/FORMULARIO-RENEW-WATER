import { PDFDocument } from 'pdf-lib';

export default async function handler(req, res) {
  // 1. Solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const datos = req.body.datos || req.body;

    // 2. Descargar el molde desde la misma web pública
    const protocolo = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const urlMolde = `${protocol}://${host}/molde_credito.pdf`;
    
    const fetchResponse = await fetch(urlMolde);
    if (!fetchResponse.ok) {
      throw new Error(`No se pudo descargar el molde desde ${urlMolde}`);
    }

    // 3. Convertir a ArrayBuffer y cargar en pdf-lib
    const pdfArrayBuffer = await fetchResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const form = pdfDoc.getForm();

    // 4. Llenar los campos dinámicamente
    for (const [key, value] of Object.entries(datos)) {
      try {
        const field = form.getTextField(key);
        if (field) {
          field.setText(value ? String(value) : '');
        }
      } catch (err) {
        console.log(`Campo omitido: ${key}`);
      }
    }

    // 5. Aplanar y guardar
    form.flatten();
    const pdfBytes = await pdfDoc.save();

    // 6. Devolver el archivo
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contrato_generado.pdf"');
    return res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Fallo interno', detalle: error.message });
  }
}
