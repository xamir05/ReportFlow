const express = require('express');
const router = express.Router();
const { generarExcel } = require('../services/excelService');

router.post('/generar-reporte', async (req, res) => {
    try {
        const datos = req.body;

        // Validación súper básica
        if (!datos.datos || !Array.isArray(datos.datos)) {
            return res.status(400).json({ error: 'El JSON debe contener un array de "datos".' });
        }

        // Llamamos a nuestro servicio
        const excelBuffer = await generarExcel(datos);

        // Configuramos las cabeceras para forzar la descarga del archivo en el navegador/cliente
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-financiero.xlsx');

        // Enviamos el archivo
        res.send(excelBuffer);

    } catch (error) {
        console.error('Error generando el reporte:', error);
        res.status(500).json({ error: 'Hubo un error al generar el documento.' });
    }
});

module.exports = router;