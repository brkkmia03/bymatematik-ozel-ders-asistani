# bymatematik v1.4.9

- Geçmişte bitmiş dersler otomatik Tamamlandı kaydı olarak eklenmeye devam eder.
- Planlı dersler takvim saatine göre otomatik Başladı durumuna geçer; girilen süre dolunca otomatik Tamamlandı olur.
- Uygulama ders sırasında kapalıysa yeniden açıldığında saat kontrolü eksik durum geçişlerini tamamlar.
- Ders bitişinde telefon Web Push bildirimi gönderimi eklendi. Edge Function, Deno/Edge uyumlu `web-push-neo` kullanacak şekilde güncellendi.
- Ders ekleme ekranındaki ücret, seçili öğrencinin profilindeki ders ücretinden otomatik gelir; sabit 800 TL varsayımı kaldırıldı.
- Ders tamamlama/otomatik tamamlama finans hesabında öğrenci profilindeki ücret öncelikli kaynak olarak kullanılır.
- Yeni ödev ekranında Soru Sayısı artık 0 ile başlamaz; alan boş gelir ve kullanıcı elle girer.
- Öğrenci Tam Dosya PDF raporundaki Güncel Bakiye kartı kaldırıldı.
- Manuel Dersi Başlat butonları kaldırıldı; planlı derslerde Saatinde otomatik başlayacak bilgisi gösterilir.
- Service Worker önbellek sürümü v7 olarak yenilendi.
