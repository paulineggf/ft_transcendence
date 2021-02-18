# frozen_string_literal: true

require 'mini_magick'

module Api
  # Users Controller
  class UsersController < ApplicationController
    before_action :authenticate_user!
    before_action :set_user, only: %i[show update destroy upload_avatar]
    before_action :allowed?, only: %i[update destroy upload_avatar]
    skip_after_action :update_auth_header, only: [:destroy]

    UserReducer = Rack::Reducer.new(
      User.all,
      ->(ladder_id:) { where(ladder_id: ladder_id) },
      ->(state_id:) { where(state_id: state_id) },
      ->(guild_id:) { where(guild_id: guild_id) }
    )

    def index
      @users = UserReducer.apply(params)
      json_response(@users)
    end

    def update
      @user.update!(user_params)
      json_response(@user)
    end

    def show
      json_response(@user)
    end

    def destroy
      @user.destroy
      head :no_content
    end

    def upload_avatar
      return unless params.key?(:avatar)

      mini_image = MiniMagick::Image.new(params[:avatar].tempfile.path)
      mini_image.resize '1200x1200'

      @user.avatar.attach(params[:avatar])
      url = url_for(@user.avatar)
      @user.update(image_url: url)
      json_response({ image_url: url })
    end

    private

    def allowed?
      return unless current_user.id != @user.id

      render json: {
        errors: [I18n.t('notAllowed')]
      }, status: 401
    end

    def user_params
      params.permit(:two_factor, :nickname, :first_login)
    end

    def set_user
      @user = User.find(params[:id])
    end
  end
end
