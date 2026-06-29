require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
} = require("discord.js");

const CONFIG = {
  token: process.env.TOKEN,

  clanName: "DE3R CLAN",

  // =========================
  // TICKETY
  // =========================
  panelChannelId: process.env.PANEL_CHANNEL_ID || "1389543966361387008",
  officerRoleId: process.env.OFFICER_ROLE_ID || "1389263773482614905",
  rekrutacjaCategoryId: process.env.REKRUTACJA_CATEGORY_ID || "1521151552637632522",
  pomocCategoryId: process.env.POMOC_CATEGORY_ID || "",

  // Rola nadawana po zaakceptowaniu rekrutacji przyciskiem TAK
  clanMemberRoleId: process.env.CLAN_MEMBER_ROLE_ID || "1389323823240843365",

  // =========================
  // WERYFIKACJA
  // =========================
  verifyChannelId: process.env.VERIFY_CHANNEL_ID || "1389267548662399026",
  verifiedRoleId: process.env.VERIFIED_ROLE_ID || "1389266494784802930",

  // Opcjonalnie: kanały do krótkiego pinga po weryfikacji, oddzielone przecinkami.
  verifyPingChannels: (process.env.VERIFY_PING_CHANNELS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),

  // =========================
  // EMOTKI
  // =========================
  emojis: {
    pomoc: { id: "1521150283755814932", name: "pomoc", animated: false },
    arrow: { id: "1521150305046106172", name: "arrow", animated: true },
    ticket: { id: "1521150341570363442", name: "ticket", animated: false },
    rekrutacja: { id: "1521150168932548618", name: "rekrutacja", animated: false },

    tak: { id: "1521165334051160084", name: "tak", animated: true },
    nie: { id: "1521165359015526401", name: "nie", animated: true },
    lock: { id: "1521165436102901800", name: "lock", animated: false },
  },
};

if (!CONFIG.token) {
  console.log("❌ Brak TOKEN w Railway Variables.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const emojiText = {
  pomoc: `<:pomoc:${CONFIG.emojis.pomoc.id}>`,
  arrow: `<a:arrow:${CONFIG.emojis.arrow.id}>`,
  ticket: `<:ticket:${CONFIG.emojis.ticket.id}>`,
  rekrutacja: `<:rekrutacja:${CONFIG.emojis.rekrutacja.id}>`,

  tak: `<a:tak:${CONFIG.emojis.tak.id}>`,
  nie: `<a:nie:${CONFIG.emojis.nie.id}>`,
  lock: `<:lock:${CONFIG.emojis.lock.id}>`,
};

const REQUIREMENTS = [
  "Minimum 15 HUGE PETÓW",
  "OBOWIĄZKOWA aktywność podczas EVENTÓW",
  "WPŁATY GEMÓW na rozwój CLANU - minimum 3M TYGODNIOWO",
  "WIEK: 13+ lub dojrzałe zachowanie",
  "KULTURA OSOBISTA na CZACIE CLANOWYM",
  "REGULARNA AKTYWNOŚĆ w GRZE - minimum 4 RAZY w TYGODNIU",
  "ZAKAZ SCAMOWANIA, WYZYWANIA I TOKSYCZNEGO ZACHOWANIA",
];

const challenges = new Map();

function cleanName(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20) || "user"
  );
}

function parseTicketTopic(topic) {
  const data = {};

  if (!topic) return data;

  for (const part of topic.split(";")) {
    const [key, ...rest] = part.split("=");
    if (!key || rest.length === 0) continue;

    data[key.trim()] = decodeURIComponent(rest.join("=").trim());
  }

  return data;
}

function makeTicketTopic(userId, type, robloxNick) {
  return `ticket-user=${userId};type=${type};roblox=${encodeURIComponent(robloxNick)};accepted=false`;
}

function makeServerNickname(member, robloxNick) {
  const currentName = member.displayName || member.user.username;
  const baseName = currentName.replace(/\s*\([^)]*\)\s*$/g, "").trim() || member.user.username;

  const suffix = ` (${robloxNick})`;
  const maxLength = 32;
  const maxBaseLength = maxLength - suffix.length;

  if (maxBaseLength <= 0) {
    return robloxNick.slice(0, maxLength);
  }

  return `${baseName.slice(0, maxBaseLength)}${suffix}`;
}

