# bymatematik Özel Ders Asistanı — Final Sürüm Notları

## Sürüm

1.0.0

## Tamamlanan ana modüller

- Hesap bazlı yerel giriş/kayıt ve veri izolasyonu
- Öğretmen profili, marka ve mesaj imzası
- Öğrenci/veli CRUD ve arşivleme
- Günlük/haftalık/aylık takvim
- Ders çakışma kontrolü, erteleme ve durum yönetimi
- Ders öncesi özet, ders kronometresi ve ders sonu formu
- Ödev takibi ve gecikme durumları
- Konu/kazanım ilerleme durumları
- Akademik gelişim, sınav/net grafikleri ve zayıf konu analizi
- Çoklu akademik hedef sistemi
- Yazılı hazırlık planları, bağlı görev ve dokümanlar
- Doküman/URL merkezi
- Finans, ödeme, alacak ve paket ders sistemi
- WhatsApp veli mesaj şablonları ve yönlendirme
- Bildirim/görev merkezi
- Öğretmen ve veli/öğrenci ayrımlı raporlar
- Türkçe karakter korumalı PDF/yazdırma akışı
- JSON yedekleme, bütünlük kontrolü ve güvenlik anlık görüntüleri
- Evrensel arama
- Aydınlık, karanlık ve sistem teması
- PIN kilidi ve otomatik kilitleme seçenekleri
- Mobil/tablet/masaüstü responsive arayüz
- Toast başarı/uyarı/hata bildirimleri ve hata kurtarma ekranı

## Özellikle korunan veri kuralları

- Ders tamamlamanın iki kez ücret/paket düşümü üretmesi engellenir.
- Eski ders ücretleri sonradan öğrenci ücreti değişse bile geriye dönük değişmez.
- Ertelenen ders geçmişten silinmez.
- Öğrenci varsayılan olarak kalıcı silinmez; arşivlenir.
- Finans kayıtlarında iptal/düzeltme geçmişi korunur.
- Aynı anda birden fazla aktif paket oluşması engellenir.
- Öğretmene özel notlar veli/öğrenci raporuna dahil edilmez.
- Hesaplar aynı tarayıcıda birbirinin verilerini göremez.

## Bilinen sınır

Gerçek bulut hesabı bu pakette bağlı değildir. E-posta doğrulama, şifre sıfırlama e-postası ve farklı cihazlar arasında canlı senkronizasyon için sunucu tabanlı Auth + veritabanı entegrasyonu gerekir.

Bu durum arayüzde ve README dosyasında açıkça belirtilmiştir; yapılmış gibi gösterilmemiştir.

## Yayın öncesi zorunlu kontrol

İnternet erişimli geliştirme ortamında:

```bash
npm install
npm run check
```

çalıştırılmalı; ardından ana akışlar tarayıcıda uçtan uca manuel test edilmelidir.
