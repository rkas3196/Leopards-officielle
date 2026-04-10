// ========== DONNÉES ==========
let nbSupporters = localStorage.getItem('nbSupporters') ? parseInt(localStorage.getItem('nbSupporters')) : 12847;
let totalCollected = localStorage.getItem('totalCollected') ? parseInt(localStorage.getItem('totalCollected')) : 1284700;

const compteurElem = document.getElementById('compteur');
const totalFcElem = document.getElementById('totalFc');

// ========== FONCTIONS D'AFFICHAGE ==========
function animateNumber(element, start, end, duration) {
    let startTime = null;
    const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.innerText = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
        else element.innerText = end.toLocaleString();
    };
    requestAnimationFrame(step);
}

function mettreAJourAffichage() {
    animateNumber(compteurElem, parseInt(compteurElem.innerText.replace(/,/g,'')) || 0, nbSupporters, 800);
    totalFcElem.innerText = `Total collecté : ${totalCollected.toLocaleString()} FC`;
    localStorage.setItem('nbSupporters', nbSupporters);
    localStorage.setItem('totalCollected', totalCollected);
}

// ========== PAIEMENT AVEC SHWARY ==========
async function payerShwary(montant) {
    // 1. Demander le numéro Mobile Money à l'utilisateur
    const phone = prompt("📱 Entrez votre numéro Mobile Money (ex: 243972105724) :");
    if (!phone) return;

    // 2. Nettoyer le numéro (enlever les espaces, s'assurer qu'il commence par 243)
    let cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    if (!cleanPhone.startsWith('243')) {
        alert("Le numéro doit commencer par 243 (ex: 243972105724)");
        return;
    }

    // 3. Afficher un message de chargement
    const loader = document.createElement('div');
    loader.innerHTML = '<div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:10001;"><div style="background:#1a1f2e; padding:30px; border-radius:20px; text-align:center;"><i class="fas fa-spinner fa-spin" style="font-size:3rem; color:#f7d117;"></i><p style="margin-top:15px; color:white;">Initialisation du paiement...</p></div></div>';
    document.body.appendChild(loader);

    try {
        // 4. Appeler votre serveur local (endpoint /api/payment/init)
        const response = await fetch('http://localhost:3000/api/payment/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: montant, phone: cleanPhone })
        });

        const result = await response.json();
        loader.remove();

        if (result.success) {
            alert(`✅ Paiement initié !\n💰 Montant : ${montant} FC\n📱 Téléphone : ${cleanPhone}\nVérifiez votre téléphone et confirmez le paiement.`);
            // Optionnel : recharger les statistiques
            mettreAJourAffichage(); // si cette fonction existe
        } else {
            alert(`❌ Erreur : ${result.error}`);
        }
    } catch (error) {
        loader.remove();
        alert("❌ Erreur de connexion au serveur. Vérifiez que le serveur est démarré (node server.js).");
        console.error(error);
    }
}










// ========== PARTAGE ==========
function partager(platform) {
    const url = encodeURIComponent(window.location.href);
    const texte = encodeURIComponent("Soutenez les Léopards de la RDC ! 🇨🇩 1000FC ou 500FC pour des souvenirs exclusifs.");
    let shareLink = '';
    switch(platform) {
        case 'whatsapp': shareLink = `https://api.whatsapp.com/send?text=${texte}%20${url}`; break;
        case 'facebook': shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
        case 'twitter': shareLink = `https://twitter.com/intent/tweet?text=${texte}&url=${url}`; break;
        default: return;
    }
    window.open(shareLink, '_blank');
}

function partageNatif() {
    if (navigator.share) {
        navigator.share({
            title: 'Léopards Unis - Soutien RDC',
            text: 'Soutenez nos Léopards !',
            url: window.location.href
        }).catch(err => console.log('Erreur partage:', err));
    } else {
        alert('Utilisez WhatsApp, Facebook ou Twitter pour partager.');
    }
}

// ========== MENU DÉROULANT ==========
const menuBtn = document.getElementById('menuBtn');
const menuDropdown = document.getElementById('menuDropdown');

if (menuBtn && menuDropdown) {
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => {
        menuDropdown.classList.remove('show');
    });
}

