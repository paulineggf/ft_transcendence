# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Ladders', type: :request do
  let!(:ladders) { create_list(:ladder, 5) }
  let(:ladder_id) { ladders.first.id }

  describe 'requires auth token' do
    before {
      get '/api/ladders'
    }

    it 'returns status code 401' do
      expect(response).to have_http_status(401)
    end
  end

  describe 'retrieves one ladder' do
    before {
      @user = FactoryBot.create(:user)
      get "/api/ladders/#{ladder_id}", headers: @user.create_new_auth_token
    }
    it 'returns ladder' do
      expect(json).not_to be_empty
    end

    it 'returns status code 200' do
      expect(response).to have_http_status(200)
    end
  end

  describe 'retrieves all ladders' do
    before {
      @user = FactoryBot.create(:user)
      get '/api/ladders', headers: @user.create_new_auth_token
    }

    it 'returns ladders' do
      expect(json).not_to be_empty
      expect(json.size).to eq(6)
    end

    it 'returns status code 200' do
      expect(response).to have_http_status(200)
    end
  end
end