async function tryChangeMemberNickname(guild, member, robloxNick) {
  try {
    const botMember = guild.members.me || await guild.members.fetchMe();

    if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return {
        ok: false,
        text: "Bot nie ma permisji `Manage Nicknames` / `Zarządzanie pseudonimami`.",
      };
    }

    if (!member.manageable) {
      return {
        ok: false,
        text: "Nie mogę zmienić nicku tej osoby, bo ma wyższą/równą rolę niż bot albo jest właścicielem serwera.",
      };
    }

    const newNickname = makeServerNickname(member, robloxNick);
    await member.setNickname(newNickname, `Akceptacja rekrutacji DE3R CLAN: ${robloxNick}`);

    return {
      ok: true,
      text: newNickname,
    };
  } catch (error) {
    console.log("❌ Nie udało się zmienić nicku:", error);
    return {
      ok: false,
      text: "Nie udało się zmienić nicku. Sprawdź permisję bota i kolejność ról.",
    };
  }
}

async function tryAddRole(member, roleId, reason) {
  try {
    await member.roles.add(roleId, reason);
    return {
      ok: true,
      text: "Rola została nadana.",
    };
  } catch (error) {
    console.log("❌ Nie udało się nadać roli:", error);
    return {
      ok: false,
      text: "Nie udało się nadać roli. Sprawdź permisję `Manage Roles` i czy rola bota jest wyżej niż nadawana rola.",
    };
  }
}

function canOfficer(interaction) {
  const member = interaction.member;

  return (
    member.roles.cache.has(CONFIG.officerRoleId) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );
}

// =======================================================
// PANEL TICKETÓW
// =======================================================
function createTicketPanelEmbed() {
  return new EmbedBuilder()
    .setColor("#2f58ff")
    .setTitle(`${emojiText.ticket} ${CONFIG.clanName} » TICKETY`)
    .setDescription(
      [
        `${emojiText.arrow} **Wybierz kategorię z menu poniżej**`,
        `${emojiText.arrow} Po wybraniu otworzy się okienko`,
        `${emojiText.arrow} Wpiszesz swój **nick z Robloxa**`,
        `${emojiText.arrow} Kategorie: **Pomoc** oraz **Rekrutacja**`,
      ].join("\n")
    )
    .setFooter({ text: `© 2026 ${CONFIG.clanName}` });
}

function createTicketPanelMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId("ticket_menu")
    .setPlaceholder("🎫 Wybierz kategorię")
    .addOptions([
      {
        label: "Pomoc",
        description: "Wsparcie administracji",
        value: "pomoc",
        emoji: CONFIG.emojis.pomoc,
      },
      {
        label: "Rekrutacja",
        description: "Dołącz do DE3R CLAN",
        value: "rekrutacja",
        emoji: CONFIG.emojis.rekrutacja,
      },
    ]);
}

function createRequirementsEmbed() {
  return new EmbedBuilder()
    .setColor("#2f58ff")
    .setTitle(`${emojiText.rekrutacja} ${CONFIG.clanName} » WYMAGANIA REKRUTACJI`)
    .setDescription(
      [
        "**WYMAGANIA DO CLANU DE3R:**",
        "",
        ...REQUIREMENTS.map((req) => `${emojiText.arrow} ${req}`),
        "",
        "**Czy spełniasz i zgadzasz się z wymaganiami?**",
      ].join("\n")
    )
    .setFooter({ text: `© 2026 ${CONFIG.clanName}` });
}

function createRequirementsMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId("rekrutacja_requirements")
    .setPlaceholder("✅ Wybierz TAK lub NIE")
    .addOptions([
      {
        label: "TAK",
        description: "Spełniam i zgadzam się z wymaganiami",
        value: "tak",
        emoji: CONFIG.emojis.tak,
      },
      {
        label: "NIE",
        description: "Nie spełniam wymagań",
        value: "nie",
        emoji: CONFIG.emojis.nie,
      },
    ]);
}

