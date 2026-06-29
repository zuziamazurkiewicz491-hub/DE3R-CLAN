# DE3R CLAN Ticket Bot - Rekrutacja wymagania

Zmiany:
- panel wysyła się automatycznie po starcie
- rekrutacja pokazuje wymagania DE3R CLAN
- użytkownik wybiera TAK/NIE w menu
- po wybraniu TAK otwiera się okienko na nick Roblox
- po wybraniu NIE ticket się nie tworzy
- w tickecie rekrutacji pokazuje się: `Zgadza się z wymaganiami: TAK`
- pole `Napisz coś o sobie` jest usunięte z rekrutacji

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

## Uprawnienia bota

Bot musi mieć na kanale panelu:
- View Channel
- Send Messages
- Embed Links
- Read Message History
- Use External Emojis

Do tworzenia ticketów:
- Manage Channels
