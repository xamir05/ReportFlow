const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generarPDF(datosReporte) {
    const english = datosReporte.idioma === 'en';
    const labels = english
        ? { period: 'Period', date: 'Date', concept: 'Concept', category: 'Category', amount: 'Amount', total: 'Net Total' }
        : { period: 'Periodo', date: 'Fecha', concept: 'Concepto', category: 'Categoria', amount: 'Monto', total: 'Total neto' };
    const templatePath = path.join(__dirname, '../templates/reportTemplate.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    let filasHTML = '';
    let sumaTotal = 0;

    datosReporte.datos.forEach(item => {
        sumaTotal += item.monto;
        const locale = english ? 'en-US' : 'es-DO';
        const currency = english ? 'USD' : 'DOP';
        const montoFormateado = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(item.monto);

        filasHTML += `
            <tr>
                <td>${item.fecha}</td>
                <td>${item.concepto}</td>
                <td>${item.categoria}</td>
                <td>${montoFormateado}</td>
            </tr>
        `;
    });

    const totalNetoFormateado = new Intl.NumberFormat(english ? 'en-US' : 'es-DO', {
        style: 'currency',
        currency: english ? 'USD' : 'DOP'
    }).format(sumaTotal);

    htmlTemplate = htmlTemplate
        .replace('{{plantilla}}', datosReporte.plantilla || 'financiera')
        .replace('{{titulo}}', datosReporte.titulo)
        .replace('{{mes}}', datosReporte.mes)
        .replace('{{periodo}}', labels.period)
        .replace('{{fecha}}', labels.date)
        .replace('{{concepto}}', labels.concept)
        .replace('{{categoria}}', labels.category)
        .replace('{{monto}}', labels.amount)
        .replace('{{totalLabel}}', labels.total)
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