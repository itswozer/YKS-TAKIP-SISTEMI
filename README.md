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

## Yerel giriş sistemi

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

Frontend başka bir portta çalışıyorsa backend'in `.env` dosyasındaki `FRONTEND_ORIGIN` değerini frontend adresine göre ayarlayıp backend'i yeniden başlatın.

> Bu giriş akışı panel arayüzünü gizler. Panel verileri tarayıcının `localStorage` alanında tutulduğu için tek başına gerçek sunucu taraflı erişim koruması sağlamaz.
