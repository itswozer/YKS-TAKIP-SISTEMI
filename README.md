# 🎯 Hedef YKS | Akıllı YKS Çalışma ve Takip Paneli

> YKS (TYT-AYT) hazırlık sürecini planlamak, deneme netlerini hesaplamak, günlük soru takibi yapmak ve çalışma disiplinini artırmak için geliştirilmiş modern bir web tabanlı takip paneli.

---

## 🚀 Özellikler

* *Modern Cam Efekti (Glassmorphic) Arayüz:* Göz yormayan, şık ve güncel tasarım trendlerine uygun UI/UX.
* *Tema Desteği:* Gece çalışmalarına özel *Koyu Tema* ve gündüz kullanımına uygun *Açık Tema* (Kullanıcı tercihi localStorage ile saklanır).
* *TYT-AYT Net Hesaplayıcı:* Ders bazlı doğru/yanlış sayıları girilerek netlerin anında hesaplanması ve geçmiş deneme takibi.
* *Günlük Soru Takibi:* Günlük çözülen soru sayılarını kaydetme ve toplam soru istatistiğini tutma.
* *Dersler & Hocalar Rehberi:* Çalışma sürecinde kullanılan kaynakların ve faydalı rehberlerin düzenlendiği alan.

---

## 🛠️ Kullanılan Teknolojiler

Proje, herhangi bir harici kütüphane veya karmaşık framework gerektirmeden, tamamen saf ve performanslı web teknolojileriyle geliştirilmiştir:

* *HTML5* (Semantik yapı)
* *CSS3* (Modern Flexbox, Grid, CSS Değişkenleri ve Glassmorphism efektleri)
* *JavaScript (ES6+)* (Dinamik işlemler ve localStorage veri kalıcılığı)

## 🔒 Gelişmiş güvenlik katmanı

Backend tarafında aşağıdaki korumalar eklendi:

