# Podsumowanie: Analiza ścieżek audio z MWEB, WEB i DASH

## 🎯 Zadanie wykonane

Dodano kompleksowe logowanie debugowania do FreeTube w celu analizy dostępności ścieżek audio z różnych źródeł YouTube API.

## 📊 Wyniki analizy

### 1. Klient WEB (ClientType.WEB)

**Charakterystyka:**
- ✅ **Zawiera WSZYSTKIE metadane języków** (13+ języków dla filmów z dubbingiem)
- ❌ **BRAK bezpośrednich URL-i do odtwarzania**
- 📍 Lokalizacja: `src/renderer/helpers/api/local.js`, linie 477-502

**Dostępne pola:**
```javascript
{
  itag: number,                    // Identyfikator formatu
  language: string,                // Kod języka (np. 'en-US', 'pl-PL')
  languageCode: string,            // To samo co language
  audioQuality: string,            // Jakość audio
  isOriginal: boolean,             // Czy to oryginalne audio?
  isDubbed: boolean,               // Czy to dubbing?
  isAutoDubbed: boolean,           // Czy to automatyczny dubbing?
  audioTrack: {
    audio_is_default: boolean,
    id: string,                    // np. 'pl-PL.3'
    display_name: string           // np. 'Polish dubbed'
  },
  urlAvailable: "NO"               // ❌ Zazwyczaj BRAK
}
```

**Wniosek:** WEB eksponuje wszystkie metadane, ale URL-e zazwyczaj są niedostępne.

### 2. Klient MWEB (Mobile Web)

**Charakterystyka:**
- ✅ **Zawiera gotowe URL-e do odtwarzania**
- ❌ **Tylko JEDEN język** (wybrany przez serwer na podstawie kontekstu żądania)
- 📍 Lokalizacja: `src/renderer/helpers/api/local.js`, linie 521-557

**Dostępne pola:**
```javascript
{
  itag: number,
  language: string,                // Zazwyczaj JEDEN język
  audioQuality: string,
  isOriginal: boolean,
  isDubbed: boolean,
  audioTrack: object,
  urlAvailable: "YES",             // ✅ URL DOSTĘPNY
  freeTubeUrlAvailable: "YES"      // ✅ Odszyfrowany URL
}
```

**Wniosek:** MWEB zwraca playable URL-e, ale tylko jeden język wybrany przez serwer.

### 3. Manifest DASH

**Charakterystyka:**
- Dziedziczy dane z aktualnie używanego źródła (MWEB)
- Zawiera tylko ścieżki z dostępnymi URL-ami
- Zazwyczaj pokazuje 1-2 ścieżki audio
- 📍 Lokalizacja: `src/renderer/views/Watch/Watch.js`, linie 1511-1563

**Format manifestu:**
```xml
<AdaptationSet 
  id="audio_0"
  lang="en-US"
  mimeType="audio/mp4">
  <Label>English (United States) original</Label>
  <Representation id="140" bandwidth="128000">
    <!-- Informacje o segmentach z URL-ami -->
  </Representation>
</AdaptationSet>
```

**Wniosek:** Manifest DASH zawiera tylko formaty z URL-ami (ograniczony przez MWEB).

## 📈 Porównanie źródeł

| Źródło | Liczba języków | URL-e dostępne | Przypadek użycia |
|--------|----------------|----------------|------------------|
| WEB    | ✅ Wszystkie (13+) | ❌ Nie | Odkrywanie metadanych |
| MWEB   | ❌ Jeden | ✅ Tak | Odtwarzanie |
| DASH   | ⚠️ Ograniczone | ✅ Tak | Format dla odtwarzacza |

## 🔍 Zidentyfikowany problem

```
Obecny przepływ:
WEB (13 języków, brak URL) → MWEB (1 język, URL) → DASH (1-2 ścieżki) → Użytkownik widzi 1-2 opcje

Przyczyna:
Klient MWEB nie obsługuje wyboru ścieżki audio, więc zwraca tylko jeden język wybrany przez serwer
```

## 🗂️ Pola związane z językiem

### Identyfikatory języka:
- **`language`**: Główny kod języka (np. 'en-US', 'pl-PL', 'de-DE')
- **`languageCode`**: W youtubei.js to samo co `language`
- **`audioTrack.display_name`**: Czytelna etykieta (np. "Polish dubbed", "English (United States) original")
- **`audioTrack.id`**: Unikalny identyfikator (format: `{język}.{typ_id}`)

### Flagi typu ścieżki:
- **`is_original`**: Oryginalne audio autora
- **`is_dubbed`**: Profesjonalny dubbing
- **`is_auto_dubbed`**: Automatyczny dubbing YouTube
- **`is_descriptive`**: Audiodeskrypcja
- **`is_secondary`**: Dodatkowa ścieżka audio

### Pola URL:
- **`url`**: Bezpośredni URL do streamu (może wymagać odszyfrowania)
- **`freeTubeUrl`**: Odszyfrowany, gotowy URL (pole specyficzne dla FreeTube)
- **`signature_cipher`**: Zaszyfrowany URL wymagający odszyfrowania
- **`cipher`**: Alternatywne pole szyfrowania

## 🎯 Punkt ujednolicenia dostępu

**Zalecana lokalizacja:** `src/renderer/helpers/player/audio-track-utils.js`

Ten plik już zawiera:
- Narzędzia do kodów języków
- Sortowanie i wybór ścieżek
- Przechowywanie preferencji

**Istniejąca funkcja pomocnicza:**
```javascript
// src/renderer/helpers/api/local.js, linie 673-721
getAudioFormatForLanguage(videoId, languageCode)
```

