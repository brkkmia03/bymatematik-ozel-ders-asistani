# bymatematik Özel Ders Asistanı — v1.4.0

## Bu sürümde

- Tüm modal/popup pencerelerinde arka sayfa kaydırması kilitlendi; içerik paneli mobilde bağımsız kaydırılır.
- PDF önizleme eylemleri büyütüldü. Yazdır düğmesi yalnızca yazdırma ekranını açar; PDF düğmesi raporu gerçek PDF belgesine dönüştürüp yeni sekmede açar.
- Konu & Kazanım verileri 2026-2027 yürürlük durumuna göre güncellendi: 5, 6, 7 ile 9, 10, 11 Türkiye Yüzyılı Maarif Modeli; 8 ve 12. sınıflar yürürlükteki önceki program çizgisinde tutuldu. TYT/AYT/Geometri havuzları korunmuştur.
- Doküman yükleme üst sınırı 1,5 MB’tan 4 MB’a çıkarıldı. Mevcut Data URL + yerel önbellek mimarisi nedeniyle daha yüksek sınırlar cihaz kotası açısından güvenli değildir; sonraki aşamada Supabase Storage ile çok daha büyük dosyalar desteklenebilir.
- WhatsApp merkezine özgün mesaj yazma alanı eklendi. Hazır mesajların imzası yalnızca “Matematik Öğretmeni” ve öğretmen ad-soyadıdır.
- PDF rapor başlığındaki Instagram satırı kaldırıldı; Instagram yalnızca rapor alt bilgisinde gösterilir.
- Öğrenci Yönetimi ve öğrenci profilindeki PDF düğmesi “Öğrenci Tam Dosyası” oluşturur: öğrenci bilgileri, tüm dersler, ders sonu değerlendirmeleri, ödevler, konu ilerlemesi, hedefler, sınavlar, yazılılar, hazırlık planları, görevler, dokümanlar, paketler, finans hareketleri ve WhatsApp geçmişi.
- Marka adı `bymatematik`, Instagram `@bymatematiik` olarak sabitlendi ve düzenlenemez hale getirildi.
- Aydınlık / Karanlık / Cihaz Ayarı temaları Tailwind v4 class tabanlı dark mode desteğiyle aktif hale getirildi.
- PWA service worker cache sürümü yükseltildi.