* HTTP güvenlik başlıkları (`Helmet` ile CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
* Global API istek limitlemesi ve daha sıkı giriş/kayıt rate limiting
* JSON parse hata yakalama ve izin verilen anahtar kontrolü
* Hızlı parola deneme engelleme (IP + kullanıcı adı bazlı kilit)
* `Cache-Control: no-store` ve daha sıkı CORS/Content-Type ayarları

Frontend tarafında da tarayıcı seviyesinde CSP eklendi; böylece XSS ve dış kaynaklı zararlı betik çalışmaları önlenmeye çalışıldı.

## 📱 Mobil ve çevrimdışı kullanım

* Panel telefon ve tablet ekranlarına uyumlu; gezinme menüsü yatay kaydırılabilir ve dokunma alanları mobilde büyütülür.
* Siteyi GitHub Pages gibi HTTPS kullanan bir adreste açıp tarayıcının kurulum menüsünden uygulama gibi kurabilirsiniz. Chrome/Edge'de adres çubuğundaki yükleme simgesini veya tarayıcı menüsünü; iPhone/iPad'de Safari paylaş menüsündeki **Ana Ekrana Ekle** seçeneğini kullanın. Tarayıcıda doğrudan `file://` ile açmak kurulum sağlamaz.
* Daha önce bu cihazda giriş yapılmışsa internet kesintisinde son hesabın yerel kopyası açılır. Çevrimdışıyken yapılan değişiklikler cihazda saklanır ve bağlantı geri geldiğinde bulutla eşitlenir.
* Çevrimdışı kullanımda giriş/kayıt ve sunucuya bağlı işlemler yapılamaz. İlk giriş ve ilk uygulama önbelleğinin oluşturulması için internet gerekir. Yerel kayıtlar cihaz ve tarayıcıya özeldir; tarayıcı verileri silinirse çevrimdışı kopya da silinebilir.
* Uygulama kabuğu (HTML, CSS ve JavaScript) Service Worker ile önbelleğe alınır. Kişisel veriler Service Worker önbelleğine eklenmez.
* Genel bakıştaki **Günlük hatırlatıcı** kartından bildirim izni verip yerel saati seçebilirsiniz. Hatırlatıcı cihazda saklanır ve panel açıkken çalışır; tarayıcı kapalıyken zamanlanmış bildirim göndermek için sunucu taraflı Web Push servisi gerekir.

---

## 📂 Proje Yapısı

```text
YKS-TAKIP-SISTEMI/
│
├── index.html       # Ana sayfa ve arayüz iskeleti
├── style.css        # Tasarım, tema değişkenleri ve stiller
├── script.js        # Net hesaplama, soru takibi ve veri yönetimi
├── sentinel.js      # Tarayıcı hata/API gözlemcisi
├── admin/sentinel/  # Yönetici Sentinel kontrol paneli
├── backend/         # Express API ve kullanıcı kurulumu
└── README.md        # Proje dokümantasyonu
```

## Giriş sistemi ve yayınlama

### Yerelde çalıştırma

1. VS Code'da proje klasörünü açıp terminalde backend klasörüne geçin:

   ```powershell
   cd backend
   npm.cmd install
   npm.cmd run setup-user
   npm.cmd start
   ```

   `setup-user` komutunu yalnızca ilk kurulumda çalıştırın. Kullanıcı adı ve parolanız backend klasöründeki `.env` dosyasına kaydedilir; bu dosyayı paylaşmayın.

2. Backend terminalini açık bırakın. Projeyi VS Code'da Live Server ile açın; frontend adresi varsayılan CORS ayarıyla eşleşmesi için `http://localhost:5173` olmalıdır.
3. Giriş ekranında belirlediğiniz kullanıcı adı ve parola ile oturum açın. Sayfa JWT'yi tarayıcıda saklar, yenilemede sunucuya doğrulatır; çıkış yaptığınızda token silinir.
4. Giriş yanıtı ilk bulut verilerini de içerir; panel açılırken ayrıca veri indirme isteği beklenmez.

### GitHub Pages ve Render ile yayınlama

1. GitHub deposunda **Settings → Pages** bölümünden `main` dalının `/(root)` klasörünü yayınlayın. Açılan site adresinizi not edin.
2. [Render](https://render.com/) üzerinde **New → PostgreSQL** ile bir veritabanı oluşturun. Veritabanını ve web servisini aynı bölgede tutun.
3. Render’da **New → Web Service** seçip bu GitHub deposuna bağlanın. Ayarları şöyle girin:
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci`
   - **Start Command:** `npm start`
4. Web servisinin **Environment** bölümüne şu değişkenleri ekleyin. `AUTH_USERNAME`, `AUTH_PASSWORD_HASH` ve `JWT_SECRET` değerlerini `npm run setup-user` komutunu çalıştırdığınız yerel backend klasöründeki `.env` dosyasından alın; bunları sohbet veya GitHub üzerinden paylaşmayın.
   - `DATABASE_URL`: Render PostgreSQL sayfasındaki **Internal Database URL**
   - `AUTH_USERNAME`
   - `AUTH_PASSWORD_HASH`
   - `JWT_SECRET`
   - `HOST`: `0.0.0.0`
   - `FRONTEND_ORIGIN`: GitHub Pages sitenizin yalnızca origin kısmı. Örneğin `https://itswozer.github.io/YKS-TAKIP-SISTEMI/` için `https://itswozer.github.io` yazın.
5. Davet kodu oluşturmak için bilgisayarınızda `node -p "require('node:crypto').randomBytes(24).toString('base64url')"` komutunu çalıştırın. Çıkan kodu `REGISTRATION_INVITE_CODE` anahtarının değeri olarak Render Environment’a girin ve yalnızca davetlilerle özel olarak paylaşın. Kodun uzunluğu en az 24 karakter olmalıdır.
6. Render servisi hazır olduğunda size `https://...onrender.com` biçiminde bir adres verir. `index.html` içindeki `api-base-url` meta etiketinin `content` değerini bu adrese göre ayarlayın (sonunda `/` olmadan), değişikliği GitHub'a gönderin ve Pages'in yeniden yayınlanmasını bekleyin.
7. İlk açılışta mevcut `AUTH_USERNAME` hesabı PostgreSQL'e aktarılır. Giriş ekranındaki **Hesap oluştur** bağlantısı davet koduyla yeni kullanıcı kaydeder. Her hesap kendi verilerini veritabanına kaydeder; aynı hesap farklı cihazlarda verilerini eşitler.

> `backend/.env` ve `backend/node_modules` GitHub'a yüklenmemelidir. `.env` içindeki gizli değerleri yalnızca Render'ın Environment ayarlarına kendiniz girin. Daha önce tarayıcınızda yerel olarak tuttuğunuz eski panel verileri hesaba otomatik aktarılmaz; yeni veriler girişten sonra bulutla eşitlenir. Davet koduna sahip olanlar kendi hesabını açabilir.

## Sentinel hata gözlemi ve yönetici paneli

`sentinel.js`, tarayıcı çalışma zamanı hatalarını, yakalanmamış Promise retlerini, `fetch` ve XHR/axios HTTP/ağ hatalarını izler. Üçüncü taraf adresleri ve hata raporlama uç noktası izlenmez; raporlardan URL sorgu parametreleri ve e-posta adresleri ayıklanır. Raporlar güvenilmeyen girdi sayılır ve kaynak dosya istemcinin gönderdiği yola göre okunmaz: yalnızca stack içindeki allowlist dosya adları (`script.js`, `sentinel.js`, `service-worker.js`) kullanılabilir.

Kontrol paneli site adresinizde `/admin/sentinel/` yolundadır. Mevcut giriş token'ını kullanır ve yalnızca `SENTINEL_ADMIN_USERNAME` ile belirlenen kullanıcıya açıktır (ayarlanmazsa `AUTH_USERNAME` kullanılır). Rapor ve yama taslaklarının kalıcı saklanması için `DATABASE_URL`/PostgreSQL gereklidir; tablo uygulama başlarken oluşturulur.

Yapay zeka taslağı üretmek için backend ortam değişkenlerini ayarlayın:

* `SENTINEL_LLM_ENDPOINT`: OpenAI uyumlu HTTPS `chat/completions` uç noktası (ör. `https://api.openai.com/v1/chat/completions`)
* `SENTINEL_LLM_API_KEY`: yalnızca backend ortamında saklanan API anahtarı
* `SENTINEL_LLM_MODEL`: sağlayıcının model adı
* `SENTINEL_GITHUB_TOKEN`: yalnızca bu depoya sınırlandırılmış, Contents (read/write) ve Pull requests (read/write) izinli GitHub token'ı
* `SENTINEL_GITHUB_REPOSITORY`: `itswozer/YKS-TAKIP-SISTEMI` biçiminde depo adı
* `SENTINEL_GITHUB_BASE_BRANCH`: hedef dal (varsayılan `main`)

LLM değişkenleri tanımlı değilse hata raporları kaydedilir ama AI taslağı oluşturulmaz. GitHub token/repo ayarları yoksa taslaklar panelde incelenebilir ancak onaylama ve PR oluşturma kapalı kalır. Kaynak kodu yapılandırdığınız LLM sağlayıcısına gönderileceğinden, sağlayıcının veri işleme koşullarını ayrıca değerlendirin. Üretilen diff tek bir allowlist dosyasıyla sınırlandırılır, kaynak dosyanın güncel GitHub sürümüne yalıtılmış geçici klasörde uygulanıp doğrulanır ve ayrı `sentinel/<incident-id>` dalında **taslak PR** olarak hazırlanır. Paneldeki **Onayla ve PR aç** eylemi GitHub'a inceleme dalı/PR gönderilmesini onaylar; canlıya yayın değildir. Kod ancak PR GitHub'da ayrıca incelenip birleştirilince yayın akışına girer. Geri alma, son birleştirilmiş Sentinel PR'ı için yeni bir taslak geri alma PR'ı açar; bu PR da ayrıca birleştirilmelidir. Otomatik mod bilerek etkinleştirilmemiştir.

API adresini değiştirirseniz `index.html` ile `admin/sentinel/index.html` içindeki `api-base-url` ve CSP `connect-src` izinlerini de güncelleyin.
