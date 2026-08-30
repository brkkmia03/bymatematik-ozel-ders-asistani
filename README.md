# bymatematik Özel Ders Asistanı

Özel matematik dersi veren öğretmenler için öğrenci, ders, ödev, sınav, yazılı hazırlığı, doküman, finans, veli iletişimi, bildirim ve rapor yönetim uygulaması.

## Bu sürüm

**Sürüm:** 1.0.0  
**Durum:** Yerel/offline-first üretim adayı

Bu paket gerçek çalışan istemci tarafı modüllerini içerir. Kullanıcı hesapları ve veriler tarayıcıda hesap bazlı olarak yerel saklanır. Gerçek e-posta doğrulama, şifre sıfırlama e-postası ve cihazlar arası bulut senkronizasyonu için ayrıca bir backend/Auth hizmeti (ör. Firebase, Supabase veya eşdeğeri) bağlanmalıdır.

## Başlıca özellikler

- Öğrenci ve veli yönetimi
- Gün/hafta/ay takvim ve ders planlama
- Ders öncesi özet, ders başlatma ve ders sonu kaydı
- Ödev yönetimi ve takip
- Konu/kazanım ilerlemesi
- Akademik gelişim, sınav/net grafikleri ve hedefler
- Yazılı hazırlık planları ve materyal görevleri
- Doküman ve URL merkezi
- Finans, ödeme ve ders paketi takibi
- WhatsApp hazır mesaj yönlendirmesi
- Bildirim ve görev merkezi
- Öğretmen / veli-öğrenci ayrımlı PDF raporları
- JSON yedekleme, geri yükleme ve hesap bazlı veri izolasyonu
- Aydınlık / karanlık / cihaz teması
- PIN tabanlı uygulama kilidi
- Mobil, tablet ve masaüstü responsive arayüz

## Yerel çalıştırma

### Gereksinimler

- Node.js 20 veya daha yeni bir LTS sürümü
- npm

### Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda Vite'ın gösterdiği yerel adresi açın. Varsayılan geliştirme portu `3000`'dir.

### Kontrol ve production build

```bash
npm run typecheck
npm run build
```

Başarılı build sonrasında çıktı `dist/` klasöründe oluşur.

## Veri ve güvenlik notu

Bu sürümde veriler tarayıcı `localStorage` alanında hesap kimliğine göre ayrılmış olarak tutulur. Parolalar düz metin tutulmaz; istemci tarafında SHA-256 özeti saklanır. Bu yapı kişisel kullanım ve offline-first çalışma için tasarlanmıştır ancak internet üzerinden çok kullanıcılı gerçek üretim ortamında tek başına güvenli kimlik doğrulama sistemi olarak değerlendirilmemelidir.

Gerçek üretim hesabı için sunucu taraflı kimlik doğrulama, e-posta doğrulama, şifre sıfırlama, erişim kuralları ve bulut veritabanı bağlanmalıdır.

## WhatsApp

`WhatsApp'tan Gönder` işlemi kayıtlı veli numarası ve hazırlanmış mesaj ile WhatsApp yazma ekranını açar. Uygulama mesajı otomatik göndermez; son gönderim kullanıcı tarafından WhatsApp içinde yapılır.

## PDF

Raporlar tarayıcının Unicode destekli yazdırma/PDF akışı üzerinden hazırlanır. Bu yöntem Türkçe karakterlerin (`ç, ğ, ı, İ, ö, ş, ü`) korunması için kullanılır.

## Marka

Uygulama içinde **bymatematik** markası ve uygun alanlarda Instagram hesabı **@bymatematiik** kullanılır. Mobil uygulama ikonu/splash görseli, kullanıcı tarafından sağlanacak nihai logo ile sonradan değiştirilebilir.

## Önemli production notu

Bu çalışma ortamında ağ erişimi nedeniyle `npm install` tamamlanamadığından nihai Vite bundle'ı burada üretilemedi. Kaynak dosyaları sözdizimi ve bağlantı seviyesinde kontrol edilmiştir. Yayınlamadan önce internet erişimli bir geliştirme ortamında `npm install && npm run check` komutunu çalıştırın.
