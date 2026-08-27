# FutbolCanlı

API anahtarı gerektirmeyen Next.js futbol portalı.

## Özellikler
- Günün maçları
- Canlı / biten / yaklaşan maç durumları
- Futbol haber akışı
- Mobil uyumlu arayüz
- Sunucu tarafında HTML scraping

## Veri kaynağı
- Maçlar: Sky Sports Scores & Fixtures
- Haberler: Sky Sports Football News

## Lokal çalıştırma
```bash
npm install
npm run dev
```

## Deploy
Vercel üzerinde bu GitHub repository'sini import etmek yeterlidir. Environment variable gerekmez.

> Not: Scraping kaynak sitenin HTML yapısına bağlıdır. Kaynak site yapısı değişirse `lib/sky.js` içindeki seçiciler güncellenmelidir.
