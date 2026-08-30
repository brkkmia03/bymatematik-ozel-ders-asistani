# bymatematik Özel Ders Asistanı — QA Düzeltmeleri v1.0.1

Bu sürüm, Windows üzerinde yapılan gerçek kullanıcı akışı testlerinde bulunan sorunların toplu düzeltme turudur.

## Düzeltilen kritik akışlar
- Ders sonu `Kaydet & Veli Raporuna Geç` işleminde WhatsApp/veli raporu modalının anında kapanmasına neden olan modal kapanış sırası düzeltildi.
- Ders sonu ödev seçeneği varsayılan olarak kapalı hale getirildi; kullanıcı istemeden ödev oluşmuyor.
- Ders sonu formundaki örnek/sahte kaynak, soru, not, ödev ve değerlendirme verileri kaldırıldı.
- Canlı ders kronometresindeki gerçek geçen süre ders sonu formuna aktarılıyor.
- Ders sonu konusu öğrencinin kendi sınıf müfredatındaki gerçek konu ile eşleştirilerek `İşleniyor` durumuna geçiriliyor; konu hakimiyeti ve soru sayısı aynı kayda yazılıyor.
- Ödeme formundaki sabit 3200 TL kaldırıldı; tahsilat açıldığında öğrencinin gerçek bekleyen bakiyesi öneriliyor.
- Sınav sonucu formundaki demo sınav adı, yayın, D/Y/B, hedef, yanlış konu ve öğretmen notu kaldırıldı.
- Sınav yanlış konuları serbest metin yerine öğrencinin sınıf müfredatından çoklu seçimle seçilebiliyor.
- Tek aktif öğrenci olduğunda Akademik Gelişim ekranı zayıf konu analizi için öğrenciyi otomatik seçiyor.
- Yazılı hazırlık formundaki örnek sınav adı/tarih/hedef kaldırıldı; alan etiketleri ve müfredattan çoklu konu seçimi eklendi.
- Doküman eklerken konu serbest metin yerine seçilen sınıfın müfredatından seçiliyor.
- Ayarlarda Instagram alanı `instagramHandle` ile aynı merkezi veriyi kullanıyor; mesaj imzası öğretmen adı/soyadı + marka + Instagram ile yeniden oluşturuluyor.
- PIN ekranındaki yanıltıcı `Varsayılan PIN: 1234` metni kaldırıldı.
- `vite-env.d.ts` eklendi; kullanıcı bilgisayarında görülen `ImportMeta.env` TypeScript hatasının kaynağı giderildi.

## Müfredat kapsamı
Konu & Kazanım alanına 5, 6, 7, 8, 9, 10, 11 ve 12. sınıf sekmeleri ile TYT Matematik, AYT Matematik ve TYT+AYT Geometri programları birlikte yerleştirildi. Sekmeler artık eğitim sırasına göre gösteriliyor.

## Kontrol
- 49 TS/TSX dosyası TypeScript parser ile tarandı: 0 sözdizimi hatası.
- Bu çalışma ortamında bağımlılık kurulumu ağ zaman aşımına uğradığı için tam `npm run check` burada tamamlanamadı.
- Kullanıcının Windows ortamında v1.0.0 için `npm install` ve `npm run check` başarılı çalışmıştır. v1.0.1 için aynı komut yeniden çalıştırılmalıdır.

## Yeniden test edilmesi gereken kısa liste
1. Ders oluştur → canlı ders → ders tamamla → veli WhatsApp raporu açılıyor mu?
2. Ödev anahtarı kapalıyken ödev oluşmuyor mu?
3. Ders konusu Konu & Kazanım ekranında `İşleniyor` olarak görünüyor mu?
4. Ödeme formu gerçek bekleyen bakiyeyi getiriyor mu?
5. 5–12 sınıf sekmeleri görünüyor mu?
6. Sınav/Yazılı/Doküman konu seçimleri müfredattan geliyor mu?
