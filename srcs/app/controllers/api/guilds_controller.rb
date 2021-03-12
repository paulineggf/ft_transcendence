# frozen_string_literal: true

module Api
  class GuildsController < ApiController
    before_action :set_guild
    before_action :permission, only: %i[create_members destroy_members]
    skip_before_action :set_guild, only: %i[index create guild_params manage_ownership]

    def index
      json_response(Guild.all.order(score: :desc))
    end

    def update
      return render_not_allowed if @guild.owner != current_user

      @guild.update!(guild_params)
      head :ok
    end

    def create
      return render_error('hasGuildAlready') unless current_user.guild_member.nil?

      guild = Guild.create!(guild_params)
      GuildMember.create!(user: current_user, guild: guild, rank: 'owner')
      json_response(guild, 201)
    end

    def show
      json_response(@guild)
    end

    def create_members
      GuildMember.create!(user_id: params.fetch(:tid), guild: @guild)
      head :ok
    end

    def destroy_members
      member = params.fetch(:tid)
      GuildMember.where(user_id: member, guild_id: @guild.id).destroy_all
      manage_ownership(@guild) if current_user.id == member.to_i
      head :no_content
    end

    def create_officers
      return render_not_allowed unless current_user == @guild.owner

      GuildMember.where(user_id: params.fetch(:tid), guild: @guild).update(rank: 'officer').first
      head :ok
    end

    def destroy_officers
      return render_not_allowed unless current_user == @guild.owner

      GuildMember.where(user_id: params.fetch(:tid), guild: @guild).update(rank: 'member').first
      head :no_content
    end

    private

    def permission
      render_not_allowed unless current_user == @guild.owner || @guild.officers.where(user_id: current_user).first
    end

    def manage_ownership(guild)
      guild.officers&.first&.owner!
      guild.members&.first&.owner!
      guild.destroy! if guild.members.empty?
    end

    def guild_params
      params.permit(:name, :anagram)
    end

    def set_guild
      @guild = Guild.find(params[:id])
    end
  end
end