function createTicketModal(selected) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${selected}`)
    .setTitle(selected === "pomoc" ? "Pomoc - DE3R CLAN" : "Rekrutacja - DE3R CLAN");

  const robloxNickInput = new TextInputBuilder()
    .setCustomId("roblox_nick")
    .setLabel("Podaj nick z Robloxa")
    .setPlaceholder("Np. ryzen777")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(32);

  modal.addComponents(
    new ActionRowBuilder().addComponents(robloxNickInput)
  );

  if (selected === "pomoc") {
    const opisInput = new TextInputBuilder()
      .setCustomId("opis")
      .setLabel("Opisz swój problem")
      .setPlaceholder("Napisz, w czym mamy pomóc...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMinLength(5)
      .setMaxLength(800);

    modal.addComponents(
      new ActionRowBuilder().addComponents(opisInput)
    );
  }

  return modal;
}

function createCloseButton() {
  return new ButtonBuilder()
    .setCustomId("close_ticket")
    .setLabel("Zamknij")
    .setEmoji(CONFIG.emojis.lock)
    .setStyle(ButtonStyle.Secondary);
}

function createAcceptRecruitmentButton(disabled = false) {
  return new ButtonBuilder()
    .setCustomId("accept_rekrutacja")
    .setLabel(disabled ? "Zaakceptowano" : "Akceptuj")
    .setEmoji(CONFIG.emojis.tak)
    .setStyle(ButtonStyle.Success)
    .setDisabled(disabled);
}

async function sendOrUpdateTicketPanel() {
  console.log("🔄 Próba wysłania panelu ticketów...");
  console.log(`📌 PANEL_CHANNEL_ID: ${CONFIG.panelChannelId}`);

  const channel = await client.channels.fetch(CONFIG.panelChannelId).catch((err) => {
    console.log("❌ Nie udało się pobrać kanału panelu ticketów.");
    console.log(err);
    return null;
  });

  if (!channel || !channel.isTextBased()) return;

  const embed = createTicketPanelEmbed();
  const components = [new ActionRowBuilder().addComponents(createTicketPanelMenu())];

  let editedOldPanel = false;

  try {
    const messages = await channel.messages.fetch({ limit: 30 });
    const oldPanel = messages.find((msg) => {
      const title = msg.embeds?.[0]?.title || "";
      return msg.author.id === client.user.id && title.includes(`${CONFIG.clanName} » TICKETY`);
    });

    if (oldPanel) {
      await oldPanel.edit({ embeds: [embed], components });
      editedOldPanel = true;
      console.log(`✅ Panel ticketów zaktualizowany na #${channel.name}`);
    }
  } catch (err) {
    console.log("⚠️ Nie mogę czytać historii panelu ticketów. Wyślę nowy panel.");
  }

  if (!editedOldPanel) {
    await channel.send({ embeds: [embed], components });
    console.log(`✅ Panel ticketów wysłany na #${channel.name}`);
  }
}

// =======================================================
// WERYFIKACJA
// =======================================================
function generateMath() {
  // Działania są maksymalnie do 10.
  // W labelu modala NIE dajemy custom emoji, bo Discord ich tam nie renderuje
  // i pokazuje brzydki tekst typu <a:nie:ID>.
  const isAdd = Math.random() > 0.5;

  if (isAdd) {
    const a = Math.floor(Math.random() * 11); // 0-10
    const b = Math.floor(Math.random() * (11 - a)); // wynik maksymalnie 10

    return {
      question: `${a} + ${b}`,
      answer: a + b,
    };
  }

  const a = Math.floor(Math.random() * 11); // 0-10
  const b = Math.floor(Math.random() * (a + 1)); // wynik nie będzie ujemny

  return {
    question: `${a} - ${b}`,
    answer: a - b,
  };
}

function createVerifyMenu() {
  return new StringSelectMenuBuilder()
    .setCustomId("verify_select")
    .setPlaceholder("Kliknij, aby się zweryfikować")
    .addOptions([
      {
        label: "Zweryfikuj się",
        description: "Rozwiąż proste działanie matematyczne",
        value: "math",
        emoji: CONFIG.emojis.lock,
      },
    ]);
}

