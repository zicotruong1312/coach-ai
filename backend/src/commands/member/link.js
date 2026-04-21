const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');
const { getAccount } = require('../../services/valorant');

// Danh sách Role được phép sử dụng bot
const ALLOWED_ROLES = [
  'Cô Chủ', 'Admin', 'Giám Đốc', 'Bố Già', // Root
  'Moderator', 'Ckiu Zico', 'Em géi guột', // VIP
  'Thổ Phỉ' // Member bình thường
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Liên kết tài khoản Valorant của bạn với Discord')
    .addStringOption(option => 
      option.setName('ingame')
        .setDescription('Tên hiển thị trong game (VD: CAV Zico)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('tagline')
        .setDescription('Tagline không có dấu # (VD: 2204)')
        .setRequired(true)),
        
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    // Kiểm tra quyền hạn (Role Check)
    const memberRoles = interaction.member.roles.cache.map(r => r.name);
    const userRole = ALLOWED_ROLES.find(role => memberRoles.includes(role));

    if (!userRole) {
      return interaction.editReply('❌ Bạn không có Role phù hợp để sử dụng chức năng AI Coach của server này!');
    }

    const ingame = interaction.options.getString('ingame');
    const tagline = interaction.options.getString('tagline');

    try {
      // Gọi API verify sự tồn tại của Acc
      const accountData = await getAccount(ingame, tagline);
      
      if (!accountData || accountData.status !== 200) {
        return interaction.editReply(`❌ Không tìm thấy tài khoản Valorant \`${ingame}#${tagline}\`. Vui lòng kiểm tra lại!`);
      }

      // Lưu vào DB
      let user = await User.findOne({ discordId: interaction.user.id });
      
      if (user) {
        user.riotName = accountData.data.name;
        user.riotTag = accountData.data.tag;
        user.role = userRole;
        await user.save();
        return interaction.editReply(`✅ Cập nhật thành công! Đã đổi liên kết sang \`${accountData.data.name}#${accountData.data.tag}\` (Role đăng ký: ${userRole}). AI Coach sẽ theo dõi bạn từ bây giờ.`);
      }

      user = new User({
        discordId: interaction.user.id,
        riotName: accountData.data.name,
        riotTag: accountData.data.tag,
        role: userRole
      });
      
      await user.save();
      return interaction.editReply(`🙌 Tuyệt vời! Đã liên kết tài khoản \`${accountData.data.name}#${accountData.data.tag}\` với hệ thống Coach. (Role đăng ký: ${userRole})`);

    } catch (error) {
      console.error(error);
      return interaction.editReply('❌ Đã xảy ra lỗi hệ thống khi liên kết tài khoản. Bot có thể đang hết quota API.');
    }
  },
};