// ========== ATTACHER LES ÉVÉNEMENTS ==========
document.addEventListener('DOMContentLoaded', () => {
    mettreAJourAffichage();
   
    // Boutons de partage footer
    const wa = document.getElementById('shareWhatsApp');
    const fb = document.getElementById('shareFacebook');
    const tw = document.getElementById('shareTwitter');
    const nat = document.getElementById('shareNative');
    if (wa) wa.addEventListener('click', (e) => { e.preventDefault(); partager('whatsapp'); });
    if (fb) fb.addEventListener('click', (e) => { e.preventDefault(); partager('facebook'); });
    if (tw) tw.addEventListener('click', (e) => { e.preventDefault(); partager('twitter'); });
    if (nat) nat.addEventListener('click', (e) => { e.preventDefault(); partageNatif(); });
   
    // Boutons de partage du menu
    const waMenu = document.getElementById('shareWhatsAppMenu');
    const fbMenu = document.getElementById('shareFacebookMenu');
    const twMenu = document.getElementById('shareTwitterMenu');
    const natMenu = document.getElementById('shareNativeMenu');
    if (waMenu) waMenu.addEventListener('click', (e) => { e.preventDefault(); partager('whatsapp'); });
    if (fbMenu) fbMenu.addEventListener('click', (e) => { e.preventDefault(); partager('facebook'); });
    if (twMenu) twMenu.addEventListener('click', (e) => { e.preventDefault(); partager('twitter'); });
    if (natMenu) natMenu.addEventListener('click', (e) => { e.preventDefault(); partageNatif(); });
   
    // Animation d'apparition des cartes
    document.querySelectorAll('.card, .pack').forEach((el, idx) => {
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.4s ease';
            el.style.opacity = '1';
        }, idx * 100);
    });
});

// ========== ESPACE ADMINISTRATION COMPLET ==========
// Données par défaut
let adminPacks = JSON.parse(localStorage.getItem('adminPacks')) || [
    { price: 1000, benefits: ["5 photos HD", "Fond écran smartphone", "Reçu numérique"] },
    { price: 500, benefits: ["10 photos HD", "Fonds PC + Mobile", "Certificat nominatif", "Vidéo remerciement"] }
];

let adminPhotos = JSON.parse(localStorage.getItem('adminPhotos')) || [
    { url: "mbemba.jpg", caption: "Chancel Mbemba – Capitaine héroïque", category: "joueurs" },
    { url: "cedrick.png", caption: "Cédric Bakambu – La griffe du léopard", category: "joueurs" },
    { url: "kakuta.jpg", caption: "Gaël Kakuta – Magie et détermination", category: "joueurs" },
    { url: "desabre.png", caption: "Sélectionneur Congolais", category: "joueurs" },
    { url: "herman.jpg", caption: "Herman Amisi - Kinshasa", category: "temoignages" },
    { url: "ocean.jpg", caption: "Ocean Tambwe - Kinshasa", category: "temoignages" }
];

let adminTexts = JSON.parse(localStorage.getItem('adminTexts')) || {
    title: "🇨🇩 LÉOPARDS UNIS 🇨🇩",
    slogan: "1000 FC ou 500 FC, tous ensemble derrière nos Léopards !",
    heroMessage: "#AllezRDC 🔥 #NosLéopards"
};

let adminLinks = JSON.parse(localStorage.getItem('adminLinks')) || {
    whatsapp: "243972105724",
    email: "support@leopardsunis.cd",
    phone: "+243972105724",
    contact: "contact@rkas3196@gmail.com"
};

// Ouvrir l'admin depuis le menu
const adminMenuBtn = document.getElementById('adminMenuAccess');
if (adminMenuBtn) {
    adminMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const password = prompt("🔐 Mot de passe administrateur :");
        if (password === "Leopards2025") {
            document.getElementById('adminPanel').classList.add('show');
            chargerToutesDonneesAdmin();
            chargerGraphiqueAdmin();
        } else if (password) alert("❌ Mot de passe incorrect");
    });
}

// Fermer l'admin
document.getElementById('closeAdminPanel')?.addEventListener('click', () => {
    document.getElementById('adminPanel').classList.remove('show');
});

// Navigation entre onglets
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.admin-tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
});

// Charger toutes les données
function chargerToutesDonneesAdmin() {
    chargerStatsAdmin();
    chargerPacksAdmin();
    chargerPhotosAdmin();
    chargerTextesAdmin();
    chargerLiensAdmin();
}

