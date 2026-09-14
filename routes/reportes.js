const express = require('express');
const router = express.Router();
const { generarExcel } = require('../services/excelService');
const { generarPDF } = require('../services/pdfServices');

router.post('/generar-reporte', async (req, res) => {
    try {
        const { formato, ...datosReporte } = req.body;

        if (!datosReporte.datos || !Array.isArray(datosReporte.datos)) {
            return res.status(400).json({ error: 'Invalid data format.' });
        }

        // Si el formato pedido es PDF
        if (formato === 'pdf') {
            const pdfBuffer = await generarPDF(datosReporte);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=financial-report.pdf');
            return res.send(pdfBuffer);
        }

        // Por defecto genera Excel
        const excelBuffer = await generarExcel(datosReporte);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=financial-report.xlsx');
        res.send(excelBuffer);

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal server error while generating the document.' });
    }
});

module.exports = router;