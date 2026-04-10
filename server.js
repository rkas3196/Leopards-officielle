
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Shwary, ValidationError, AuthenticationError, ApiError } = require('@shwary/node-sdk');
require('dotenv').config();

// Initialisation du SDK Shwary
Shwary.initFromEnvironment();

// Base de données SQLite
const db = new sqlite3.Database(path.join(__dirname, 'site_data.db'));

// Création des tables si elles n'existent pas
db.serialize(() => {
  // Paramètres généraux (clé/valeur)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  // Visites
  db.run(`CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    ip TEXT,
    page TEXT,
    referrer TEXT,
    user_agent TEXT
  )`);

  // Historique des partages
  db.run(`CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    platform TEXT,
    share_url TEXT,
    ip TEXT
  )`);

  // Dons (pour centraliser)
  db.run(`CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    amount INTEGER,
    phone TEXT,
    transaction_id TEXT,
    status TEXT
  )`);

  // Insérer quelques paramètres par défaut si la table est vide
  db.get(`SELECT COUNT(*) as count FROM settings`, (err, row) => {
    if (row.count === 0) {
      const defaults = {
        site_title: '🇨🇩 LÉOPARDS UNIS 🇨🇩',
        site_slogan: '1000 FC ou 500 FC, tous ensemble derrière nos Léopards !',
        hero_message: '#AllezRDC 🔥 #NosLéopards',
        pack1_price: '1000',
        pack2_price: '500',
        contact_email: 'contact@leopardsunis.cd',
        contact_phone: '+243123456789'
      };
      for (const [key, value] of Object.entries(defaults)) {
        db.run(`INSERT INTO settings (key, value) VALUES (?, ?)`, [key, value]);
      }
    }
  });
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== MIDDLEWARE DE TRACKING ==========
app.use((req, res, next) => {
  // Ne pas tracker les appels API ou admin
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin')) return next();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const referrer = req.headers.referer || '';
  const userAgent = req.headers['user-agent'] || '';
  db.run(`INSERT INTO visits (date, ip, page, referrer, user_agent) VALUES (?, ?, ?, ?, ?)`,
    [new Date().toISOString(), ip, req.path, referrer, userAgent]);
  next();
});

// ========== ROUTES ADMIN (API) ==========
// Récupérer tous les paramètres
app.get('/api/admin/settings', (req, res) => {
  db.all(`SELECT key, value FROM settings`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const settings = {};
    rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  });
});

// Mettre à jour un paramètre
app.post('/api/admin/settings', (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'Missing key' });
  db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Récupérer les statistiques globales
app.get('/api/admin/stats', (req, res) => {
  const stats = {};
  db.get(`SELECT COUNT(*) as totalVisits FROM visits`, (err, row) => { stats.visits = row.totalVisits; });
  db.get(`SELECT COUNT(*) as totalShares FROM shares`, (err, row) => { stats.shares = row.totalShares; });
  db.get(`SELECT SUM(amount) as totalDonations FROM donations`, (err, row) => { stats.donations = row.totalDonations || 0; });
  db.get(`SELECT COUNT(*) as totalDonationsCount FROM donations`, (err, row) => { stats.donationsCount = row.totalDonationsCount; });
  // Attendre que toutes les requêtes soient terminées (simplifié avec Promise)
  Promise.all([
    new Promise(resolve => db.get(`SELECT COUNT(*) as v FROM visits`, (_, r) => resolve(r?.v || 0))),
    new Promise(resolve => db.get(`SELECT COUNT(*) as s FROM shares`, (_, r) => resolve(r?.s || 0))),
    new Promise(resolve => db.get(`SELECT SUM(amount) as d FROM donations`, (_, r) => resolve(r?.d || 0))),
    new Promise(resolve => db.get(`SELECT COUNT(*) as dc FROM donations`, (_, r) => resolve(r?.dc || 0)))
  ]).then(([visits, shares, donations, donationsCount]) => {
    res.json({ visits, shares, donations: donations || 0, donationsCount: donationsCount || 0 });
  });
});

// Enregistrer un partage
app.post('/api/track/share', (req, res) => {
  const { platform, share_url } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  db.run(`INSERT INTO shares (date, platform, share_url, ip) VALUES (?, ?, ?, ?)`,
    [new Date().toISOString(), platform, share_url, ip], (err) => {
      if (err) console.error(err);
      res.json({ success: true });
    });
});

// Enregistrer un don (à appeler depuis votre fonction payerShwary en cas de succès)
app.post('/api/admin/recordDonation', (req, res) => {
  const { amount, phone, transaction_id } = req.body;
  db.run(`INSERT INTO donations (date, amount, phone, transaction_id, status) VALUES (?, ?, ?, ?, ?)`,
    [new Date().toISOString(), amount, phone, transaction_id, 'completed'], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
});

// ========== ROUTE DE PAIEMENT (avec SDK Shwary) ==========
function normaliserTelephone(telephone) {
  let num = telephone.replace(/\s/g, '');
  if (num.startsWith('+')) num = num.substring(1);
  if (num.startsWith('0')) num = '243' + num.substring(1);
  if (!num.startsWith('243')) return null;
  return `+${num}`;
}

app.post('/api/payment/init', async (req, res) => {
  const { amount, phone } = req.body;
  const cleanPhone = normaliserTelephone(phone);
  if (!cleanPhone) {
    return res.status(400).json({ error: 'Numéro invalide. Utilisez 243XXXXXXXXX ou 0XXXXXXXXX' });
  }
  if (amount < 2900) {
    return res.status(400).json({ error: `Le montant minimum est de 2900 FC. Vous avez saisi ${amount} FC.` });
  }
  try {
    const transaction = await Shwary.payDRC(amount, cleanPhone);
    console.log('✅ Transaction réussie :', transaction);
    // Enregistrer dans la base
    db.run(`INSERT INTO donations (date, amount, phone, transaction_id, status) VALUES (?, ?, ?, ?, ?)`,
      [new Date().toISOString(), amount, cleanPhone, transaction.id, 'pending']);
    res.json({
      success: true,
      transaction_id: transaction.id,
      message: `Paiement de ${amount} FC initié. Vérifiez votre téléphone.`
    });
  } catch (error) {
    console.error('❌ Erreur Shwary:', error);
    if (error instanceof ValidationError) return res.status(400).json({ error: error.message });
    if (error instanceof AuthenticationError) return res.status(401).json({ error: 'Clés API invalides' });
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Webhook (à configurer avec Shwary)
app.post('/webhook/shwary', (req, res) => {
  // Mettre à jour le statut du don
  res.sendStatus(200);
});

// ========== DÉMARRAGE ==========
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur prêt sur http://localhost:${PORT}`);
});
