# frozen_string_literal: true

require 'faker'
require 'factory_bot_rails'
include(CompetitionHelper)

Ladder.create(name: 'Bronze')
Ladder.create(name: 'Silver')
Ladder.create(name: 'Gold')
Ladder.create(name: 'Platinum')
Ladder.create(name: 'Diamond')

Achievement.create(name: 'My Name Is Achilles', description: 'You must win a tournament')
Achievement.create(name: 'Tonight, We Dine In Hell !', description: 'You must declare a War')
Achievement.create(name: 'This Is Sparta !', description: 'You must win a War')
Achievement.create(name: 'Is There No One Else ?', description: 'You must win 100 ladder games')
Achievement.create(name: 'RoadToDiamond I', description: 'You must reach Silver Ladder')
Achievement.create(name: 'RoadToDiamond II', description: 'You must reach Gold Ladder')
Achievement.create(name: 'RoadToDiamond III', description: 'You must reach Platinum Ladder')
Achievement.create(name: 'To Infinity And Beyond !', description: 'You must reach Diamond Ladder')
Achievement.create(name: 'Much Secure!', description: '2FA is activated')

Chat.create(name: 'general', privacy: 'public')

if Rails.env.development?

  guilds = FactoryBot.create_list(:guild, 5)
  guilds.each do |guild|
    @users = FactoryBot.create_list(:user, 5)
    FactoryBot.create(:guild_member, guild: guild, rank: 'owner', user: @users[0])
    1.upto(2) do |i|
      FactoryBot.create(:guild_member, guild: guild, rank: 'officer', user: @users[i])
    end
    3.upto(4) do |i|
      FactoryBot.create(:guild_member, guild: guild, user: @users[i])
    end
    chat = FactoryBot.create(:chat, owner: @users[0])
    1.upto(4) do |i|
      FactoryBot.create(:chat_participant, user: @users[i], chat: chat)
    end
    guilds.without(guild).each do |on|
      case rand(3)
      when 0
        attr = { opened: true, closed: false }
      when 1
        attr = { opened: false, closed: true }
      else
        attr = { opened: false, closed: false }
      end
      FactoryBot.create(:war, from: guild, on: on, war_start: DateTime.now + rand(-5..5), war_end: DateTime.now + rand(6..10), opened: attr[:opened], closed: attr[:closed])
    end
  end


  10.times do |_i|
    players = @users.sample(2)
    FactoryBot.create(:game, winner: players[0], player_left: players[0], player_right: players[1], mode: 'ladder',
                             status: 'played')
  end

  FactoryBot.create_list(:user, 5)

  User.all.each do |t|
    assign_ladder(t)
  end
end
