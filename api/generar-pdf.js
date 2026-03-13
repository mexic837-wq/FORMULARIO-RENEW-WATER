import { PDFDocument } from 'pdf-lib';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    // 1. Asegurar parseo del JSON
    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      bodyData = JSON.parse(bodyData);
    }
    const datos = bodyData.datos || bodyData;

    // 2. Descargar el molde público
    const protocolo = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const urlMolde = `${protocolo}://${host}/molde_credito_v4.pdf`;
    
    const fetchResponse = await fetch(urlMolde);
    if (!fetchResponse.ok) {
      throw new Error(`No se pudo descargar el molde desde ${urlMolde}`);
    }

    const pdfArrayBuffer = await fetchResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const form = pdfDoc.getForm();

    // 3. Llenar los campos dinámicamente
    for (const [key, value] of Object.entries(datos)) {
      try {
        const field = form.getTextField(key.trim());
        if (field) {
          field.setText(value ? String(value) : '');
        }
      } catch (err) {
        console.log(`Campo omitido: ${key}`);
      }
    }

    // 4. Aplanar y guardar
    form.flatten();
    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="contrato_generado.pdf"');
    return res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Fallo interno', detalle: error.message });
  }
}