function chargerStatsAdmin() {
    const supporters = localStorage.getItem('nbSupporters') || 12847;
    const collecte = localStorage.getItem('totalCollected') || 1284700;
    const objectif = localStorage.getItem('objectif') || 10000000;
    const pourcentage = Math.floor((collecte / objectif) * 100);
   
    document.getElementById('statSupportersAdmin').innerText = parseInt(supporters).toLocaleString();
    document.getElementById('statCollecteAdmin').innerText = parseInt(collecte).toLocaleString() + ' FC';
    document.getElementById('statObjectifAdmin').innerText = pourcentage + '%';
   
    document.getElementById('adminSupporters').value = supporters;
    document.getElementById('adminCollecte').value = collecte;
    document.getElementById('adminObjectif').value = objectif;
   
    // Dons du jour
    const donations = JSON.parse(localStorage.getItem('donations') || '[]');
    const today = new Date().toLocaleDateString();
    const todayTotal = donations.filter(d => d.date.includes(today)).reduce((s, d) => s + d.amount, 0);
    document.getElementById('statTodayAdmin').innerText = todayTotal.toLocaleString() + ' FC';
}

function chargerPacksAdmin() {
    const container = document.getElementById('packsList');
    container.innerHTML = adminPacks.map((pack, idx) => `
        <div class="admin-list-item">
            <div><strong style="color: #f7d117;">${pack.price} FC</strong><br>${pack.benefits.join(', ')}</div>
            <div>
                <button class="admin-btn" style="padding: 5px 15px; font-size: 0.8rem;" onclick="editerPack(${idx})">✏️ Modifier</button>
                <button class="admin-btn" style="background: #dc3545; padding: 5px 15px; font-size: 0.8rem;" onclick="supprimerPack(${idx})">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

function editerPack(index) {
    const pack = adminPacks[index];
    const benefitsStr = pack.benefits.join('\n');
    const newPrice = prompt("Nouveau prix (FC) :", pack.price);
    if (newPrice) {
        const newBenefits = prompt("Avantages (un par ligne) :", benefitsStr);
        if (newBenefits) {
            adminPacks[index] = { price: parseInt(newPrice), benefits: newBenefits.split('\n') };
            localStorage.setItem('adminPacks', JSON.stringify(adminPacks));
            chargerPacksAdmin();
            alert("✅ Pack modifié ! Rafraîchissez la page pour voir les changements.");
        }
    }
}

function supprimerPack(index) {
    if (confirm("Supprimer ce pack ?")) {
        adminPacks.splice(index, 1);
        localStorage.setItem('adminPacks', JSON.stringify(adminPacks));
        chargerPacksAdmin();
        alert("✅ Pack supprimé !");
    }
}

document.getElementById('addPackBtn')?.addEventListener('click', () => {
    const price = prompt("Prix du nouveau pack (FC) :");
    if (price) {
        const benefits = prompt("Avantages (un par ligne) :");
        if (benefits) {
            adminPacks.push({ price: parseInt(price), benefits: benefits.split('\n') });
            localStorage.setItem('adminPacks', JSON.stringify(adminPacks));
            chargerPacksAdmin();
            alert("✅ Pack ajouté !");
        }
    }
});

function chargerPhotosAdmin() {
    const container = document.getElementById('photosList');
    container.innerHTML = adminPhotos.map((photo, idx) => `
        <div class="admin-list-item">
            <div><img src="${photo.url}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 10px;" onerror="this.src='https://placehold.co/60x60'"><br><small>${photo.caption.substring(0, 50)}</small></div>
            <div>
                <button class="admin-btn" style="padding: 5px 15px; font-size: 0.8rem;" onclick="editerPhoto(${idx})">✏️ Modifier</button>
                <button class="admin-btn" style="background: #dc3545; padding: 5px 15px; font-size: 0.8rem;" onclick="supprimerPhoto(${idx})">🗑️ Supprimer</button>
            </div>
        </div>
    `).join('');
}

let currentPhotoIndex = null;
function editerPhoto(index) { currentPhotoIndex = index; ouvrirModalPhoto(adminPhotos[index]); }
function supprimerPhoto(index) { if (confirm("Supprimer cette photo ?")) { adminPhotos.splice(index, 1); localStorage.setItem('adminPhotos', JSON.stringify(adminPhotos)); chargerPhotosAdmin(); } }

document.getElementById('addPhotoBtn')?.addEventListener('click', () => { currentPhotoIndex = null; ouvrirModalPhoto(null); });
document.getElementById('saveImageBtn')?.addEventListener('click', () => {
    const url = document.getElementById('imageUrl').value;
    const caption = document.getElementById('imageCaption').value;
    const category = document.getElementById('imageCategory').value;
    if (!url) { alert("URL de l'image requise"); return; }
    if (currentPhotoIndex !== null) adminPhotos[currentPhotoIndex] = { url, caption, category };
    else adminPhotos.push({ url, caption, category });
    localStorage.setItem('adminPhotos', JSON.stringify(adminPhotos));
    chargerPhotosAdmin();
    document.getElementById('imageModal').classList.remove('show');
    alert("✅ Photo sauvegardée !");
});

function ouvrirModalPhoto(photo) {
    document.getElementById('imageUrl').value = photo?.url || '';
    document.getElementById('imageCaption').value = photo?.caption || '';
    document.getElementById('imageCategory').value = photo?.category || 'joueurs';
    document.getElementById('imageModal').classList.add('show');
}
document.getElementById('closeImageModal')?.addEventListener('click', () => document.getElementById('imageModal').classList.remove('show'));

function chargerTextesAdmin() {
    document.getElementById('textTitle').value = adminTexts.title;
    document.getElementById('textSlogan').value = adminTexts.slogan;
    document.getElementById('textHero').value = adminTexts.heroMessage;
}

function chargerLiensAdmin() {
    document.getElementById('linkWhatsApp').value = adminLinks.whatsapp;
    document.getElementById('linkEmail').value = adminLinks.email;
    document.getElementById('linkPhone').value = adminLinks.phone;
    document.getElementById('linkContact').value = adminLinks.contact;
}

document.getElementById('saveStatsBtn')?.addEventListener('click', () => {
    localStorage.setItem('nbSupporters', document.getElementById('adminSupporters').value);
    localStorage.setItem('totalCollected', document.getElementById('adminCollecte').value);
    localStorage.setItem('objectif', document.getElementById('adminObjectif').value);
    chargerStatsAdmin();
    mettreAJourAffichage();
    alert("✅ Statistiques mises à jour !");
});

document.getElementById('saveTextsBtn')?.addEventListener('click', () => {
    adminTexts = { title: document.getElementById('textTitle').value, slogan: document.getElementById('textSlogan').value, heroMessage: document.getElementById('textHero').value };
    localStorage.setItem('adminTexts', JSON.stringify(adminTexts));
    document.querySelector('h1').innerHTML = adminTexts.title;
    document.querySelector('.slogan').innerHTML = adminTexts.slogan;
    document.querySelector('.hero-overlay h2').innerHTML = adminTexts.heroMessage;
    alert("✅ Textes mis à jour !");
});

document.getElementById('saveLinksBtn')?.addEventListener('click', () => {
    adminLinks = { whatsapp: document.getElementById('linkWhatsApp').value, email: document.getElementById('linkEmail').value, phone: document.getElementById('linkPhone').value, contact: document.getElementById('linkContact').value };
    localStorage.setItem('adminLinks', JSON.stringify(adminLinks));
    alert("✅ Liens mis à jour !");
});

document.getElementById('exportCSVBtn')?.addEventListener('click', () => {
    const donations = JSON.parse(localStorage.getItem('donations') || '[]');
    let csv = "Date,Montant (FC),Téléphone\n" + donations.map(d => `${d.date},${d.amount},${d.phone || 'N/A'}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dons_leopards_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
});

