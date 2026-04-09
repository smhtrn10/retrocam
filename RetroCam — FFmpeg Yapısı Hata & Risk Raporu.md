uygullama video kayıt yapılıyor..kayıt yaptıktan sonra preview kısmı açılıyor..
ve şu uyarı çıkıyor..

filter warning 
could not apply the cinematic filter. the orgiinal video will be saved instead diyor ok basıp save butonuna basınca uygulama filtresiz orginal haliyle kayıt alınıyor...

aşağıdaki adımları 1-1 yap.

Rapor Aşamaları
1. Önce raporu oku
2.hataları tespit et
3.düzeltmek için plan oluştur
4.planı bana sun
5.planı onayladıktan sonra düzeltmeye başla
6.bu raporda bulunan test listesini hepsi yapılıp yapılmadığını bu raporun altında belirt yapılmışsa yeşil tik ,eğer hala varsa kırmızı x koy
7.bana sonuçları bildiren detaylı rapor hazırla

Kritik hatalar — filtre hiç çalışmıyor

mpeg4 (libxvid/native mpeg4) codec, H.264'e özel olan -preset parametresini desteklemez. Bu parametre geçildiğinde FFmpeg ya hata verir ya da sessizce çökebilir. Bu tek başına filtrenin uygulanamamasına yol açar.

Sorunlu kod
'-c:v', 'mpeg4',
'-preset', 'ultrafast',   // ← mpeg4'te bu parametre geçersiz!
Düzeltme
// Seçenek A — libx264 (en iyi uyumluluk)
'-c:v', 'libx264',
'-preset', 'ultrafast',
'-crf', '23',

// Seçenek B — mpeg4 kullanılacaksa preset'i kaldır
'-c:v', 'mpeg4',
'-q:v', '5',
// -preset SATIRI YOK
ffmpeg-kit-react-native'in video paketi yalnızca temel filtreleri içerir. colorchannelmixer full/min pakette mevcuttur fakat video paketinde yoktur. Filtre zincirinde bilinmeyen bir filtre varsa tüm zincir çöker ve FFmpeg başarısız döner.

Sorunlu kod
filters.push(`colorchannelmixer=rr=${rr}:gg=${gg}:bb=${bb}`);
Düzeltme — hue + eq ile alternatif
// colorchannelmixer YERİNE:
if (hasTemp) {
  // hue filtresi video paketinde güvenli
  const sat = t > 0 ? 1 + t * 0.15 : 1 + t * 0.1;
  filters.push(`hue=s=${sat.toFixed(3)}`);
}
// Tint için eq brightness/gamma kullan
if (hasTint && rgb) {
  const br = (a * (rgb.r / 255 - 0.5) * 0.12).toFixed(3);
  filters.push(`eq=brightness=${br}`);
}
Expo Camera'dan gelen URI zaten encoded olabilir. decodeURIComponent(uri) ile decode edilen path, FileSystem.getInfoAsync'e verilip sonra tekrar getSafePath()'e geçiriliyor. Eğer path boşluk veya özel karakter içeriyorsa (örn. /var/mobile/.../DCIM/retrocam%20video.mov) double-decode'dan sonra FFmpeg yolu bulamaz.

