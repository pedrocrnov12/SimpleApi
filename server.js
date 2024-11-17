const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const webPush = require('web-push');
require('dotenv').config();

// Configuración inicial
const app = express();
const PORT = process.env.PORT || 5000;

// Configurar web-push con las claves VAPID
webPush.setVapidDetails(
  'mailto:your-email@example.com', // Cambia por tu correo
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB conectado'))
.catch(err => console.log(err));

// Modelos
const Note = require('./models/Note');
const Subscription = require('./models/Subscription');

// Rutas para notas
// POST: Crear una nueva nota
app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body;
  const newNote = new Note({ title, content });

  try {
    await newNote.save();
    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Obtener todas las notas
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find();
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Actualizar una nota existente
app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  try {
    const updatedNote = await Note.findByIdAndUpdate(id, { title, content }, { new: true });
    if (!updatedNote) return res.status(404).json({ message: 'Nota no encontrada' });
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE: Eliminar una nota
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) return res.status(404).json({ message: 'Nota no encontrada' });
    res.status(204).send(); // No content
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Rutas para notificaciones push
// POST: Guardar una nueva suscripción
app.post('/api/subscribe', async (req, res) => {
  const subscription = req.body;

  try {
    const newSubscription = new Subscription(subscription);
    await newSubscription.save();
    res.status(201).json({ message: 'Suscripción guardada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST: Enviar notificaciones push
app.post('/api/notify', async (req, res) => {
  const { title, body } = req.body;

  try {
    const subscriptions = await Subscription.find();
    const payload = JSON.stringify({ title, body });

    const notifications = subscriptions.map(sub =>
      webPush.sendNotification(sub, payload).catch(err => console.error('Error enviando notificación:', err))
    );

    await Promise.all(notifications);
    res.status(200).json({ message: 'Notificaciones enviadas' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
