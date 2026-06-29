require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
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
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  clanName: "DE3R CLAN",

  // Kanał, na który ma się wysyłać panel ticketów po użyciu /panel
  panelChannelId: "1389543966361387008",

  // Rola officera — widzi tickety i może je zamykać
  officerRoleId: "1389263773482614905",

  // Kategoria, w której tworzą się tickety rekrutacyjne
  rekrutacjaCategoryId: "1521151552637632522",

  // Opcjonalnie: kategoria pomocy, możesz wpisać w .env POMOC_CATEGORY_ID=ID_KATEGORII
  pomocCategoryId: process.env.POMOC_CATEGORY_ID || null,

  emojis: {
    pomoc: {
      id: "1521150283755814932",
      name: "pomoc",
      animated: false,
    },
    arrow: {
      id: "1521150305046106172",
      name: "arrow",
      animated: true,
    },
    ticket: {
      id: "1521150341570363442",
      name: "ticket",
      animated: false,
    },
    rekrutacja: {
      id: "1521150168932548618",
      name: "rekrutacja",
      animated: false,
    },
  },
};

const emojiText = {
  pomoc: `<:pomoc:${CONFIG.emojis.pomoc.id}>`,
  arrow: `<a:arrow:${CONFIG.emojis.arrow.id}>`,
  ticket: `<:ticket:${CONFIG.emojis.ticket.id}>`,
  rekrutacja: `<:rekrutacja:${CONFIG.emojis.rekrutacja.id}>`,
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

function cleanName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9ąćęłńóśźż]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20) || "user";
}

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("panel")
      .setDescription("Wysyła panel ticketów DE3R CLAN na ustawiony kanał")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  ].map((cmd) => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(CONFIG.token);

  await rest.put(
    Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId),
    { body: commands }
  );

  console.log("✅ Komenda /panel została załadowana.");
}

client.once("ready", async () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);

  try {
    await registerCommands();
  } catch (err) {
    console.error("❌ Błąd ładowania komend slash:", err);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "panel") {
      const panelChannel = await interaction.guild.channels.fetch(CONFIG.panelChannelId).catch(() => null);

      if (!panelChannel) {
        return interaction.reply({
          content: "❌ Nie znaleziono kanału panelu. Sprawdź ID kanału w CONFIG.panelChannelId.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor("#2f58ff")
        .setTitle(`${emojiText.ticket} ${CONFIG.clanName} » TICKETY`)
        .setDescription(
          [
            `${emojiText.arrow} **Wybierz kategorię z menu poniżej**`,
            `${emojiText.arrow} Prywatny ticket z administracją`,
            `${emojiText.arrow} Po wybraniu kategorii wpiszesz swój nick z Robloxa`,
            `${emojiText.arrow} Kategorie: **Pomoc** oraz **Rekrutacja**`,
          ].join("\n")
        )
        .setFooter({ text: `© 2026 ${CONFIG.clanName}` });

      const menu = new StringSelectMenuBuilder()
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

      const row = new ActionRowBuilder().addComponents(menu);

      await panelChannel.send({
        embeds: [embed],
        components: [row],
      });

      return interaction.reply({
        content: `✅ Panel ticketów został wysłany na kanał <#${CONFIG.panelChannelId}>.`,
        ephemeral: true,
      });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {
      const selected = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${selected}`)
        .setTitle(selected === "pomoc" ? "Pomoc - DE3R CLAN" : "Rekrutacja - DE3R CLAN");

      const robloxNickInput = new TextInputBuilder()
        .setCustomId("roblox_nick")
        .setLabel("Podaj swój nick z Robloxa")
        .setPlaceholder("Np. RobloxNick123")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(32);

      const opisInput = new TextInputBuilder()
        .setCustomId("opis")
        .setLabel(selected === "pomoc" ? "Opisz swój problem" : "Napisz krótko coś o sobie")
        .setPlaceholder(
          selected === "pomoc"
            ? "Np. mam problem z..."
            : "Np. wiek, doświadczenie, czemu chcesz dołączyć..."
        )
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMinLength(5)
        .setMaxLength(500);

      modal.addComponents(
        new ActionRowBuilder().addComponents(robloxNickInput),
        new ActionRowBuilder().addComponents(opisInput)
      );

      return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_modal_")) {
      const selected = interaction.customId.replace("ticket_modal_", "");
      const guild = interaction.guild;
      const user = interaction.user;

      const robloxNick = interaction.fields.getTextInputValue("roblox_nick");
      const opis = interaction.fields.getTextInputValue("opis");

      const alreadyOpen = guild.channels.cache.find(
        (ch) =>
          ch.type === ChannelType.GuildText &&
          ch.topic === `ticket-user-${user.id}`
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

      const ticketEmbed = new EmbedBuilder()
        .setColor("#2f58ff")
        .setTitle(
          selected === "pomoc"
            ? `${emojiText.pomoc} ${CONFIG.clanName} » POMOC`
            : `${emojiText.rekrutacja} ${CONFIG.clanName} » REKRUTACJA`
        )
        .setDescription(
          [
            `${emojiText.arrow} **Użytkownik:** ${user}`,
            `${emojiText.arrow} **Nick Roblox:** \`${robloxNick}\``,
            `${emojiText.arrow} **Kategoria:** \`${selected === "pomoc" ? "Pomoc" : "Rekrutacja"}\``,
            "",
            `${emojiText.arrow} **Opis:**`,
            `\`\`\`${opis}\`\`\``,
            "",
            `${emojiText.arrow} Officer odpowie najszybciej jak to możliwe.`,
          ].join("\n")
        )
        .setFooter({ text: `© 2026 ${CONFIG.clanName}` });

      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Zamknij")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({
        content: `${user} <@&${CONFIG.officerRoleId}>`,
        embeds: [ticketEmbed],
        components: [row],
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
        try {
          await interaction.channel.delete();
        } catch (err) {
          console.error("❌ Nie udało się usunąć ticketu:", err);
        }
      }, 5000);
    }
  } catch (err) {
    console.error("❌ Błąd interactionCreate:", err);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Wystąpił błąd.",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

client.login(CONFIG.token);