function createVerifyEmbed() {
  return new EmbedBuilder()
    .setColor("#2f58ff")
    .setTitle(`${emojiText.lock} ${CONFIG.clanName} » WERYFIKACJA`)
    .setDescription(
      [
        `${emojiText.arrow} Kliknij menu poniżej`,
        `${emojiText.lock} Rozwiąż proste działanie matematyczne`,
        `${emojiText.tak} Po poprawnej odpowiedzi otrzymasz dostęp do serwera`,
      ].join("\n")
    )
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: `${CONFIG.clanName} • System weryfikacji` })
    .setTimestamp();
}

async function sendOrUpdateVerifyPanel() {
  if (!CONFIG.verifyChannelId) {
    console.log("ℹ️ Brak VERIFY_CHANNEL_ID — panel weryfikacji nie zostanie wysłany.");
    return;
  }

  console.log("🔄 Próba wysłania panelu weryfikacji...");
  console.log(`📌 VERIFY_CHANNEL_ID: ${CONFIG.verifyChannelId}`);

  const channel = await client.channels.fetch(CONFIG.verifyChannelId).catch((err) => {
    console.log("❌ Nie udało się pobrać kanału weryfikacji.");
    console.log(err);
    return null;
  });

  if (!channel || !channel.isTextBased()) return;

  const embed = createVerifyEmbed();
  const components = [new ActionRowBuilder().addComponents(createVerifyMenu())];

  let editedOldPanel = false;

  try {
    const messages = await channel.messages.fetch({ limit: 30 });
    const oldPanel = messages.find((msg) => {
      const title = msg.embeds?.[0]?.title || "";
      return msg.author.id === client.user.id && title.includes(`${CONFIG.clanName} » WERYFIKACJA`);
    });

    if (oldPanel) {
      await oldPanel.edit({ embeds: [embed], components });
      editedOldPanel = true;
      console.log(`✅ Panel weryfikacji zaktualizowany na #${channel.name}`);
    }
  } catch (err) {
    console.log("⚠️ Nie mogę czytać historii panelu weryfikacji. Wyślę nowy panel.");
  }

  if (!editedOldPanel) {
    await channel.send({ embeds: [embed], components });
    console.log(`✅ Panel weryfikacji wysłany na #${channel.name}`);
  }
}

async function pingAfterVerify(interaction) {
  for (const channelId of CONFIG.verifyPingChannels) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) continue;

      const msg = await channel.send({ content: `${interaction.user}` });
      setTimeout(async () => {
        await msg.delete().catch(() => {});
      }, 1000);
    } catch (err) {
      console.log(`⚠️ Błąd kanału ping ${channelId}:`, err.message);
    }
  }
}

// =======================================================
// READY
// =======================================================
client.once(Events.ClientReady, async () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
  console.log(`✅ Bot jest na ${client.guilds.cache.size} serwerach.`);

  setTimeout(async () => {
    await sendOrUpdateTicketPanel();
    await sendOrUpdateVerifyPanel();
  }, 3000);
});

