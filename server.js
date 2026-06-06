const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Batasi kapasitas json agar bisa menerima ribuan proxy sekaligus tanpa crash
app.use(express.json({ limit: '50mb' }));

// Hubungkan backend dengan folder tampilan (public)
app.use(express.static(path.join(__dirname, 'public')));

// Fungsi Utama Pengecek Proxy Individu
async function checkProxy(proxyLine) {
    const cleanLine = proxyLine.trim();
    if (!cleanLine) return null;

    const parts = cleanLine.split(':');
    let config = { timeout: 5000 }; // Batas tunggu: 5 detik
    let host, port, user, pass;

    // FORMAT 1: IP:PORT (Proxy Publik / Tanpa Auth)
    if (parts.length === 2) {
        host = parts[0];
        port = parseInt(parts[1]);
        config.proxy = { protocol: 'http', host, port };
    } 
    // FORMAT 2: Cek apakah isi 4 bagian
    else if (parts.length === 4) {
        // Kita cek apakah bagian ketiga (parts[2]) mengandung domain (ada titik/domain seperti niceproxy.io)
        // Jika iya, berarti ini format tipe USER:PASS:HOST:PORT
        if (parts[2].includes('.') && isNaN(parts[2])) {
            user = parts[0];
            pass = parts[1];
            host = parts[2];
            port = parseInt(parts[3]);
        } 
        // Jika tidak, berarti ini format standar biasa: IP:PORT:USER:PASS
        else {
            host = parts[0];
            port = parseInt(parts[1]);
            user = parts[2];
            pass = parts[3];
        }

        config.proxy = {
            protocol: 'http',
            host: host,
            port: port,
            auth: { username: user, password: pass }
        };
    } 
    // Format Tidak Dikenali
    else {
        return { line: cleanLine, status: 'DEAD', reason: 'Format Salah' };
    }

    try {
        // Tembak target untuk uji koneksi proxy
        await axios.get('http://httpbin.org/ip', config);
        return { line: cleanLine, status: 'ALIVE' };
    } catch (err) {
        return { line: cleanLine, status: 'DEAD' };
    }
}

// API Endpoint: Tempat Frontend mengirimkan list proxy
app.post('/api/check', async (req, res) => {
    const { proxies } = req.body;
    
    if (!proxies || !Array.isArray(proxies)) {
        return res.status(400).json({ error: 'Format data proxy tidak valid' });
    }

    console.log(`\n[ RECEIVED ] Menerima ${proxies.length} proxy dari browser.`);
    console.log(`[ RUNNING  ] Memulai pengecekan paralel (asynchronous)...`);

    // Jalankan pengecekan massal secara serentak (Ngebut)
    const promises = proxies.map(line => checkProxy(line));
    const results = await Promise.all(promises);
    
    // Saring data hasil agar tidak ada nilai null nyasar
    const validResults = results.filter(r => r !== null);
    
    const aliveCount = validResults.filter(r => r.status === 'ALIVE').length;
    console.log(`[ FINISHED ] Pengecekan selesai. Terdeteksi Hidup: ${aliveCount} | Mati: ${validResults.length - aliveCount}`);

    res.json(validResults);
});

// Jalankan Server Web Lokal
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 PROPROXY BACKEND SERVER READY!`);
    console.log(`👉 Silakan buka browser Anda di: http://localhost:${PORT}`);
    console.log(`==================================================`);
});