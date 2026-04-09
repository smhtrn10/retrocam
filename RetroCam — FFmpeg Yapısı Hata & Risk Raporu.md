Dosya	Sorun	Açıklama	Önem	Durum
videoFilter.ts	geq filtresi — virgül escape hatası	geq=r='r(X-5\,Y)' şeklinde yazılmış. FFmpeg'de \, yanlış; doğrusu geq=r='r(X-5,Y)' ama bu tek tırnak içinde FFmpeg shell'ine string olarak geçince çift escape gerekir. Platform bağımlı crash'e neden olur.	Yüksek	Düzeltilmeli
videoFilter.ts	noise filtresi flag değeri	allf=t+u bazı FFmpeg sürümlerinde tanınmaz. Güvenli alternatif: allf=t (temporal) veya allf=u (uniform). t+u kombinasyonu dokümanda yoktur.	Yüksek	Düzeltilmeli
videoFilter.ts	vignette — mode=backward geçersiz	FFmpeg vignette filtresinde mode parametresi yoktur. Geçerli parametreler: angle, x0, y0, aspect, dither, eval. Bu satır filtreyi tamamen hatalı kılar.	Yüksek	Düzeltilmeli
video-preview.tsx	FFmpeg komutu execute() — argüman sırası	buildFFmpegCommand çıktısı tüm argümanları tek string olarak birleştirir (-i "..." -vf "..."). FFmpegKit.execute() bunu shell üzerinden parse eder; URI'de boşluk veya Türkçe karakter varsa (örn. galeri yolu) argüman parçalanması yaşanır. executeAsync + array API kullanılmalı.	Yüksek	Düzeltilmeli
Orta seviye riskler
Dosya	Sorun	Açıklama	Önem	Durum
video-preview.tsx	Geçici dosya temizlenmez	FFmpeg çıktısı documentDirectory/retrocam_video_*.mp4 olarak yazılır. Paylaş/kaydet sonrası bu dosya silinmez; cihaz depolaması zamanla dolar.	Orta	Risk
video-preview.tsx	player.replace() dependency eksik	useEffect'te [filteredUri] dinleniyor ancak player dependency array'e eklenmemiş. ESLint react-hooks/exhaustive-deps uyarısı; bazı sürümlerde stale closure ile eski player objesine erişilir.	Orta	Uyarı
videoFilter.ts	colorchannelmixer renk kanalı çakışması	Tint uygulanırken rg, rb, gr, gb, br, bg çapraz kanalları da ayarlanıyor. Bu değerler toplamı 1'i aşarsa (yüksek tint + parlak renk) çıkış doymuş/yanık görünür. Clamp kontrolü yok.	Orta	Risk
video-preview.tsx	FFmpeg hata logları sessiz geçiliyor	Başarısız session için getLogs() sadece console.warn'a yazılıyor, kullanıcıya hiçbir geri bildirim verilmiyor. Kullanıcı filtresiz videonun "işlenmiş" göründüğünü zannedebilir.	Orta	Risk
video.tsx	Timer ref temizliği — race condition	stopRecording içinde timerRef.current temizleniyor fakat startRecording'daki try/catch bloğunda da temizleniyor. İkisi aynı anda çalışırsa (maxDuration bitişi + kullanıcı stop) clearInterval iki kez çağrılabilir — zararsız ama interval ID'nin null olup olmadığı kontrol edilmeli.	Orta	Uyarı
Düşük öncelikli / yapısal notlar
Dosya	Sorun	Açıklama	Önem	Durum
videoFilter.ts	eq filtresi — brightness negatif olamaz	settings.fade değeri 0.02'nin altındaysa brightness '0' yazılıyor, bu doğru. Ama fade negatif değer alabilirse eq=brightness aralığı -1..1 olduğundan sorun yok; yine de negatif fade durumu hiç ele alınmamış.	Düşük	Not
videoFilter.ts	gblur sigma minimum değeri	Math.max(0.1, ...) ile korunuyor. FFmpeg gblur sigma için 0.1 geçerlidir; ancak çok küçük değerlerde (0.1–0.3) görsel fark yoktur, işlem süresi boşa gider. Threshold 0.3–0.5'e çekilebilir.	Düşük	Not
video.tsx	effect state kullanılmıyor	effect ve cycleEffect tanımlanmış; görsel overlay var (scanlines, rgb border). Ancak bu efektler FFmpeg pipeline'ına dahil edilmiyor — sadece önizleme overlay'i. Bu kasıtlıysa kod yorumu yoktur; kasıtsızsa eksik özellik.	Düşük	Not
video-preview.tsx	iOS MediaLibrary çift izin denemesi	İlk saveToLibraryAsync başarısız olursa requestPermissionsAsync çağrılıp tekrar deneniyor. Bu davranış iOS'ta kullanıcıya iki kez izin diyalogu gösterebilir. İzin durumu kayıt öncesi tek seferde kontrol edilmeli.	Düşük	Not

Toplam 4 kritik, 5 orta, 4 düşük sorun tespit edildi. En acil üçü şunlar:
1. vignette=mode=backward — tamamen geçersiz. FFmpeg'in vignette filtresinde mode parametresi yok, bu satır filtreyi çökertir. Düzeltme basit:
tsfilters.push(`vignette=angle=${angle}:eval=init`);
2. noise filtresi allf=t+u — belgelenmemiş kombine flag. FFmpeg kaynak kodunda t ve u ayrı flagler, + ile birleştirmek desteklenmez. Ya allf=t ya allf=u kullanın.
3. geq escape + FFmpegKit.execute() string API. URI'de boşluk veya özel karakter olursa argüman parçalanır. executeAsync + dizi tabanlı API'ye geçmek daha güvenli:
tsawait FFmpegKit.executeAsync(['-i', inputUri, '-vf', filter, ...])