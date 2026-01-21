# Be Tennis - Club Admin Web Application

## Proje Özeti

Bu proje, mevcut React Native mobil uygulamasının (tennis reservation app) admin panelini Next.js 14 web uygulamasına dönüştürme projesidir. Aynı Firebase backend'i kullanarak modern ve şık bir web arayüzü oluşturulmuştur.

**Proje Dizini:** `C:\Users\Lenovo\Desktop\tennisreservation-10-enson\club-admin-web`
**Mobil Uygulama Dizini:** `C:\Users\Lenovo\Desktop\tennisreservation-10-enson\new`

---

## Tech Stack

| Kategori | Teknoloji |
|----------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| State | React hooks (useState, useEffect) |
| Forms | Native React forms |
| i18n | next-intl (11 dil) |
| Firebase | Client SDK (Firestore, Storage, Auth) |
| Icons | Lucide Icons |
| Animations | Framer Motion |
| Phone Input | react-phone-number-input |
| Location | country-state-city |

---

## Proje Yapısı

```
club-admin-web/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── courts/page.tsx
│   │   │   ├── reservations/page.tsx
│   │   │   ├── my-club/page.tsx
│   │   │   └── ... (diğer admin sayfaları)
│   │   │
│   │   ├── (landing)/
│   │   │   ├── page.tsx              # Ana landing page
│   │   │   ├── about/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── careers/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── kvkk/page.tsx
│   │   │
│   │   ├── register-club/
│   │   │   ├── page.tsx              # Kulüp kayıt formu (5 adım)
│   │   │   └── success/page.tsx      # Başarılı kayıt sayfası
│   │   │
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   └── payment/
│   │       ├── create-session/route.ts   # iyzico ödeme session oluştur
│   │       └── callback/route.ts         # iyzico callback handler
│   │
│   └── globals.css
│
├── components/
│   ├── ui/                    # shadcn/ui bileşenleri
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── shared/
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts              # Firebase config
│   │   ├── firestore.ts           # Firestore yardımcı fonksiyonlar
│   │   └── club-registration.ts   # Kulüp kayıt fonksiyonları
│   ├── types/
│   └── utils.ts
│
├── messages/
│   ├── tr.json
│   ├── en.json
│   ├── de.json
│   ├── fr.json
│   ├── es.json
│   ├── it.json
│   ├── pt.json
│   ├── ru.json
│   ├── ar.json
│   ├── zh.json
│   └── ja.json
│
├── i18n/
│   ├── routing.ts
│   └── request.ts
│
└── middleware.ts
```

---

## Firebase Yapısı

### Koleksiyonlar

