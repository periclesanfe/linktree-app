require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const linkRoutes = require('./routes/links');
const redirectRoutes = require('./routes/redirect');
const analyticsRoutes = require('./routes/analytics');
const socialIconRoutes = require('./routes/socialIcons');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
// app.use(express.json());

app.get('/api', (req, res) => {
    res.send('API do Linktree está no ar!');
});

app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/r', redirectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/socials', socialIconRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});