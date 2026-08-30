# bymatematik v1.4.1 - PDF Motoru Düzeltmesi

- Tüm raporların PDF Aç/indirme işlemi için kullanılan ortak PDF motoru yenilendi.
- iPhone Safari ve ana ekrana eklenen PWA'da sorun çıkarabilen SVG `foreignObject` tabanlı dönüştürme kaldırıldı.
- Raporlar artık A4 oranında, sayfa sayfa canvas üzerinde oluşturuluyor; uzun raporlarda tek ve aşırı büyük canvas kullanılmıyor.
- Uzun "Öğrenci Tam Dosyası" dahil tüm raporlar otomatik sayfalanıyor.
- Türkçe karakterler canvas üzerinden görüntü olarak PDF'e aktarıldığından karakter bozulması önleniyor.
- PDF penceresi kullanıcı tıklaması anında açılarak iOS popup engelleyicisiyle uyumluluk artırıldı.
- PWA/Safari'de yeni sekme açılamazsa dosya bağlantısı indirme davranışına geri dönüyor.
