/**
 * expo-app — iOS Build Uyumluluk Doğrulayıcı
 * ─────────────────────────────────────────────
 * Çalıştır: node expo_ios_compat_check.js
 * Proje root'una (package.json'ın yanına) koy.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const REPORT_OUTPUT = "./compat_report.txt";

// ─── PROJE SABİTLERİ (package.json'dan alındı) ───────────────────────────────
const PROJECT = {
    name: "expo-app",
    expoSdk: 54,
    reactNative: "0.81.5",
    react: "19.1.0",
    expoRouter: "6.0.23",
};

// Expo SDK 54 sistem gereksinimleri
const SDK_REQS = {
    node: "20.0.0",
    npm: "10.0.0",
    xcode: "16.0",
    cocoapods: "1.15.0",
};

// ─── YARDIMCI ────────────────────────────────────────────────────────────────
function cleanVer(v) {
    if (!v) return "0.0.0";
    return String(v).replace(/[\^~>=< ]/g, "").split("-")[0];
}

function cmp(a, b) {
    const pa = cleanVer(a).split(".").map(Number);
    const pb = cleanVer(b).split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        if ((pa[i] || 0) > (pb[i] || 0)) return 1;
        if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    }
    return 0;
}

function gte(a, min) { return cmp(a, min) >= 0; }

function run(cmd) {
    try { return execSync(cmd, { stdio: "pipe" }).toString().trim(); }
    catch { return null; }
}

function installedVer(pkg) {
    try {
        const p = path.join("node_modules", pkg, "package.json");
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8")).version;
    } catch { }
    return null;
}

// ─── KONTROL MOTORU ──────────────────────────────────────────────────────────
const CHECKS = [];

function check(group, label, condition, failMsg, detail = "") {
    // condition: true = geçti, false = hata, "warn" = uyarı
    CHECKS.push({ group, label, pass: condition, msg: condition === true ? "OK" : failMsg, detail });
}

// ─── 1. SİSTEM ARAÇLARI ──────────────────────────────────────────────────────
const sysNode = process.version.replace("v", "");
const sysNpm = run("npm --version");
const sysPod = run("pod --version");
const sysXcode = run("xcodebuild -version 2>/dev/null | awk 'NR==1{print $2}'");

check("Sistem", "Node.js >= 20.0",
    gte(sysNode, SDK_REQS.node),
    `${sysNode} kurulu — Expo SDK 54 için min ${SDK_REQS.node} gerekli`);

check("Sistem", "npm >= 10.0",
    gte(sysNpm || "0", SDK_REQS.npm),
    `${sysNpm || "?"} kurulu — min ${SDK_REQS.npm} gerekli`);

check("Sistem", "CocoaPods >= 1.15",
    gte(sysPod || "0", SDK_REQS.cocoapods),
    `${sysPod || "yok"} — min ${SDK_REQS.cocoapods} gerekli`,
    "Güncelle: sudo gem install cocoapods");

check("Sistem", "Xcode >= 16.0",
    sysXcode ? (gte(sysXcode, SDK_REQS.xcode) ? true : "warn") : "warn",
    `Xcode ${sysXcode || "tespit edilemedi"} — min ${SDK_REQS.xcode} öneriliyor`,
    "App Store Connect yüklemeleri için Xcode 16+ zorunlu");

// ─── 2. REACT NATIVE / EXPO UYUMU ────────────────────────────────────────────
const rnVer = installedVer("react-native") || PROJECT.reactNative;
const reactVer = installedVer("react") || PROJECT.react;

check("RN Uyumu", "react-native 0.81.x (SDK 54)",
    rnVer.startsWith("0.81"),
    `react-native ${rnVer} — Expo SDK 54 için 0.81.x zorunlu`,
    "npx expo install react-native ile otomatik düzeltilebilir");

check("RN Uyumu", "react 19.x",
    reactVer.startsWith("19"),
    `react ${reactVer} — RN 0.81 ile React 19.x bekleniyor`);

check("RN Uyumu", "expo-router 6.x (SDK 54)",
    PROJECT.expoRouter.startsWith("6"),
    `expo-router ${PROJECT.expoRouter} — SDK 54 için 6.x gerekli`);

check("RN Uyumu", "react-i18next 17.x + React 19",
    "warn",
    "react-i18next 17.x React 19 ile henüz tam test edilmemiş",
    "Runtime'da context/hook hatası çıkabilir. GitHub issues'ı takip et.");

// ─── 3. FFMPEG-KIT (KRİTİK) ──────────────────────────────────────────────────
check("Native Paketler", "ffmpeg-kit — GitHub fork (KRİTİK)",
    false,
    "Resmi npm yerine GitHub fork: github:jdarshan5/ffmpeg-kit-react-native",
    "Bu fork RN 0.81 + iOS 17 ile test edilmiş mi bilinmiyor. " +
    "Podfile'da pod sürümünü elle kontrol et. " +
    "ios/ klasöründe: cat ios/Podfile | grep -i ffmpeg");

check("Native Paketler", "ffmpeg-kit — iOS framework boyutu",
    "warn",
    "Tam ffmpeg paketi ~200 MB — EAS Build süre aşımı riski",
    "Sadece ihtiyacın olan codec'i seç. Podfile'da: pod 'ffmpeg-kit-react-native/min'");

// ─── 4. REANIMATED + WORKLETS + SKIA ÜÇLÜSÜ (KRİTİK) ────────────────────────
const reanimatedVer = installedVer("react-native-reanimated");
const workletsVer = installedVer("react-native-worklets");
const skiaVer = installedVer("@shopify/react-native-skia");

if (workletsVer && reanimatedVer && reanimatedVer.startsWith("4")) {
    check("Native Paketler", "reanimated 4.x + worklets çakışması (KRİTİK)",
        false,
        `reanimated ${reanimatedVer} + worklets ${workletsVer} tespit edildi`,
        "reanimated 4.x zaten kendi Worklets API'sini içeriyor. Çakışmayı önlemek için react-native-worklets'i kaldırın.");
} else {
    check("Native Paketler", "reanimated 4.x + worklets çakışması", true);
}

check("Native Paketler", "reanimated 4.x — Hermes zorunlu",
    "warn",
    "reanimated 4.x Hermes olmadan iOS'ta çalışmıyor",
    "app.json: { \"expo\": { \"jsEngine\": \"hermes\" } }");

// ─── 6. GESTURE HANDLER ──────────────────────────────────────────────────────
const ghVer = installedVer("react-native-gesture-handler") || "2.28.0";
check("Paket Uyumu", "gesture-handler 2.28.x",
    gte(ghVer, "2.20.0"),
    `gesture-handler ${ghVer} — RN 0.81 için 2.20+ gerekli`);

const layoutContent = fs.existsSync("./app/_layout.tsx") ? fs.readFileSync("./app/_layout.tsx", "utf8") : "";
const hasGHRoot = layoutContent.includes("GestureHandlerRootView");

check("Paket Uyumu", "GestureHandlerRootView wrap",
    hasGHRoot ? true : "warn",
    "app/_layout.tsx root'u GestureHandlerRootView ile sarılı olmalı",
    "Sarılmazsa iOS'ta gesture'lar sessizce çalışmaz.");

// ─── 9. İZİN GEREKSİNİMLERİ ──────────────────────────────────────────────────
const appJsonRaw = fs.existsSync("./app.json") ? JSON.parse(fs.readFileSync("./app.json", "utf8")) : {};
const infoPlist = appJsonRaw?.expo?.ios?.infoPlist || {};

const hasCam = !!infoPlist.NSCameraUsageDescription;
const hasMic = !!infoPlist.NSMicrophoneUsageDescription;
const hasLoc = !!infoPlist.NSLocationWhenInUseUsageDescription;
const hasPhoto = !!infoPlist.NSPhotoLibraryUsageDescription;

check("İzinler / Config", "iOS İzin Metinleri",
    (hasCam && hasMic && hasLoc && hasPhoto) ? true : "warn",
    `Eksik izin metinleri: ${[!hasCam && "Kamera", !hasMic && "Mikrofon", !hasLoc && "Konum", !hasPhoto && "Galeri"].filter(Boolean).join(", ")}`,
    "Bu metinler app.json -> expo.ios.infoPlist içinde tanımlanmalıdır.");

// ─── 10. app.json KONTROLLERI ─────────────────────────────────────────────────
if (fs.existsSync("./app.json")) {
    const appJson = JSON.parse(fs.readFileSync("./app.json", "utf8"));
    const expo = appJson.expo || {};

    check("Build Config", "bundleIdentifier",
        !!expo?.ios?.bundleIdentifier,
        "ios.bundleIdentifier eksik — iOS build için zorunlu",
        "örn: com.sirketadi.expoapp");

    check("Build Config", "Hermes etkin",
        (expo?.jsEngine === "hermes" || expo?.ios?.jsEngine === "hermes"),
        "jsEngine 'hermes' değil — reanimated 4.x için zorunlu",
        "expo.jsEngine = 'hermes' veya expo.ios.jsEngine = 'hermes'");

    check("Build Config", "iOS build number",
        !!expo?.ios?.buildNumber,
        "ios.buildNumber eksik — App Store yüklemelerinde zorunlu",
        "warn");

    const iosTarget = expo?.ios?.deploymentTarget;
    if (iosTarget) {
        check("Build Config", "iOS deployment target >= 15.1",
            gte(iosTarget, "15.1"),
            `deploymentTarget ${iosTarget} — StoreKit 2 + reanimated 4.x için 15.1+ gerekli`);
    }
} else {
    check("Build Config", "app.json", false, "app.json bulunamadı");
}

// ─── 11. Podfile ──────────────────────────────────────────────────────────────
if (fs.existsSync("./ios/Podfile")) {
    const pod = fs.readFileSync("./ios/Podfile", "utf8");
    const m = pod.match(/platform :ios, ['"](.+)['"]/);
    if (m) {
        check("Build Config", `Podfile iOS target (${m[1]}) >= 15.1`,
            gte(m[1], "15.1"),
            `iOS target ${m[1]} — min 15.1 gerekli`,
            "Podfile'da: platform :ios, '15.1'");
    }
    check("Build Config", "Podfile — use_frameworks",
        !pod.includes("use_frameworks!") ? "warn" : true,
        "use_frameworks! yoksa bazı Swift pod'ları (Skia, Purchases) link hatası verebilir",
        "Podfile'a 'use_frameworks! :linkage => :static' ekle");
} else {
    check("Build Config", "ios/Podfile",
        "warn", "Podfile yok — pod install yapılmamış olabilir",
        "npx pod-install veya cd ios && pod install");
}

// ─── 12. eas.json ─────────────────────────────────────────────────────────────
check("Build Config", "eas.json",
    fs.existsSync("./eas.json"),
    "eas.json yok — EAS Build için zorunlu",
    "Oluştur: npx eas build:configure");

// ─── 13. TypeScript ───────────────────────────────────────────────────────────
check("Build Config", "TypeScript ~5.9 (beta riski)",
    "warn",
    "TypeScript 5.9 henüz RC/beta aşamasında olabilir",
    "Sorun çıkarsa: npm install typescript@5.8 ile geri al");

// ─── RAPOR ────────────────────────────────────────────────────────────────────
const lines = [];
const log = (msg = "") => { console.log(msg); lines.push(msg); };
const SEP = "─".repeat(65);
const SEP2 = "═".repeat(65);

log(SEP2);
log("  expo-app — iOS Build Uyumluluk Raporu");
log(`  Expo SDK ${PROJECT.expoSdk}  |  RN ${PROJECT.reactNative}  |  React ${PROJECT.react}`);
log(`  ${new Date().toLocaleString("tr-TR")}`);
log(SEP2);

log("\n  Sistem Bilgisi");
log(`  Node      : ${sysNode}`);
log(`  npm       : ${sysNpm || "tespit edilemedi"}`);
log(`  CocoaPods : ${sysPod || "tespit edilemedi"}`);
log(`  Xcode     : ${sysXcode || "tespit edilemedi"}`);

// Gruplara göre yaz
const groupOrder = ["Sistem", "RN Uyumu", "Native Paketler", "Paket Uyumu", "İzinler / Config", "Build Config"];

let totalErr = 0;
let totalWarn = 0;
let totalOk = 0;

groupOrder.forEach(group => {
    const groupChecks = CHECKS.filter(c => c.group === group);
    if (!groupChecks.length) return;
    log(`\n${SEP}`);
    log(`  ${group.toUpperCase()}`);
    log(SEP);
    groupChecks.forEach(c => {
        const icon = c.pass === true ? "✅" : c.pass === "warn" ? "⚠️ " : "❌";
        if (c.pass === true) totalOk++;
        if (c.pass === false) totalErr++;
        if (c.pass === "warn") totalWarn++;
        log(`  ${icon} ${c.label}`);
        if (c.pass !== true) {
            log(`       → ${c.msg}`);
            if (c.detail) log(`       ℹ  ${c.detail}`);
        }
    });
});

log(`\n${SEP2}`);
log("  ÖZET");
log(SEP2);
log(`  ❌ Kritik hata : ${totalErr}`);
log(`  ⚠️  Uyarı       : ${totalWarn}`);
log(`  ✅ Geçen       : ${totalOk}`);
log("");

if (totalErr > 0) {
    log("  ❌ KRİTİK HATALAR VAR — Önce bunları düzelt, sonra iOS build al.");
} else if (totalWarn > 0) {
    log("  ⚠️  Kritik hata yok, ama uyarıları gözden geçir — build alabilirsin.");
} else {
    log("  ✅ Tüm kontroller geçti — iOS build alabilirsin.");
}

log(`\n${SEP}`);
log("  ÖNERİLEN BUILD SIRASI");
log(SEP);
log("  1. npx expo install --check          # sürüm uyumsuzluklarını otomatik düzelt");
log("  2. npx pod-install                   # CocoaPods güncelle");
log("  3. npx eas build --platform ios      # EAS cloud build");
log("     (veya lokal: npx expo run:ios --configuration Release)");
log(SEP2 + "\n");

fs.writeFileSync(REPORT_OUTPUT, lines.join("\n"), "utf8");
console.log(`📄 Rapor kaydedildi: ${REPORT_OUTPUT}\n`);