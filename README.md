# AI Smart Image Analyzer API

Sebuah proyek REST API yang mengintegrasikan Web Backend dengan Machine Learning. API ini menerima file gambar, melakukan *image processing*, dan menggunakan model Deep Learning **MobileNet (TensorFlow.js)** untuk mengklasifikasikan objek di dalam gambar secara otomatis. Data hasil analisis kemudian disimpan ke dalam database.

## 🚀 Tech Stack
- **Backend:** Node.js, Express.js
- **Machine Learning:** TensorFlow.js (`@tensorflow/tfjs-node`), MobileNet Model
- **Database:** Local JSON File DB (NoSQL Concept)
- **Lainnya:** Multer (File Upload Handling)

## 📌 Fitur Utama (Sesuai Kualifikasi AI Software Engineer)
1. **REST API:** Menyediakan endpoint untuk integrasi frontend/client.
2. **Machine Learning & Image Processing:** Mengubah gambar menjadi tensor dan diproses oleh AI pre-trained model.
3. **Database Integration:** Menyimpan riwayat hasil deteksi AI.

## 🛠️ Cara Menjalankan (How to Run)
1. Clone repository ini.
2. Jalankan `npm install` untuk mengunduh dependensi dan model AI.
3. Jalankan `node server.js`.
4. Buka `http://localhost:3000` di browser untuk menguji UI interaktifnya.