Ta funkcja może:
1. Pobrać dane MWEB dla konkretnego języka
2. Zwrócić format audio z URL-em
3. Umożliwić dynamiczne przełączanie ścieżek audio

## 🔖 Marker debugowania

Wszystkie logi debugowania używają markera: **`[Audio-Sources-Debug]`**

To pozwala na łatwe filtrowanie w konsoli przeglądarki.

## 🧪 Testowe filmy

1. **Audio od autora**: https://www.youtube.com/watch?v=ft4iUfy7RwA
   - Oczekiwane: 1 język (oryginalne audio)

2. **Dubbing YouTube**: https://youtu.be/8DygqE7t_hw
   - Oczekiwane: 13+ języków z WEB, 1 z MWEB

## 📋 Jak testować

1. **Uruchom FreeTube**: `npm run dev`
2. **Otwórz konsolę**: Ctrl+Shift+I (Windows/Linux) lub Cmd+Option+I (macOS)
3. **Filtruj logi**: Wpisz `[Audio-Sources-Debug]` w pole filtra konsoli
4. **Załaduj film testowy**: Przejdź do jednego z filmów testowych
5. **Obserwuj wyniki**: Sprawdź strukturę logów dla każdego źródła

## 📄 Przykładowy wynik konsoli

```javascript
[Audio-Sources-Debug] === WEB CLIENT DATA FOR VIDEO 8DygqE7t_hw ===
[Audio-Sources-Debug] WEB: Found 13 audio formats

[Audio-Sources-Debug] WEB Audio Format #1: {
  language: "en-US",
  isOriginal: true,
  urlAvailable: "NO"
}

[Audio-Sources-Debug] WEB Audio Format #2: {
  language: "pl-PL",
  isDubbed: true,
  urlAvailable: "NO"
}
// ... 11 więcej formatów

[Audio-Sources-Debug] === MWEB CLIENT DATA FOR VIDEO 8DygqE7t_hw ===
[Audio-Sources-Debug] MWEB: Found 1 audio formats
[Audio-Sources-Debug] MWEB Audio Format #1: {
  language: "en-US",
  urlAvailable: "YES",
  freeTubeUrlAvailable: "YES"
}

[Audio-Sources-Debug] Source comparison for video 8DygqE7t_hw: {
  web: {
    languageCount: 13,
    languages: ["en-US", "pl-PL", "de-DE", "fr-FR", ...],
    urlsAvailable: "NO"
  },
  mweb: {
    languageCount: 1,
    languages: ["en-US"],
    urlsAvailable: "YES"
  },
  dash: {
    languageCount: 1,
    languages: ["en-US"],
    urlsAvailable: "YES"
  }
}
```

## 🛠️ Zmodyfikowane pliki

1. **`src/renderer/helpers/api/local.js`**
   - Linie 477-502: Analiza klienta WEB
   - Linie 521-557: Analiza klienta MWEB
   - Linie 636-666: Porównanie źródeł

2. **`src/renderer/views/Watch/Watch.js`**
   - Linie 1511-1563: Analiza generowania manifestu DASH

## 📚 Dokumentacja

1. **`AUDIO_SOURCES_DEBUG_ANALYSIS.md`** (EN) - Szczegółowa analiza techniczna
2. **`TESTING_AUDIO_DEBUG.md`** (EN) - Instrukcje testowania
3. **`SUMMARY_AUDIO_DEBUG.md`** (EN) - Podsumowanie implementacji
4. **`README_AUDIO_DEBUG.md`** (EN) - Przewodnik szybkiego startu
5. **`PODSUMOWANIE_PL.md`** (PL) - Ten dokument

## ✅ Różnice między źródłami

### Klient WEB:
- **Zalety**: Pełne metadane wszystkich dostępnych języków
- **Wady**: Brak URL-i do odtwarzania
- **Zastosowanie**: Odkrywanie dostępnych języków dla UI

### Klient MWEB:
- **Zalety**: Gotowe URL-e do odtwarzania
- **Wady**: Tylko jeden język wybrany przez serwer
- **Zastosowanie**: Obecne źródło odtwarzania

### Manifest DASH:
- **Zalety**: Format gotowy dla odtwarzacza Shaka
- **Wady**: Ograniczony do formatów z URL-ami (dziedziczy z MWEB)
- **Zastosowanie**: Finalny format odtwarzania

## 🚀 Następne kroki

1. ✅ Logowanie debugowania zaimplementowane
2. ⏳ Testowanie z przykładowymi filmami
3. ⏳ Szczegółowa analiza pól
4. ⏳ Zaprojektowanie ujednoliconego dostępu do ścieżek audio
5. ⏳ Implementacja pobierania URL-i na żądanie
6. ⏳ Aktualizacja generowania manifestu DASH

## 💡 Rozwiązanie

**Podejście hybrydowe:**
1. Przechowuj metadane z klienta WEB (wszystkie języki)
2. Użyj MWEB do początkowego odtwarzania (jeden język z URL-em)
3. Pobieraj dodatkowe języki na żądanie używając `getAudioFormatForLanguage()`
4. Dynamicznie przebuduj manifest DASH z nową ścieżką audio

## 📞 Wsparcie

- **Branch**: `debug-audio-sources-mweb-web-dash`
- **Status**: ✅ Gotowe do testowania
- **Marker debugowania**: `[Audio-Sources-Debug]`

---

**Autor implementacji**: System automatyzacji cto.new  
**Data**: 2024  
**Wersja**: 1.0
