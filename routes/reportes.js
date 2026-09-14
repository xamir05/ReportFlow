const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const router = express.Router();
const { generarExcel } = require('../services/excelService');
const { generarPDF } = require('../services/pdfServices');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

function normalizarDatos(datos) {
    return datos.map((item) => ({
        fecha: String(item.fecha ?? '').trim(),
        concepto: String(item.concepto ?? '').trim(),
        categoria: String(item.categoria ?? '').trim(),
        monto: Number(item.monto)
    })).filter((item) => {
        return item.fecha && item.concepto && item.categoria && Number.isFinite(item.monto);
    });
}

router.post('/generar-reporte', async (req, res) => {
    try {
        const { formato, idioma = 'es', ...datosReporte } = req.body || {};

        if (!datosReporte.datos || !Array.isArray(datosReporte.datos)) {
            return res.status(400).json({ error: 'Formato de datos inválido. Debes enviar un arreglo en "datos".' });
        }

        const datosNormalizados = normalizarDatos(datosReporte.datos);
        if (!datosNormalizados.length) {
            return res.status(400).json({ error: 'Debe haber al menos una fila válida con fecha, concepto, categoría y monto.' });
        }

        const payload = {
            ...datosReporte,
            datos: datosNormalizados,
            idioma: idioma === 'en' ? 'en' : 'es',
            titulo: String(datosReporte.titulo ?? 'Reporte financiero').trim() || 'Reporte financiero',
            mes: String(datosReporte.mes ?? 'Sin mes').trim() || 'Sin mes'
        };

        if (formato === 'pdf') {
            const pdfBuffer = await generarPDF(payload);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=financial-report.pdf');
            return res.send(pdfBuffer);
        }

        if (formato !== 'excel' && formato !== undefined) {
            return res.status(400).json({ error: 'Formato no soportado. Usa "excel" o "pdf".' });
        }

        const excelBuffer = await generarExcel(payload);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=financial-report.xlsx');
        return res.send(excelBuffer);

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal server error while generating the document.' });
    }
});

router.post('/importar-excel', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Selecciona un archivo Excel (.xlsx).' });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            return res.status(400).json({ error: 'El archivo Excel no contiene ninguna hoja.' });
        }

        const headers = [];
        worksheet.getRow(1).eachCell((cell, columnNumber) => {
            headers[columnNumber - 1] = String(cell.value ?? '').trim().toLowerCase();
        });

        const aliases = {
            fecha: ['fecha', 'date'],
            concepto: ['concepto', 'concept', 'description'],
            categoria: ['categoria', 'categoría', 'category'],
            monto: ['monto', 'amount', 'importe']
        };
        const indexes = {};
        Object.entries(aliases).forEach(([key, names]) => {
            indexes[key] = headers.findIndex((header) => names.includes(header));
        });

        if (Object.values(indexes).some((index) => index === -1)) {
            return res.status(400).json({
                error: 'La primera fila debe incluir columnas: fecha, concepto, categoria y monto.'
            });
        }

        const datos = [];
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const value = (key) => row.getCell(indexes[key] + 1).value;
            const fecha = value('fecha') instanceof Date
                ? value('fecha').toLocaleDateString('es-DO')
                : String(value('fecha') ?? '').trim();
            const item = {
                fecha,
                concepto: String(value('concepto') ?? '').trim(),
                categoria: String(value('categoria') ?? '').trim(),
                monto: Number(value('monto'))
            };
            if (item.fecha || item.concepto || item.categoria || Number.isFinite(item.monto)) {
                datos.push(item);
            }
        });

        const datosValidos = normalizarDatos(datos);
        if (!datosValidos.length) {
            return res.status(400).json({ error: 'No se encontraron filas válidas en el Excel.' });
        }

        return res.json({ datos: datosValidos, filas: datosValidos.length });
    } catch (error) {
        console.error('Error importing Excel:', error);
        return res.status(400).json({ error: 'No se pudo leer el Excel. Verifica que sea un archivo .xlsx válido.' });
    }
});

module.exports = router;