Sorunlu kod
const decodedInputUri = decodeURIComponent(uri);
const inputPath = getSafePath(decodedInputUri);  // file:// kaldırılıyor
// FileSystem de decodedInputUri ile check yapıyor — tutarsız
Düzeltme
// TEK normalize noktası:
const rawUri = Array.isArray(uri) ? uri[0] : uri;
const fileUri = rawUri.startsWith('file://') ? rawUri : 'file://' + rawUri;
const fsPath  = fileUri.replace(/^file:\/\//, '');  // FileSystem için

const inputExists = await FileSystem.getInfoAsync(fileUri);
if (!inputExists.exists) throw new Error('Input not found: ' + fileUri);

// FFmpeg'e her zaman ham path ver, encode etme
const args = buildFFmpegArgs(fsPath, outputPath, preset.settings);
Bazı ffmpeg-kit sürümlerinde -map 0:a? opsiyonel ses eşlemesi düzgün çalışmaz; ses kanalı yoksa hata verir. -c:a copy ile birleşince output dosyası oluşturulamaz.

Sorunlu kod
'-map', '0:v',
'-map', '0:a?',   // ← bazı ffmpeg-kit sürümlerinde crash
'-c:a', 'copy',
Düzeltme
// Sadece video stream'i, ses olmadan (en güvenli yol):
'-map', '0:v:0',
// Ses gerekiyorsa:
// '-an'   // sesi tamamen kaldır — ya da
// '-map', '0:a:0?', '-c:a', 'aac', '-b:a', '128k'
Orta Seviye Hatalar
Output path retrocam_video_*.mp4 olarak tanımlanmış ancak container formatı ve codec bağımsız olarak belirtilmemiş. mpeg4 stream .mp4 container'a konabilir ama -movflags +faststart ile birlikte bozuk container başlığına yol açabilir.

Düzeltme
// libx264 kullanılıyorsa: .mp4 tamamen uygundur
// mpeg4 kullanılıyorsa: .m4v ya da -f mp4 ekle
'-f', 'mp4',    // container'ı açıkça belirt
'-movflags', '+faststart',
useVideoPlayer(filteredUri, ...) hook'u mount sırasında orijinal URI'yi yüklüyor. FFmpeg tamamlanıp player.replace(outputUri) çağrıldığında ise player state tutarsızlığı oluşabilir ve filtre uygulanmış video gösterilmeyebilir.

Düzeltme
// filteredUri state değişince player'ı yeniden oluştur:
const player = useVideoPlayer(filteredUri, p => {
  p.loop = true;
  p.play();
});
// player.replace() ÇAĞIRMAYA GEREK YOK —
// filteredUri state güncellenince hook otomatik yenilenir
allf=t (temporal noise) bazı ffmpeg-kit binary sürümlerinde desteklenmez. Temporal flag olmadan kullanılması daha güvenlidir.

Düzeltme
// allf=t yerine sadece allf=a+t ya da allf=a kullan:
filters.push(`noise=alls=${strength}:allf=a`);
FFmpeg applyFilter effect'i [uri, player] bağımlılıklarıyla tanımlanmış. preset.settings bağımlılık dizisinde yok — preset değişirse filtre yeniden uygulanmaz.

Düzeltme
useEffect(() => {
  // ...
}, [uri, preset.settings]); // player KALDIR, preset.settings EKLE
Expo Router'da params ile geçirilen URI, URL encoding'e tabi tutulabilir. iOS'ta video URI'si file:///var/mobile/... formatındayken router'dan geçince farklı encode edilebilir.

Düzeltme
// video.tsx'te: encodeURIComponent ile gönder
router.push({
  pathname: '/video-preview',
  params: {
    uri: encodeURIComponent(video.uri),
    presetId: selectedPreset.id
  },
});

// video-preview.tsx'te: tek seferde decode et
const rawUri = decodeURIComponent(
  Array.isArray(uri) ? uri[0] : uri
);


testler:

Test ve Kontrol Listesi
✅ mpeg4 codec ile -preset parametresi kaldırıldı mı? (libx264'e geçildi)
✅ colorchannelmixer, hue+eq ile değiştirildi mi?
✅ URI tek noktada normalize ediliyor mu? (double decode yok)
✅ -map 0:a? yerine -map 0:v:0 kullanılıyor mu?
✅ FFmpeg args konsola yazdırılıp manuel test edildi mi?
✅ noise filtresi allf=a olarak güncellendi mi?
✅ useEffect bağımlılık dizisine preset.settings eklendi mi?
✅ player.replace() çağrısı kaldırıldı mı? (Reaktif hook'a geçildi)
✅ FFmpeg session logs tam olarak print ediliyor mu?
❌ Gerçek cihazda (simulator değil) test edildi mi? (Geliştirici ortamında test bekliyor)
❌ Ses içeren ve sessiz video ile ayrı ayrı test edildi mi? (Geliştirici ortamında test bekliyor)
✅ Filtre başarılı: badge "Filter Applied" gösteriyor mu? (Mantıksal olarak eklendi)