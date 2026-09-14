const ExcelJS = require('exceljs');

async function generarExcel(datosReporte) {
    const english = datosReporte.idioma === 'en';
    const labels = english
        ? { sheet: 'Financial Report', date: 'Date', concept: 'Concept', category: 'Category', amount: 'Amount', total: 'NET TOTAL:' }
        : { sheet: 'Reporte Financiero', date: 'Fecha', concept: 'Concepto', category: 'Categoría', amount: 'Monto', total: 'TOTAL NETO:' };
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(labels.sheet);
    const templateColors = {
        financiera: 'FF004B87',
        operativa: 'FF177E89',
        ejecutiva: 'FF6C4AB6'
    };
    const templateColor = templateColors[datosReporte.plantilla] || templateColors.financiera;

    // 1. Título del reporte
    worksheet.mergeCells('A1:D1');
    const titulo = worksheet.getCell('A1');
    titulo.value = `${datosReporte.titulo} - ${datosReporte.mes}`;
    titulo.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: templateColor } };
    titulo.alignment = { horizontal: 'center' };

    // 2. Definir las columnas de la tabla
    worksheet.columns = [
        { header: labels.date, key: 'fecha', width: 15 },
        { header: labels.concept, key: 'concepto', width: 35 },
        { header: labels.category, key: 'categoria', width: 15 },
        { header: labels.amount, key: 'monto', width: 20 }
    ];

    // Espacio en blanco antes de los encabezados
    worksheet.getRow(2).values = []; 
    
    // Estilos para la fila de encabezados (Fila 3)
    const headerRow = worksheet.getRow(3);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: templateColor } };
    
    // 3. Agregar los datos iterando el array
    datosReporte.datos.forEach((item) => {
        worksheet.addRow({
            fecha: item.fecha,
            concepto: item.concepto,
            categoria: item.categoria,
            monto: item.monto
        });
    });

    // 4. Formato de Moneda (RD$) y Bordes para las filas de datos
    const totalFilas = datosReporte.datos.length + 3; // +3 por el título, espacio y encabezado
    
    for (let i = 4; i <= totalFilas; i++) {
        const fila = worksheet.getRow(i);
        
        // Bordes a cada celda de la fila
        fila.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });

        // Formato de moneda RD$ para la columna 'monto' (Columna D)
        const celdaMonto = worksheet.getCell(`D${i}`);
        celdaMonto.numFmt = '"RD$" #,##0.00;[Red]"RD$" -#,##0.00';
    }

    // 5. Agregar Fila de Totales con Fórmula
    const filaTotal = worksheet.addRow({
        concepto: labels.total,
    });
    filaTotal.font = { bold: true };
    
    const celdaTotalSuma = worksheet.getCell(`D${totalFilas + 1}`);
    // Fórmula de Excel: =SUM(D4:D[UltimaFila])
    celdaTotalSuma.value = { formula: `SUM(D4:D${totalFilas})` };
    celdaTotalSuma.numFmt = '"RD$" #,##0.00;[Red]"RD$" -#,##0.00';
    celdaTotalSuma.border = { top: { style: 'double' }, bottom: { style: 'double' } };

    // Devolver el archivo como un Buffer de datos (listo para ser descargado)
    return await workbook.xlsx.writeBuffer();
}

module.exports = { generarExcel };