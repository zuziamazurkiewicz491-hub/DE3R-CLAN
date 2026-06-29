# DE3R CLAN Ticket Bot - Auto Panel

Ten bot NIE potrzebuje komendy `/panel`.

Po uruchomieniu automatycznie wysyła panel na kanał:

```txt
1389543966361387008
```

Jak panel już istnieje, bot go zaktualizuje zamiast wysyłać duplikat.

## Railway Variables

W Railway dodaj minimum:

```txt
TOKEN=token twojego bota
```

Najlepiej dodaj też:

```txt
GUILD_ID=id twojego serwera
```

Reszta jest już ustawiona domyślnie w kodzie:

```txt
PANEL_CHANNEL_ID=1389543966361387008
OFFICER_ROLE_ID=1389263773482614905
REKRUTACJA_CATEGORY_ID=1521151552637632522
```

## Co to jest GUILD_ID?

GUILD_ID to ID twojego serwera Discord.

Jak je skopiować:
1. Discord → Ustawienia użytkownika
2. Zaawansowane
3. Włącz "Tryb dewelopera"
4. Kliknij prawym na ikonę swojego serwera
5. Kliknij "Kopiuj ID serwera"

## Start command na Railway

```txt
npm start
```

## Uprawnienia bota

Bot musi mieć:
- View Channels
- Send Messages
- Embed Links
- Manage Channels
- Use External Emojis
- Read Message History

Bot musi być zaproszony ze scope:
- bot
