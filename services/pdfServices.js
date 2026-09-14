const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generarPDF(datosReporte) {
    const templatePath = path.join(__dirname, '../templates/reportTemplate.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    let filasHTML = '';
    let sumaTotal = 0;

    datosReporte.datos.forEach(item => {
        sumaTotal += item.monto;
        const montoFormateado = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.monto);

        filasHTML += `
            <tr>
                <td>${item.fecha}</td>
                <td>${item.concepto}</td>
                <td>${item.categoria}</td>
                <td>${montoFormateado}</td>
            </tr>
        `;
    });

    const totalNetoFormateado = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(sumaTotal);

    htmlTemplate = htmlTemplate
        .replace('{{titulo}}', datosReporte.titulo)
        .replace('{{mes}}', datosReporte.mes)
        .replace('{{filasTabla}}', filasHTML)
        .replace('{{totalNeto}}', totalNetoFormateado);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
    await page.addStyleTag({ path: path.join(__dirname, '../templates/reportTemplate.css') });

    const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
    });

    await browser.close();
    return pdfBuffer;
}

module.exports = { generarPDF };