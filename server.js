const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// MENGGUNAKAN PURE JAVASCRIPT VERSION
const tf = require("@tensorflow/tfjs");
const mobilenet = require("@tensorflow-models/mobilenet");
const Jimp = require("jimp");

const app = express();
const PORT = 3000;

// PASTIKAN FOLDER UPLOADS ADA
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// PERBAIKAN 1: Setup Multer agar menyimpan ekstensi file (.jpg / .png)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Simpan dengan nama: timestamp_namaAsli.jpg
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

const dbPath = path.join(__dirname, "database.json");
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

let aiModel;
async function loadAIModel() {
  console.log("⏳ Sedang memuat Model AI (MobileNet Pure JS)...");
  try {
    aiModel = await mobilenet.load();
    console.log("✅ Model AI berhasil dimuat! Server siap digunakan.");
  } catch (error) {
    console.error("❌ Gagal memuat model AI:", error);
  }
}
loadAIModel();

app.post("/api/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ status: "error", message: "Tidak ada gambar." });
    if (!aiModel) return res.status(503).json({ status: "error", message: "Model AI masih dimuat." });

    console.log(`Menerima gambar: ${req.file.originalname}, memproses...`);

    // PERBAIKAN 2: Image Processing yang lebih stabil untuk Jimp -> TFJS
    const image = await Jimp.read(req.file.path);
    image.resize(224, 224); // MobileNet sangat optimal di resolusi ini

    const numPixels = 224 * 224;
    const values = new Int32Array(numPixels * 3); // Harus Int32Array (bilangan bulat)
    const p = image.bitmap.data; // Data mentah RGBA dari Jimp

    for (let i = 0; i < numPixels; i++) {
      values[i * 3 + 0] = p[i * 4 + 0]; // Red
      values[i * 3 + 1] = p[i * 4 + 1]; // Green
      values[i * 3 + 2] = p[i * 4 + 2]; // Blue
      // Kita abaikan channel ke-4 (Alpha/Transparansi) karena AI hanya butuh RGB
    }

    const tensor = tf.tensor3d(values, [224, 224, 3], "int32");

    // AI MENEBAK GAMBAR
    const predictions = await aiModel.classify(tensor);

    tensor.dispose(); // Bersihkan memori

    // Simpan ke Database JSON
    const dbData = JSON.parse(fs.readFileSync(dbPath));
    const newRecord = {
      id: Date.now(),
      filename: req.file.originalname,
      ai_predictions: predictions,
      analyzed_at: new Date().toISOString(),
    };
    dbData.push(newRecord);
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));

    // Hapus file gambar setelah selesai agar tidak menumpuk
    fs.unlinkSync(req.file.path);

    res.json({ status: "success", message: "Analisis selesai", data: newRecord });
  } catch (error) {
    console.error("Error detail:", error);

    // Pastikan gambar yang gagal diproses tetap dihapus agar storage aman
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // PERBAIKAN 3: Kirimkan pesan error asli ke Browser agar mudah di-debug
    res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada server.",
      error_detail: error.message,
    });
  }
});

// ROUTE DATA MENTAH: Mengambil data JSON murni
app.get("/api/history/data", (req, res) => {
  const dbData = JSON.parse(fs.readFileSync(dbPath));
  res.json({ status: "success", total_data: dbData.length, data: dbData });
});