**1. clubRegistration** - Kayıtlı kulüpler
```typescript
{
  clubId: string;
  clubName: string;
  authorizedPersonName: string;
  authorizedPersonEmail: string;
  clubPhone: string;
  country: string;       // ISO code (örn: "TR")
  countryName: string;
  state: string;         // ISO code
  stateName: string;
  city: string;
  clubLogo: string | null;
  clubPhotos: string[];
  adminUsername: string;
  adminPassword: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  hasTennis: boolean;
  hasPadel: boolean;
  themeColor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**2. paymentSessions** - Ödeme oturumları
```typescript
{
  provider: 'iyzico' | 'mock';
  clubId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annually';
  status: 'pending' | 'completed' | 'failed';
  token?: string;
  paymentId?: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

**3. {clubId}/clubInfo** - Kulüp detay bilgileri
```typescript
// Her kulübün kendi koleksiyonu altında
// Path: {clubId}/clubInfo
{
  clubName: string;
  themeColor: string;
  clubLogo: string | null;
  // ... diğer kulüp bilgileri
}
```

**4. {clubId}/subscription/subscription/{subscriptionId}** - Abonelik bilgileri
```typescript
{
  planId: string;
  planName: string;
  courtRange: string;
  tennisCourts: number;
  padelCourts: number;
  totalCourts: number;
  billingCycle: 'monthly' | 'annually';
  price: number;
  currency: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  startDate: Timestamp;
  endDate: Timestamp;
  autoRenew: boolean;
}
```

---

## Önemli Dosyalar ve İşlevleri

### 1. Landing Page (`app/[locale]/page.tsx`)
- Hero section with app screenshots
- Features section
- **Pricing section** (kort bazlı fiyatlandırma)
- Club Manager CTA
- Footer

**Fiyatlandırma Tiers:**
| Plan | Kort Sayısı | Aylık | Yıllık |
|------|-------------|-------|--------|
| Başlangıç | 1-3 | ₺4,999 | ₺47,990 |
| Büyüme | 4-6 | ₺9,999 | ₺95,990 |
| Profesyonel | 7-10 | ₺13,999 | ₺134,390 |
| Kurumsal | 10+ | ₺19,999 | ₺191,990 |

### 2. Register Club Page (`app/[locale]/register-club/page.tsx`)
5 adımlı multi-step form:
1. **Kulüp Bilgileri** - Kulüp adı, ülke/şehir/ilçe seçimi
2. **İletişim Bilgileri** - Yetkili adı, email, telefon, kullanıcı adı, şifre
3. **Tesisler** - Tenis/Padel seçimi, kort sayıları, tema rengi, logo
4. **Plan Seçimi** - Otomatik hesaplanan plan, aylık/yıllık seçimi
5. **Ödeme** - Kart bilgileri, şartlar onayı

**Validasyonlar:**
- Her adımda zorunlu alan kontrolü
- Step 1'de Firebase'den kulüp adı benzersizlik kontrolü
- Step 2'de Firebase'den email ve kullanıcı adı benzersizlik kontrolü
- Global error alert + input altında hata mesajı

### 3. Club Registration Functions (`lib/firebase/club-registration.ts`)
```typescript
// Benzersizlik kontrolleri
checkClubNameExists(clubName: string): Promise<boolean>
checkEmailExists(email: string): Promise<boolean>
checkAdminUsernameExists(username: string): Promise<boolean>

// Kulüp oluşturma
createClubRegistration(params: CreateClubParams): Promise<{clubId, subscriptionId, price, currency}>

// Kulüp aktivasyonu (ödeme sonrası)
activateClub(clubId: string, subscriptionId: string, paymentId: string): Promise<void>

// Fiyat hesaplama
getPricingTier(tennisCourts: number, padelCourts: number): PricingTier
```

### 4. Payment API Routes
**Create Session (`app/api/payment/create-session/route.ts`):**
- iyzico API key yoksa mock payment mode
- iyzico varsa REST API ile checkout form oluşturma
- Firestore'a session kaydetme

**Callback (`app/api/payment/callback/route.ts`):**
- Mock payment: Direkt başarılı sayıp kulübü aktifleştir
- iyzico: Payment doğrulama, kulüp aktivasyonu

### 5. Success Page (`app/[locale]/register-club/success/page.tsx`)
- Başarılı kayıt bildirimi
- Club ID gösterimi
- Sonraki adımlar listesi
- Login sayfasına yönlendirme

---

## Çeviri Sistemi (next-intl)

**Desteklenen Diller:** tr, en, de, fr, es, it, pt, ru, ar, zh, ja

**Önemli Çeviri Anahtarları:**
```
landing.pricing.*          - Fiyatlandırma bölümü
registerClub.*             - Kulüp kayıt formu
registerClub.errors.*      - Hata mesajları
registerClub.validation.*  - Validasyon mesajları
registerClub.success.*     - Başarı sayfası
```

---

## Environment Variables

```env
# Firebase (zaten config.ts'de hardcoded)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# iyzico (opsiyonel - yoksa mock mode çalışır)
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_ENV=sandbox  # veya production

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Tema Renkleri (Mobil App ile Aynı)

```typescript
const THEME_COLORS = [
  { color: "#0066CC", key: "blue" },
  { color: "#218838", key: "green" },
  { color: "#C82333", key: "red" },
  { color: "#5A32A3", key: "purple" },
  { color: "#E8590C", key: "orange" },
  { color: "#E6A800", key: "yellow" },
  { color: "#17A085", key: "turquoise" },
  { color: "#D63384", key: "pink" },
  { color: "#138496", key: "cyan" },
];
```

---

## Tamamlanan Özellikler

- [x] Landing page tasarımı
- [x] Fiyatlandırma bölümü (kort bazlı)
- [x] Kulüp kayıt sayfası (5 adımlı form)
- [x] Ülke/Şehir/İlçe seçici (country-state-city)
- [x] Uluslararası telefon girişi (react-phone-number-input)
- [x] Tema rengi seçici
- [x] Firebase kulüp oluşturma fonksiyonları
- [x] Benzersizlik kontrolleri (kulüp adı, email, username)
- [x] iyzico ödeme entegrasyonu (mock + production)
- [x] Başarı sayfası
- [x] 11 dil desteği
- [x] Privacy, Terms, KVKK sayfaları

## Bekleyen Özellikler

- [ ] Admin dashboard'a abonelik durumu ekleme
- [ ] Abonelik yenileme paneli
- [ ] Email bildirim sistemi
- [ ] Kulüp yönetim paneli özellikleri

---

## Geliştirme Komutları

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start
```

---

## Notlar

1. **Firebase Config:** `lib/firebase/config.ts` dosyasında hardcoded. Production için env variable'a taşınabilir.

2. **iyzico:** SDK yerine REST API kullanılıyor (Turbopack uyumluluk sorunu nedeniyle).

3. **Mock Payment:** iyzico API key'leri yoksa otomatik mock mode'da çalışır - development için ideal.

4. **Mobil App Referansları:**
   - `new/src/admin/myClubManager/MyClubManager.tsx` - ClubData yapısı
   - `new/src/components/CountryStateCityPickerModal.tsx` - Lokasyon seçici
   - `new/src/components/InternationalPhoneInput.tsx` - Telefon girişi
   - `new/functions/src/paymentFunctions.ts` - Ödeme fonksiyonları

5. **Branding:** "TennisApp" yerine "Be Tennis" kullanılıyor, logo "B" harfi.