document.getElementById('exportStatsBtn')?.addEventListener('click', () => {
    const supporters = localStorage.getItem('nbSupporters') || 0;
    const collecte = localStorage.getItem('totalCollected') || 0;
    const objectif = localStorage.getItem('objectif') || 10000000;
    let csv = `Statistique,Valeur\nSupporters,${supporters}\nCollecte totale,${collecte}\nObjectif,${objectif}\nPourcentage,${Math.floor((collecte/objectif)*100)}%`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stats_leopards_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
});

document.getElementById('resetDataBtn')?.addEventListener('click', () => {
    if (confirm("⚠️ RÉINITIALISATION TOTALE ! Toutes les données seront effacées. Confirmez ?")) {
        localStorage.clear();
        location.reload();
    }
});

function chargerGraphiqueAdmin() {
    const ctx = document.getElementById('adminChart')?.getContext('2d');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'line',
            data: { labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'], datasets: [{ label: 'Dons (FC)', data: [250000, 320000, 410000, 500000, 480000, 600000], borderColor: '#f7d117', backgroundColor: 'rgba(247,209,23,0.1)', fill: true }] },
            options: { responsive: true, maintainAspectRatio: true }
        });
    }
}

// Appliquer les textes au chargement
function appliquerTextesSauvegardes() {
    document.querySelector('h1').innerHTML = adminTexts.title;
    document.querySelector('.slogan').innerHTML = adminTexts.slogan;
    const heroH2 = document.querySelector('.hero-overlay h2');
    if (heroH2) heroH2.innerHTML = adminTexts.heroMessage;
}
appliquerTextesSauvegardes();
function afficherOnglet(ongletId) {
    // Cacher tous les contenus
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // Afficher le contenu sélectionné
    const tabContent = document.getElementById(`tab-${ongletId}`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    // Mettre à jour le style des boutons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}






