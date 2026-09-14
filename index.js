const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. ESTO ES LO QUE LEE EL JSON QUE MANDA EL NAVEGADOR (Debe ir aquí arriba)
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public')));

// 2. Luego cargamos las rutas
const rutasReportes = require('./routes/reportes');
app.use('/api', rutasReportes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});