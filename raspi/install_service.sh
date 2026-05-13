#!/bin/bash

echo "🚀 Menginstal Lokatani Auto-start Service..."

# Copy file service ke direktori systemd
sudo cp lokatani.service /etc/systemd/system/lokatani.service

# Set file permissions
sudo chmod 644 /etc/systemd/system/lokatani.service

# Reload systemd
sudo systemctl daemon-reload

# Aktifkan service agar otomatis jalan saat booting
sudo systemctl enable lokatani.service

# Jalankan service sekarang juga
sudo systemctl start lokatani.service

echo "✅ Service berhasil diinstal dan dijalankan!"
echo "👉 Untuk mengecek status, ketik: sudo systemctl status lokatani.service"
echo "👉 Untuk melihat log, ketik: tail -f /var/log/lokatani_guard.log"