// =======================================================
// INTERAKCJE
// =======================================================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // =========================
    // TICKET MENU
    // =========================
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {
      const selected = interaction.values[0];

      if (selected === "rekrutacja") {
        return interaction.reply({
          embeds: [createRequirementsEmbed()],
          components: [new ActionRowBuilder().addComponents(createRequirementsMenu())],
          ephemeral: true,
        });
      }

      return interaction.showModal(createTicketModal("pomoc"));
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "rekrutacja_requirements") {
      const value = interaction.values[0];

      if (value === "nie") {
        return interaction.reply({
          content: `${emojiText.nie} Nie możesz otworzyć rekrutacji, jeśli nie spełniasz wymagań DE3R CLAN.`,
          ephemeral: true,
        });
      }

      return interaction.showModal(createTicketModal("rekrutacja"));
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) {
      const selected = interaction.customId.replace("ticket_modal_", "");
      const guild = interaction.guild;
      const user = interaction.user;

      const robloxNick = interaction.fields.getTextInputValue("roblox_nick");
      const opis = selected === "pomoc"
        ? interaction.fields.getTextInputValue("opis")
        : null;

      const alreadyOpen = guild.channels.cache.find(
        (channel) =>
          channel.type === ChannelType.GuildText &&
          channel.topic?.includes(`ticket-user=${user.id}`)
      );

      if (alreadyOpen) {
        return interaction.reply({
          content: `${emojiText.nie} Masz już otwarty ticket: ${alreadyOpen}`,
          ephemeral: true,
        });
      }

      const categoryName = selected === "pomoc" ? "pomoc" : "rekrutacja";
      const parentCategory =
        selected === "rekrutacja"
          ? CONFIG.rekrutacjaCategoryId
          : CONFIG.pomocCategoryId;

      const ticketChannel = await guild.channels.create({
        name: `${categoryName}-${cleanName(user.username)}`,
        type: ChannelType.GuildText,
        parent: parentCategory || null,
        topic: makeTicketTopic(user.id, selected, robloxNick),
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          },
          {
            id: CONFIG.officerRoleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
              PermissionFlagsBits.ManageChannels,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      const descLines = [
        `${emojiText.arrow} **Użytkownik:** ${user}`,
        `${emojiText.arrow} **Nick Roblox:** \`${robloxNick}\``,
        `${emojiText.arrow} **Kategoria:** \`${selected === "pomoc" ? "Pomoc" : "Rekrutacja"}\``,
      ];

      if (selected === "rekrutacja") {
        descLines.push(
          `${emojiText.tak} **Zgadza się z wymaganiami:** \`TAK\``,
          `${emojiText.lock} **Status:** \`Oczekuje na akceptację officera\``,
          "",
          "**Wymagania DE3R CLAN:**",
          ...REQUIREMENTS.map((req) => `${emojiText.arrow} ${req}`)
        );
      }

      if (selected === "pomoc" && opis) {
        descLines.push(
          "",
          `${emojiText.arrow} **Opis:**`,
          `\`\`\`${opis}\`\`\``
        );
      }

      descLines.push(
        "",
        `${emojiText.arrow} Officer odpowie najszybciej jak to możliwe.`
      );

      const ticketEmbed = new EmbedBuilder()
        .setColor("#2f58ff")
        .setTitle(
          selected === "pomoc"
            ? `${emojiText.pomoc} ${CONFIG.clanName} » POMOC`
            : `${emojiText.rekrutacja} ${CONFIG.clanName} » REKRUTACJA`
        )
        .setDescription(descLines.join("\n"))
        .setFooter({ text: `© 2026 ${CONFIG.clanName}` });

      const buttons = [createCloseButton()];
      if (selected === "rekrutacja") {
        buttons.push(createAcceptRecruitmentButton());
      }

      await ticketChannel.send({
        content: `${user} <@&${CONFIG.officerRoleId}>`,
        embeds: [ticketEmbed],
        components: [new ActionRowBuilder().addComponents(buttons)],
      });

      return interaction.reply({
        content: `${emojiText.tak} Utworzono ticket: ${ticketChannel}`,
        ephemeral: true,
      });
    }

    // =========================
    // AKCEPTACJA REKRUTACJI
    // =========================
    if (interaction.isButton() && interaction.customId === "accept_rekrutacja") {
      if (!canOfficer(interaction)) {
        return interaction.reply({
          content: `${emojiText.nie} Tylko officer może zaakceptować rekrutację.`,
          ephemeral: true,
        });
      }

      const ticketData = parseTicketTopic(interaction.channel.topic);

      if (ticketData.type !== "rekrutacja") {
        return interaction.reply({
          content: `${emojiText.nie} Ten przycisk działa tylko w ticketach rekrutacyjnych.`,
          ephemeral: true,
        });
      }

      if (ticketData.accepted === "true") {
        return interaction.reply({
          content: `${emojiText.nie} Ta rekrutacja została już zaakceptowana.`,
          ephemeral: true,
        });
      }

      const targetUserId = ticketData["ticket-user"];
      const robloxNick = ticketData.roblox;

      if (!targetUserId || !robloxNick) {
        return interaction.reply({
          content: `${emojiText.nie} Nie mogę odczytać danych z ticketu.`,
          ephemeral: true,
        });
      }

      const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);

      if (!member) {
        return interaction.reply({
          content: `${emojiText.nie} Nie znaleziono użytkownika na serwerze.`,
          ephemeral: true,
        });
      }

      const roleResult = await tryAddRole(
        member,
        CONFIG.clanMemberRoleId,
        `Akceptacja rekrutacji DE3R CLAN przez ${interaction.user.tag}`
      );

      const nicknameResult = await tryChangeMemberNickname(interaction.guild, member, robloxNick);

      const resultLines = [
        `${emojiText.tak} **Rekrutacja zaakceptowana przez:** ${interaction.user}`,
        `${emojiText.arrow} **Użytkownik:** ${member}`,
        `${emojiText.arrow} **Nick Roblox:** \`${robloxNick}\``,
        "",
      ];

      if (roleResult.ok) {
        resultLines.push(`${emojiText.tak} **Rola została nadana:** <@&${CONFIG.clanMemberRoleId}>`);
      } else {
        resultLines.push(`${emojiText.nie} **Rola nie została nadana:** ${roleResult.text}`);
      }

      if (nicknameResult.ok) {
        resultLines.push(`${emojiText.tak} **Nick zmieniony na:** \`${nicknameResult.text}\``);
      } else {
        resultLines.push(`${emojiText.nie} **Nick nie został zmieniony:** ${nicknameResult.text}`);
      }

      const acceptedEmbed = new EmbedBuilder()
        .setColor("#2f58ff")
        .setTitle(`${emojiText.tak} ${CONFIG.clanName} » REKRUTACJA ZAAKCEPTOWANA`)
        .setDescription(resultLines.join("\n"))
        .setFooter({ text: `© 2026 ${CONFIG.clanName}` });

      await interaction.channel.setTopic(
        makeTicketTopic(targetUserId, "rekrutacja", robloxNick).replace("accepted=false", "accepted=true")
      ).catch(() => {});

      await interaction.message.edit({
        components: [
          new ActionRowBuilder().addComponents(
            createCloseButton(),
            createAcceptRecruitmentButton(true)
          ),
        ],
      }).catch(() => {});

      return interaction.reply({
        embeds: [acceptedEmbed],
      });
    }

    // =========================
    // ZAMKNIĘCIE TICKETA
    // =========================
    if (interaction.isButton() && interaction.customId === "close_ticket") {
      if (!canOfficer(interaction)) {
        return interaction.reply({
          content: `${emojiText.nie} Tylko officer może zamknąć ticket.`,
          ephemeral: true,
        });
      }

      await interaction.reply({
        content: `${emojiText.lock} Ticket zostanie zamknięty za 5 sekund...`,
      });

      setTimeout(async () => {
        await interaction.channel.delete().catch((error) => {
          console.error("❌ Nie udało się usunąć ticketu:", error);
        });
      }, 5000);
    }

    // =========================
    // WERYFIKACJA MENU
    // =========================
    if (interaction.isStringSelectMenu() && interaction.customId === "verify_select") {
      const math = generateMath();
      challenges.set(interaction.user.id, math.answer);

      const modal = new ModalBuilder()
        .setCustomId("math_modal")
        .setTitle("Weryfikacja");

      const input = new TextInputBuilder()
        .setCustomId("math_answer")
        .setLabel(`Ile to: ${math.question} ?`)
        .setPlaceholder("Wpisz poprawny wynik")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(2);

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      await interaction.showModal(modal);

      setTimeout(async () => {
        await interaction.message.edit({
          components: [new ActionRowBuilder().addComponents(createVerifyMenu())],
        }).catch(() => {});
      }, 500);
    }

    if (interaction.isModalSubmit() && interaction.customId === "math_modal") {
      const userAnswer = interaction.fields.getTextInputValue("math_answer");
      const correctAnswer = challenges.get(interaction.user.id);

      if (Number(userAnswer) === correctAnswer) {
        challenges.delete(interaction.user.id);

        const member = await interaction.guild.members.fetch(interaction.user.id);
        await member.roles.add(CONFIG.verifiedRoleId);

        await pingAfterVerify(interaction);

        const successEmbed = new EmbedBuilder()
          .setColor("#2f58ff")
          .setDescription(`${emojiText.tak} **Pomyślnie przeszedłeś weryfikację!**`);

        return interaction.reply({
          embeds: [successEmbed],
          ephemeral: true,
        });
      }

      const errorEmbed = new EmbedBuilder()
        .setColor("#2f58ff")
        .setDescription(`${emojiText.nie} **Błędna odpowiedź! Spróbuj ponownie.**`);

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("❌ Błąd interactionCreate:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `${emojiText.nie} Wystąpił błąd: ${error.message}`,
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

client.login(CONFIG.token);
