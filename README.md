# DE3R CLAN Ticket Bot - Nick Roblox

Zmiany:
- po podaniu nicku Roblox bot próbuje zmienić nick użytkownika na serwerze
- przykład: `ryzen` → `ryzen (ryzen777)`
- działa przy Pomocy i Rekrutacji
- w tickecie pokazuje, czy nick został zmieniony

## Ważne

Bot musi mieć uprawnienie:

```txt
Manage Nicknames / Zarządzanie pseudonimami
```

Rola bota musi być WYŻEJ niż rola osoby, której nick ma zmienić.
Bot nie zmieni nicku właścicielowi serwera ani osobie z wyższą/równą rolą.

## Railway Variables

W Railway dodaj:

```txt
TOKEN=token twojego bota
```

Opcjonalnie:

```txt
PANEL_CHANNEL_ID=1389543966361387008
OFFICER_ROLE_ID=1389263773482614905
REKRUTACJA_CATEGORY_ID=1521151552637632522
POMOC_CATEGORY_ID=
```

## Start

```txt
npm start
```
