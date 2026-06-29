# DE3R CLAN BOT - final accept

## Co jest dodane

- Panel ticketów wysyła się automatycznie na `1389543966361387008`
- Panel weryfikacji wysyła się automatycznie na `1389267548662399026`
- Weryfikacja nadaje rolę `1389266494784802930`
- Rekrutacja tworzy ticket po wpisaniu nicku Roblox
- W tickecie rekrutacji jest przycisk:
  - kłódka = zamknięcie ticketu
  - animowane TAK = akceptacja rekrutacji
- Dopiero po kliknięciu animowanego TAK bot:
  - nadaje rolę `1389323823240843365`
  - zmienia nick na serwerze, np. `ryzen` → `ryzen (ryzen777)`

## Railway Variables

Minimum:

```txt
TOKEN=token twojego bota
```

Wszystkie ID są już wpisane domyślnie, ale możesz dodać:

```txt
PANEL_CHANNEL_ID=1389543966361387008
OFFICER_ROLE_ID=1389263773482614905
REKRUTACJA_CATEGORY_ID=1521151552637632522
CLAN_MEMBER_ROLE_ID=1389323823240843365

VERIFY_CHANNEL_ID=1389267548662399026
VERIFIED_ROLE_ID=1389266494784802930
```

## Ważne uprawnienia bota

Bot potrzebuje:

```txt
View Channel
Send Messages
Embed Links
Read Message History
Use External Emojis
Manage Channels
Manage Roles
Manage Nicknames
```

Rola bota musi być wyżej niż:
- rola `1389323823240843365`
- rola `1389266494784802930`
- role osób, którym ma zmieniać nick


## Poprawka weryfikacji

- działania w weryfikacji są teraz tylko do 10
- w okienku nie pokazuje już tekstu typu `<a:nie:ID>`
- przykład działania: `Ile to: 7 + 2 ?`