// ROUTE UI: Halaman History dengan UI Memukau + Akses JSON Mentah
app.get("/api/history", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Riwayat Analisis AI - Vision Analyzer</title>
        <!-- Google Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Phosphor Icons -->
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
                        colors: { brand: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 900: '#1e3a8a' } }
                    }
                }
            }
        </script>
        <style>
            body { background-color: #f8fafc; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 20px 20px; }
            .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
        </style>
    </head>
    <body class="min-h-screen text-slate-800 py-10 px-4 sm:px-6 lg:px-8 flex flex-col">
        
        <div class="max-w-4xl mx-auto w-full flex-grow">
            <!-- Header History -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
                <div class="flex items-center">
                    <a href="/" class="mr-4 p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors" title="Kembali ke Beranda">
                        <i class="ph ph-arrow-left text-2xl"></i>
                    </a>
                    <div>
                        <h1 class="text-2xl font-bold text-slate-900 flex items-center">
                            <i class="ph ph-database mr-2 text-brand-500"></i> Riwayat Analisis
                        </h1>
                        <p class="text-sm text-slate-500 mt-1" id="totalCount">Memuat data...</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <a href="/api/history/data" target="_blank" class="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center" title="Buka JSON murni di tab baru">
                        <i class="ph ph-brackets-curly mr-2"></i> API JSON
                    </a>
                    <button onclick="loadHistory()" class="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors flex items-center shadow-sm">
                        <i class="ph ph-arrows-clockwise mr-2"></i> Segarkan
                    </button>
                </div>
            </div>

            <!-- Loading State -->
            <div id="loadingHistory" class="flex flex-col items-center justify-center py-20">
                <i class="ph ph-spinner-gap text-4xl text-brand-500 animate-spin mb-4"></i>
                <p class="text-slate-500">Mengambil data dari database...</p>
            </div>

            <!-- Empty State -->
            <div id="emptyState" class="hidden flex-col items-center justify-center py-20 text-center">
                <div class="p-4 bg-slate-100 rounded-full mb-4">
                    <i class="ph ph-ghost text-5xl text-slate-400"></i>
                </div>
                <h3 class="text-lg font-semibold text-slate-700">Belum ada riwayat</h3>
                <p class="text-slate-500 mt-2 max-w-sm">Mulai unggah dan analisis gambar di halaman beranda untuk melihat riwayatnya di sini.</p>
                <a href="/" class="mt-6 px-6 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 transition-colors shadow-sm">
                    Mulai Analisis
                </a>
            </div>

            <!-- Grid Konten -->
            <div id="historyGrid" class="hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Kartu data akan dimuat di sini oleh JavaScript -->
            </div>

            <!-- Data Mentah (JSON) Block Global -->
            <div id="rawJsonContainer" class="hidden mt-12 mb-8 border-t border-slate-200 pt-8">
                <details class="group">
                    <summary class="text-sm text-slate-500 cursor-pointer hover:text-brand-600 font-medium list-none flex items-center justify-center bg-white py-2 px-4 rounded-full border border-slate-200 shadow-sm w-max mx-auto transition-colors">
                        <i class="ph ph-code mr-2 text-lg"></i> Lihat Semua Data Mentah (Global JSON)
                    </summary>
                    <div class="mt-4 relative">
                        <div class="absolute top-2 right-2 text-xs text-slate-400 font-mono">database.json</div>
                        <pre id="rawHistoryJson" class="p-4 bg-slate-900 text-emerald-400 text-xs sm:text-sm rounded-xl overflow-x-auto shadow-inner w-full max-h-96 overflow-y-auto"></pre>
                    </div>
                </details>
            </div>
        </div>

        <script>
            // Fungsi format tanggal
            function formatDate(isoString) {
                const date = new Date(isoString);
                return new Intl.DateTimeFormat('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }).format(date);
            }

            // Fungsi untuk memuat data dari API
            async function loadHistory() {
                const loading = document.getElementById('loadingHistory');
                const emptyState = document.getElementById('emptyState');
                const grid = document.getElementById('historyGrid');
                const totalCount = document.getElementById('totalCount');
                const rawJsonContainer = document.getElementById('rawJsonContainer');
                const rawHistoryJson = document.getElementById('rawHistoryJson');

                // Tampilkan loading, sembunyikan yang lain
                loading.classList.remove('hidden');
                loading.classList.add('flex');
                emptyState.classList.add('hidden');
                grid.classList.add('hidden');
                rawJsonContainer.classList.add('hidden');
                grid.innerHTML = '';

                try {
                    const response = await fetch('/api/history/data');
                    const result = await response.json();
                    
                    loading.classList.remove('flex');
                    loading.classList.add('hidden');

                    // Set Raw JSON Global
                    rawHistoryJson.innerText = JSON.stringify(result, null, 2);
                    rawJsonContainer.classList.remove('hidden');

                    if (result.total_data === 0) {
                        emptyState.classList.remove('hidden');
                        emptyState.classList.add('flex');
                        totalCount.innerText = "Belum ada gambar yang dianalisis.";
                        return;
                    }

                    totalCount.innerText = "Total " + result.total_data + " gambar dianalisis.";
                    
                    // Urutkan data dari yang terbaru
                    const sortedData = result.data.sort((a, b) => b.id - a.id);

                    let html = '';
                    sortedData.forEach(item => {
                        // Ambil prediksi terbaik (urutan pertama)
                        const topPrediction = item.ai_predictions[0];
                        const accuracy = (topPrediction.probability * 100).toFixed(1);
                        
                        html += \`
                            <div class="glass-card rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="flex items-center truncate max-w-[70%]">
                                        <div class="p-2 bg-slate-100 rounded-lg mr-3 shrink-0">
                                            <i class="ph ph-image text-slate-500 text-lg"></i>
                                        </div>
                                        <div class="truncate">
                                            <p class="text-sm font-semibold text-slate-800 truncate" title="\${item.filename}">\${item.filename}</p>
                                            <p class="text-xs text-slate-500 flex items-center mt-0.5">
                                                <i class="ph ph-clock mr-1"></i> \${formatDate(item.analyzed_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        \${accuracy}%
                                    </span>
                                </div>
                                
                                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p class="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Prediksi Teratas AI:</p>
                                    <p class="text-base font-bold text-brand-600 capitalize">\${topPrediction.className}</p>
                                    
                                    <details class="mt-3 group">
                                        <summary class="text-xs text-slate-500 cursor-pointer hover:text-brand-600 font-medium list-none flex items-center">
                                            <i class="ph ph-caret-down mr-1 transition-transform group-open:-rotate-180"></i> Lihat Detail & Data Mentah
                                        </summary>
                                        
                                        <!-- Prediksi Lainnya -->
                                        <div class="mt-2 space-y-2 pt-2 border-t border-slate-200">
                                            <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Prediksi Lainnya:</p>
                                            \${item.ai_predictions.slice(1).map(pred => \`
                                                <div class="flex justify-between items-center text-xs">
                                                    <span class="text-slate-600 capitalize truncate pr-2">\${pred.className}</span>
                                                    <span class="text-slate-400 font-mono">\${(pred.probability * 100).toFixed(1)}%</span>
                                                </div>
                                            \`).join('')}
                                        </div>

                                        <!-- JSON Mentah Khusus Item Ini -->
                                        <div class="mt-3 pt-3 border-t border-slate-200">
                                            <p class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">JSON Record:</p>
                                            <div class="bg-slate-900 rounded-lg p-3 overflow-x-auto shadow-inner max-h-40 overflow-y-auto relative">
                                                <pre class="text-emerald-400 text-[10px] font-mono m-0 whitespace-pre-wrap word-break">\${JSON.stringify(item, null, 2)}</pre>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        \`;
                    });

                    grid.innerHTML = html;
                    grid.classList.remove('hidden');

                } catch (error) {
                    console.error("Gagal memuat riwayat:", error);
                    loading.classList.remove('flex');
                    loading.classList.add('hidden');
                    grid.innerHTML = '<div class="col-span-full p-4 bg-red-50 text-red-600 rounded-xl text-center border border-red-100"><i class="ph ph-warning-circle text-2xl mb-2"></i><br>Gagal memuat data. Pastikan server berjalan dengan baik.</div>';
                    grid.classList.remove('hidden');
                }
            }

            // Muat data saat halaman pertama kali dibuka
            document.addEventListener('DOMContentLoaded', loadHistory);
        </script>
    </body>
    </html>
  `);
});

// UI MEMUKAU DENGAN TAILWIND CSS (HALAMAN UTAMA)
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Vision - Smart Image Analyzer</title>
        <!-- Google Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Phosphor Icons -->
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
                        colors: {
                            brand: { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 900: '#1e3a8a' }
                        }
                    }
                }
            }
        </script>
        <style>
            body { background-color: #f8fafc; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 20px 20px; }
            .glass-card { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
            .hide { display: none !important; }
            .drag-active { border-color: #3b82f6 !important; background-color: #eff6ff !important; }
        </style>
    </head>
    <body class="min-h-screen text-slate-800 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="text-center mb-10">
            <div class="inline-flex items-center justify-center p-3 bg-brand-500 rounded-2xl shadow-lg shadow-brand-500/30 mb-4">
                <i class="ph ph-brain text-4xl text-white"></i>
            </div>
            <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">AI Vision Analyzer</h1>
            <p class="text-slate-500 max-w-md mx-auto">Unggah gambar dan biarkan kecerdasan buatan menebak objek di dalamnya dengan akurasi tinggi.</p>
        </div>

        <!-- Main Card -->
        <div class="w-full max-w-xl glass-card rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 p-6 md:p-8 overflow-hidden relative">
            
            <form id="uploadForm" class="space-y-6">
                <!-- Dropzone Area -->
                <div id="dropzone" class="relative group border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:bg-slate-50 hover:border-brand-500 transition-all duration-300 cursor-pointer">
                    <input type="file" id="imageInput" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required>
                    
                    <div id="uploadPlaceholder" class="flex flex-col items-center justify-center space-y-3 pointer-events-none">
                        <div class="p-4 bg-brand-50 text-brand-500 rounded-full group-hover:scale-110 transition-transform duration-300">
                            <i class="ph ph-cloud-arrow-up text-4xl"></i>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-slate-700">Klik atau seret gambar ke sini</p>
                            <p class="text-xs text-slate-500 mt-1">Mendukung JPG, PNG, GIF</p>
                        </div>
                    </div>

                    <!-- Image Preview -->
                    <div id="previewContainer" class="hide w-full flex flex-col items-center relative z-20">
                        <img id="imagePreview" class="max-h-64 object-contain rounded-lg shadow-sm mb-4" src="" alt="Preview">
                        <p id="fileName" class="text-sm font-medium text-slate-600 bg-white px-3 py-1 rounded-full shadow-sm"></p>
                    </div>
                </div>

                <!-- Submit Button -->
                <button type="submit" id="submitBtn" class="w-full relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-brand-600 border border-transparent rounded-xl hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed">
                    <i class="ph ph-magic-wand mr-2 text-xl"></i>
                    <span>Analisis Gambar</span>
                </button>
            </form>

            <!-- Loading State -->
            <div id="loadingState" class="hide mt-8 flex flex-col items-center justify-center py-6">
                <i class="ph ph-spinner-gap text-4xl text-brand-500 animate-spin mb-4"></i>
                <p class="text-sm font-medium text-slate-600 animate-pulse">AI sedang berpikir memproses gambar...</p>
            </div>

            <!-- Results Section -->
            <div id="resultSection" class="hide mt-8 pt-6 border-t border-slate-100">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-slate-800 flex items-center">
                        <i class="ph ph-check-circle text-emerald-500 mr-2 text-xl"></i> Hasil Prediksi
                    </h3>
                </div>
                
                <div id="predictionsList" class="space-y-4">
                    <!-- Progress bars will be injected here -->
                </div>

                <!-- Raw JSON Toggle -->
                <details class="mt-6 group border border-slate-200 rounded-xl overflow-hidden">
                    <summary class="text-xs text-slate-600 cursor-pointer hover:bg-slate-50 bg-white p-3 font-medium list-none flex items-center justify-between transition-colors">
                        <span class="flex items-center"><i class="ph ph-code mr-2 text-lg text-slate-400 group-hover:text-brand-500"></i> Lihat Response Mentah (JSON)</span>
                        <i class="ph ph-caret-down text-slate-400 transition-transform group-open:-rotate-180"></i>
                    </summary>
                    <div class="bg-slate-900 relative">
                        <div class="absolute top-2 right-2 text-emerald-500/50 text-[10px] font-mono">response.data</div>
                        <pre id="rawJson" class="p-4 text-emerald-400 text-xs sm:text-sm overflow-x-auto shadow-inner max-h-64 overflow-y-auto"></pre>
                    </div>
                </details>
            </div>

            <!-- Error State -->
            <div id="errorState" class="hide mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-start">
                <i class="ph ph-warning-circle text-xl mr-3 mt-0.5"></i>
                <div>
                    <h4 class="font-semibold text-sm">Terjadi Kesalahan</h4>
                    <p id="errorMessage" class="text-xs mt-1 text-red-500"></p>
                </div>
            </div>

        </div>

        <!-- Footer Links -->
        <div class="mt-8 text-center">
            <a href="/api/history" class="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:border-brand-300">
                <i class="ph ph-database mr-2"></i> Lihat Database History
            </a>
        </div>

        <script>
            // Elemen DOM
            const imageInput = document.getElementById('imageInput');
            const dropzone = document.getElementById('dropzone');
            const uploadPlaceholder = document.getElementById('uploadPlaceholder');
            const previewContainer = document.getElementById('previewContainer');
            const imagePreview = document.getElementById('imagePreview');
            const fileName = document.getElementById('fileName');
            const form = document.getElementById('uploadForm');
            const submitBtn = document.getElementById('submitBtn');
            const loadingState = document.getElementById('loadingState');
            const resultSection = document.getElementById('resultSection');
            const predictionsList = document.getElementById('predictionsList');
            const rawJson = document.getElementById('rawJson');
            const errorState = document.getElementById('errorState');
            const errorMessage = document.getElementById('errorMessage');

            // Handle Preview Gambar
            imageInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        imagePreview.src = e.target.result;
                        fileName.innerText = file.name;
                        uploadPlaceholder.classList.add('hide');
                        previewContainer.classList.remove('hide');
                    }
                    reader.readAsDataURL(file);
                    
                    // Reset state
                    resultSection.classList.add('hide');
                    errorState.classList.add('hide');
                } else {
                    uploadPlaceholder.classList.remove('hide');
                    previewContainer.classList.add('hide');
                }
            });

            // Handle Drag & Drop Visuals
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-active'), false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-active'), false);
            });

            // Submit Form Data ke API
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if(!imageInput.files.length) return;

                // Set Loading UI
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="ph ph-spinner-gap animate-spin mr-2 text-xl"></i><span>Memproses...</span>';
                resultSection.classList.add('hide');
                errorState.classList.add('hide');
                loadingState.classList.remove('hide');

                const formData = new FormData();
                formData.append('image', imageInput.files[0]);

                try {
                    const response = await fetch('/api/analyze', { method: 'POST', body: formData });
                    const data = await response.json();
                    
                    loadingState.classList.add('hide');
                    
                    if(data.status === 'error') {
                        throw new Error(data.message || "Gagal memproses gambar");
                    }

                    // Render Hasil Sukses
                    renderPredictions(data.data.ai_predictions);
                    rawJson.innerText = JSON.stringify(data, null, 2);
                    resultSection.classList.remove('hide');

                } catch (err) {
                    loadingState.classList.add('hide');
                    errorState.classList.remove('hide');
                    errorMessage.innerText = err.message;
                } finally {
                    // Reset Button UI
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="ph ph-magic-wand mr-2 text-xl"></i><span>Analisis Gambar</span>';
                }
            });

            // Fungsi membuat Progress Bar HTML
            function renderPredictions(predictions) {
                let html = '';
                predictions.forEach((item, index) => {
                    const percentage = (item.probability * 100).toFixed(1);
                    // Warna bar berbeda berdasarkan urutan (tertinggi lebih menonjol)
                    const barColor = index === 0 ? 'bg-brand-500' : (index === 1 ? 'bg-brand-400' : 'bg-brand-300');
                    
                    html += '<div class="relative">';
                    html += '<div class="flex justify-between items-end mb-1">';
                    html += '<span class="text-sm font-semibold text-slate-700 capitalize">' + item.className + '</span>';
                    html += '<span class="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">' + percentage + '%</span>';
                    html += '</div>';
                    html += '<div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">';
                    html += '<div class="' + barColor + ' h-2.5 rounded-full transition-all duration-1000 ease-out" style="width: 0%" data-width="' + percentage + '%"></div>';
                    html += '</div>';
                    html += '</div>';
                });
                
                predictionsList.innerHTML = html;

                // Animasikan bar
                setTimeout(() => {
                    const bars = document.querySelectorAll('#predictionsList > div > div > div');
                    bars.forEach(bar => {
                        bar.style.width = bar.getAttribute('data-width');
                    });
                }, 50);
            }
        </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`🚀 Server di http://localhost:${PORT}`));
