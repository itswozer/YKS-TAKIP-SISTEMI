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

---

## 📂 Proje Yapısı

```text
YKS-TAKIP-SISTEMI/
│
├── index.html       # Ana sayfa ve arayüz iskeleti
├── style.css        # Tasarım, tema değişkenleri ve stiller
├── script.js        # Net hesaplama, soru takibi ve veri yönetimi
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
