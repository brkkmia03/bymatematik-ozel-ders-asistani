# bymatematik v1.4.5
- Ana sayfa üst ders kartı ile Bugünün Dersleri aynı günlük ders kaynağına bağlandı; geçmiş saatli ama bugün planlı ders varsa yanlış "aktif ders yok" mesajı gösterilmez.
- Finans ekranındaki PDF butonunun yanlış `finance_summary` kimliği `financial_summary` olarak düzeltildi. Girilmiş ödeme hareketleri finans raporunda görünür.
- Bekleyen ders ücreti satırlarında negatif `-` işareti kaldırıldı; "Bekleyen Ödeme" etiketi eklendi. PDF'deki fark alanı da negatif göstermeyen "Bekleyen Ödeme" oldu.
- Gerçek Web Push altyapısı eklendi: service worker push/click olayları, cihaz aboneliği, Supabase push_subscriptions tablosu ve ders hatırlatma Edge Function örneği.
- Telefon push bildiriminin uygulama kapalıyken çalışması için Supabase migration + Edge Function + VAPID secrets + zamanlayıcı kurulumu gerekir. Kod paketi hazırdır; sunucu kurulumu ayrıca yapılmalıdır.
