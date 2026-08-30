# bymatematik v1.4.4 — Öğrenci Silme Kalıcılık Düzeltmesi

- iPhone/PWA tarafında yerel öğrenci silme işleminden hemen sonra tetiklenen focus/visibility bulut yenilemesinin eski Supabase anlık görüntüsünü geri yükleyebilmesi engellendi.
- Öğrenci silme işleminden sonra kısa süreli yerel mutasyon koruması uygulanıyor; React state ve debounced Supabase kaydı tamamlanana kadar eski bulut verisi yerelin üzerine yazılmıyor.
- Öğrenci ve ilişkili verilerin mevcut kalıcı silme temizliği korunuyor.
- PWA cache sürümü yükseltildi.
