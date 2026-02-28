# 🤖 AI Smart Image Analyzer API

Sebuah proyek REST API yang mengintegrasikan Web Backend dengan Machine Learning. API ini menerima file gambar, melakukan *image processing*, dan menggunakan model Deep Learning **MobileNet (TensorFlow.js)** untuk mengklasifikasikan objek di dalam gambar secara otomatis. Data hasil analisis kemudian disimpan ke dalam database.

## 📸 Screenshot Aplikasi
1. **Halaman Utama**
<img width="1920" height="1978" alt="screencapture-localhost-3000-2026-03-01-02_06_01" src="https://github.com/user-attachments/assets/f394eb97-08ef-46c6-9107-0899a5e6320b" />

2. **Database History**
<img width="1920" height="1347" alt="screencapture-localhost-3000-api-history-2026-03-01-03_50_54" src="https://github.com/user-attachments/assets/e70ee1be-02bb-4d6f-a82c-856ce5212603" />

3. **API JSON**
<img width="1920" height="885" alt="screencapture-localhost-3000-api-history-data-2026-03-01-03_51_05" src="https://github.com/user-attachments/assets/4e0a2760-4935-48f1-8ce9-fc019b28ea00" />

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
