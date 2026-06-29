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
} = require("discord.js");

const CONFIG = {
  token: process.env.TOKEN,

  clanName: "DE3R CLAN",

  // Panel wysyła się automatycznie na ten kanał.
  panelChannelId: process.env.PANEL_CHANNEL_ID || "1389543966361387008",

  // Officer widzi tickety i może je zamykać.
  officerRoleId: process.env.OFFICER_ROLE_ID || "1389263773482614905",

  // Kategoria rekrutacji.
  rekrutacjaCategoryId: process.env.REKRUTACJA_CATEGORY_ID || "1521151552637632522",

  // Opcjonalna kategoria pomocy. Jak puste, tworzy bez kategorii.
  pomocCategoryId: process.env.POMOC_CATEGORY_ID || "",

  emojis: {
    pomoc: { id: "1521150283755814932", name: "pomoc", animated: false },
    arrow: { id: "1521150305046106172", name: "arrow", animated: true },
    ticket: { id: "1521150341570363442", name: "ticket", animated: false },
    rekrutacja: { id: "1521150168932548618", name: "rekrutacja", animated: false },
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

function createPanelEmbed() {
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

function createPanelMenu() {
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
        emoji: "✅",
      },
      {
        label: "NIE",
        description: "Nie spełniam wymagań",
        value: "nie",
        emoji: "❌",
      },
    ]);
}

async function sendPanelAutomatic() {
  console.log("🔄 Próba wysłania panelu...");
  console.log(`📌 PANEL_CHANNEL_ID: ${CONFIG.panelChannelId}`);

  const channel = await client.channels.fetch(CONFIG.panelChannelId).catch((err) => {
    console.log("❌ Nie udało się pobrać kanału. Sprawdź ID kanału i czy bot jest na serwerze.");
    console.log(err);
    return null;
  });

  if (!channel) return;

  if (!channel.isTextBased()) {
    console.log("❌ Ten kanał nie jest tekstowy.");
    return;
  }

  const embed = createPanelEmbed();
  const components = [new ActionRowBuilder().addComponents(createPanelMenu())];

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
      console.log(`✅ Stary panel został zaktualizowany na kanale #${channel.name}`);
    }
  } catch (err) {
    console.log("⚠️ Bot nie może czytać historii wiadomości albo nie znalazł starego panelu. Wyślę nowy panel.");
  }

  if (!editedOldPanel) {
    await channel.send({ embeds: [embed], components }).catch((err) => {
      console.log("❌ Nie udało się wysłać panelu. Bot nie ma permisji na tym kanale.");
      console.log(err);
      return null;
    });

    console.log(`✅ Panel wysłany automatycznie na kanał #${channel.name}`);
  }
}

function createTicketModal(selected) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${selected}`)
    .setTitle(selected === "pomoc" ? "Pomoc - DE3R CLAN" : "Rekrutacja - DE3R CLAN");

  const robloxNickInput = new TextInputBuilder()
    .setCustomId("roblox_nick")
    .setLabel("Podaj nick z Robloxa")
    .setPlaceholder("Np. DE3R_Player123")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(32);

  modal.addComponents(
    new ActionRowBuilder().addComponents(robloxNickInput)
  );

  // Pole opisu zostaje tylko w POMOCY.
  // W REKRUTACJI jest tylko nick Roblox + wcześniejszy wybór TAK/NIE do wymagań.
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

client.once("ready", async () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
  console.log(`✅ Bot jest na ${client.guilds.cache.size} serwerach.`);

  setTimeout(async () => {
    await sendPanelAutomatic();
  }, 3000);
});

client.on("interactionCreate", async (interaction) => {
  try {
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
          content: "❌ Nie możesz otworzyć rekrutacji, jeśli nie spełniasz wymagań DE3R CLAN.",
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
          channel.topic === `ticket-user-${user.id}`
      );

      if (alreadyOpen) {
        return interaction.reply({
          content: `❌ Masz już otwarty ticket: ${alreadyOpen}`,
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
        topic: `ticket-user-${user.id}`,
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
          `${emojiText.arrow} **Zgadza się z wymaganiami:** \`TAK\``,
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

      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Zamknij")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

      await ticketChannel.send({
        content: `${user} <@&${CONFIG.officerRoleId}>`,
        embeds: [ticketEmbed],
        components: [new ActionRowBuilder().addComponents(closeButton)],
      });

      return interaction.reply({
        content: `✅ Utworzono ticket: ${ticketChannel}`,
        ephemeral: true,
      });
    }

    if (interaction.isButton() && interaction.customId === "close_ticket") {
      const member = interaction.member;

      const canClose =
        member.roles.cache.has(CONFIG.officerRoleId) ||
        member.permissions.has(PermissionFlagsBits.Administrator);

      if (!canClose) {
        return interaction.reply({
          content: "❌ Tylko officer może zamknąć ticket.",
          ephemeral: true,
        });
      }

      await interaction.reply({
        content: "🔒 Ticket zostanie zamknięty za 5 sekund...",
      });

      setTimeout(async () => {
        await interaction.channel.delete().catch((error) => {
          console.error("❌ Nie udało się usunąć ticketu:", error);
        });
      }, 5000);
    }
  } catch (error) {
    console.error("❌ Błąd interactionCreate:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `❌ Wystąpił błąd: ${error.message}`,
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

client.login(CONFIG.token);
