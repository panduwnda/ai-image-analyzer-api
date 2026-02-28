🤖 AI Smart Image Analyzer API

Sebuah proyek REST API yang mengintegrasikan Web Backend dengan Machine Learning. API ini menerima file gambar, melakukan image processing, dan menggunakan model Deep Learning MobileNet (TensorFlow.js) untuk mengklasifikasikan objek di dalam gambar secara otomatis. Data hasil analisis kemudian disimpan ke dalam database.

📸 Screenshot Aplikasi

(Hapus tulisan ini, lalu tekan Ctrl + V di sini untuk mem-paste screenshot aplikasimu)

🚀 Tech Stack

Backend: Node.js, Express.js

Machine Learning: TensorFlow.js (@tensorflow/tfjs), MobileNet Model

Image Processing: Jimp (Konversi piksel dan resize gambar)

Database: Local JSON File DB (Menerapkan konsep NoSQL)

Lainnya: Multer (File Upload Handling)

📌 Fitur Utama (Sesuai Kualifikasi)

REST API: Menyediakan arsitektur Client-Server dengan endpoint POST dan GET.

Machine Learning Integration: Mengubah gambar matriks piksel (RGB) menjadi tensor 3D untuk diproses oleh AI pre-trained model.

Database Integration: Menyimpan riwayat hasil deteksi AI dan timestamp secara otomatis.

Single Page Application UI: Antarmuka interaktif yang berkomunikasi dengan API menggunakan fetch (tanpa reload halaman).

🛠️ Cara Menjalankan (How to Run)

Pastikan Node.js sudah terinstal di komputer.

Clone repository ini:

git clone [https://github.com/panduwnda/ai-image-analyzer-api.git](https://github.com/panduwnda/ai-image-analyzer-api.git)


Masuk ke direktori dan install dependensi:

cd ai-image-analyzer-api
npm install


Jalankan server:

node server.js


Buka http://localhost:3000 di browser untuk menguji UI interaktifnya.
