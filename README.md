# 🤖 AI Smart Image Analyzer API

Sebuah proyek REST API yang mengintegrasikan Web Backend dengan Machine Learning. API ini menerima file gambar, melakukan *image processing*, dan menggunakan model Deep Learning **MobileNet (TensorFlow.js)** untuk mengklasifikasikan objek di dalam gambar secara otomatis. Data hasil analisis kemudian disimpan ke dalam database.

## 📸 Screenshot Aplikasi

*(Hapus teks ini dan tekan Ctrl+V untuk mem-paste screenshot aplikasimu di sini)*

## 🚀 Tech Stack
- **Backend:** Node.js, Express.js
- **Machine Learning:** TensorFlow.js (`@tensorflow/tfjs`), MobileNet Model
- **Image Processing:** Jimp (Konversi piksel dan resize gambar)
- **Database:** Local JSON File DB (Menerapkan konsep NoSQL)
- **Lainnya:** Multer (File Upload Handling)

## 📌 Fitur Utama (Sesuai Kualifikasi)
1. **REST API:** Menyediakan arsitektur *Client-Server* dengan endpoint POST dan GET.
2. **Machine Learning Integration:** Mengubah gambar matriks piksel (RGB) menjadi *tensor* 3D untuk diproses oleh AI pre-trained model.
3. **Database Integration:** Menyimpan riwayat hasil deteksi AI dan *timestamp* secara otomatis.
4. **Single Page Application UI:** Antarmuka interaktif yang berkomunikasi dengan API menggunakan `fetch` (tanpa reload halaman).

## 🛠️ Cara Menjalankan (How to Run)
1. Pastikan Node.js sudah terinstal di komputer.
2. Clone repository ini:
   ```bash
   git clone [https://github.com/panduwnda/ai-image-analyzer-api.git](https://github.com/panduwnda/ai-image-analyzer-api.git)
   ```
3. Masuk ke direktori dan install dependensi:
   ```bash
   cd ai-image-analyzer-api
   npm install
   ```
4. Jalankan server:
   ```bash
   node server.js
   ```
5. Buka `http://localhost:3000` di browser untuk menguji UI interaktifnya.
