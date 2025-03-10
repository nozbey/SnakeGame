# 🐍 AI-Powered Snake Game

Bu proje, **DeepSeek**, **ChatGPT** ve **Claude 3.7** tarafından oluşturulan üç farklı versiyonu içeren bir **Yılan Oyunu (Snake Game)** koleksiyonudur. Her versiyon, aynı başlangıç istemi (prompt) kullanılarak geliştirilmiş olup, Node.js tabanlı bir Express sunucusu üzerinde çalışmaktadır. Proje, **Docker** ile kapsüllenerek **Render** platformunda kolayca dağıtılabilir. 🚀

🎮 **Gameplay: Claude**
![Claude Gameplay](https://raw.githubusercontent.com/nozbey/SnakeGame/refs/heads/main/images/claude.gif)


🎮 **Gameplay: ChatGPT**
![ChatGPT Gameplay](https://raw.githubusercontent.com/nozbey/SnakeGame/refs/heads/main/images/chatgpt.gif)


🎮 **Gameplay: DeepSeek**
![DeepSeek Gameplay](https://raw.githubusercontent.com/nozbey/SnakeGame/refs/heads/main/images/deepseek.gif)


## 📑 İçindekiler
- [Oyun Mekaniği](#-oyun-mekaniği)
- [Dizin Yapısı](#-dizin-yapısı)
- [Kullanım](#-kullanım)
  - [Yerel Çalıştırma](#-yerel-çalıştırma)
  - [Docker ile Çalıştırma](#-docker-ile-çalıştırma)
- [Render Üzerinde Dağıtım](#-render-üzerinde-dağıtım)
- [Notlar](#-notlar)
- [Lisans](#-lisans)

## 🎮 Oyun Mekaniği

- Oyun, bir ızgara üzerinde oynanır ve amacınız diğer yılanlara veya duvarlara çarpmadan mümkün olduğunca çok elma yemektir.
- Yılanlar otomatik olarak hareket eder ve gerçek zamanlı olarak oynanır.
- Oyun, yılanın başka bir yılana çarpmasıyla sona erer.
- Giriş yapan her kullanıcı kendisine ait yılanı kullanır.
- Kullanıcılar, rastgele oluşan yemleri yemeye çalışır.
- Yılanların birbirine çarpması yasaktır. Çarpan oyuncu oyundan ayrılır ve yeniden başlar, çarpılan yılan ise devam eder.
- Yılanlar duvarlardan karşıya geçebilir ve oyun, diğer oyunculardan biri başarısız olsa bile devam eder. Sadece başarısız olan oyuncu için oyun biter.
- Hareket ederken aynı yön tuşuna basıldığında yılan daha da hızlanır.
- Başka bir yılan çarptığında, çarpılan yılan ekstra puan kazanır.
- Normal yem yendiğinde yılan büyür ve hızı yavaşlar. Oyun bittiğinde aynı isimle otomatik olarak yeniden giriş yapılır.
- Oyuna %15 oranında çıkan kırmızı yemler eklenir. Bu yemler yenirse ve yılanın uzunluğu 3'ten büyükse, yılanın uzunluğu 3 azalır.
- Oyuna %3 oranında çıkan mavi yemler eklenir. Bu yemler yenirse, yılan 5 saniye boyunca hareket etmez.
- Oyuna %2 oranında çıkan mor yemler eklenir. Bu yemler yenirse, yılan ikiye bölünür ve hızı yarıya düşer.
- Oyuna bir skorboard eklenir ve 1000 puana erişildiğinde oyun kazanılır. Kazanan bilgisi herkese bildirilir ve 10 saniye sonra oyun yeniden başlar.
- Aynı yöne giderken tekrar aynı yön tuşuna basıldığında, yılanın hızı 2 saniye boyunca iki kat artar.

## 📂 Dizin Yapısı

```
/snake-game/
│── deepseek-version/      # DeepSeek tarafından oluşturulan versiyon
│   ├── server.js          # Express tabanlı Node.js sunucu dosyası
│   ├── package.json       # Node.js bağımlılıkları ve script'ler
│   ├── public/            # HTML, CSS ve JS dosyalarını içeren frontend
│   │   ├── index.html     # Oyunun ana HTML dosyası
│   ├── Dockerfile         # Docker için yapılandırma dosyası
│
│── chatgpt-version/       # ChatGPT tarafından oluşturulan versiyon
│   ├── server.js
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   ├── Dockerfile
│
│── claude-version/        # Claude 3.7 tarafından oluşturulan versiyon
│   ├── server.js
│   ├── package.json
│   ├── public/
│   │   ├── index.html
│   ├── Dockerfile
│
│── README.md              # Bu doküman 😃
```

## 🎮 Kullanım

### 🔹 **Yerel Çalıştırma**

1. **Node.js ve npm'in yüklü olduğundan emin olun.**
2. İstediğiniz versiyonu seçerek terminalde ilgili dizine girin. Örneğin:
   ```sh
   cd deepseek-version
   ```
3. Bağımlılıkları yükleyin:
   ```sh
   npm install express socket.io
   ```
4. Sunucuyu çalıştırın:
   ```sh
   node server.js
   ```
5. Tarayıcınızda aşağıdaki adresi açın:
   ```
   http://localhost:3000
   ```

### 🐳 **Docker ile Çalıştırma**

1. Docker’ın yüklü olduğundan emin olun.
2. Terminali açın ve ilgili klasöre gidin:
   ```sh
   cd deepseek-version
   ```
3. Docker imajını oluşturun:
   ```sh
   docker build -t snake-game-deepseek .
   ```
4. Konteyneri çalıştırın:
   ```sh
   docker run -p 8000:8000 snake-game-deepseek
   ```
5. Oyunu tarayıcınızda açın:
   ```
   http://localhost:8000
   ```

## 🌍 Render Üzerinde Dağıtım

Her versiyon, **Render** üzerinde ayrı bir Web Service olarak dağıtılabilir.

1. **[Render](https://render.com/)** sitesine giriş yapın ve GitHub repository’nizi bağlayın.
2. "New Web Service" seçeneğini tıklayın.
3. Branch olarak `main` veya `master` seçin.
4. Deployment yöntemi olarak **Docker** seçin.
5. İlgili Dockerfile’ın yolunu girin:
   - `deepseek-version/Dockerfile`
   - `chatgpt-version/Dockerfile`
   - `claude-version/Dockerfile`
6. Deploy butonuna basarak işlemi tamamlayın.

Her servis için Render tarafından verilen linklerden oyununuzu çalıştırabilirsiniz. Örnek:
- 🎮 **DeepSeek Versiyonu:** `https://deepseek-snake.onrender.com`
- 🎮 **ChatGPT Versiyonu:** `https://chatgpt-snake.onrender.com`
- 🎮 **Claude Versiyonu:** `https://claude-snake.onrender.com`

## 📌 Notlar
- **Her versiyon aynı prompt ile geliştirilmiştir, ancak yapay zeka modellerinin farklılığı nedeniyle oyun mekanikleri değişiklik gösterebilir.**
- **Projeyi geliştirmek ve yeni özellikler eklemek için pull request gönderebilirsiniz.**
- **Oyunlar Node.js ve Express kullanılarak çalıştırılmaktadır. Eğer farklı bir backend framework kullanmak isterseniz, kodu kolayca değiştirebilirsiniz.**

🚀 İyi eğlenceler! 🕹️


## 📜 Lisans
![CC BY-NC-SA 4.0](https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png)

Bu proje, [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/) lisansı altında lisanslanmıştır.

