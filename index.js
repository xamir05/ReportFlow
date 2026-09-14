const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. ESTO ES LO QUE LEE EL JSON QUE MANDA EL NAVEGADOR (Debe ir aquí arriba)
app.use(express.json()); 

// 2. Luego cargamos las rutas
const rutasReportes = require('./routes/reportes');
app.use('/api', rutasReportes);

app.get('/', (req, res) => {
    res.send('API del Generador de Reportes Activa y funcionando 🚀');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});