# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Games', type: :request do
  let!(:auth) { create(:user, admin: true) }
  let(:access_token) { auth.create_new_auth_token }

  describe 'requires auth token' do
    before do
      get '/api/games'
    end
    it 'returns status code 401' do
      expect(response).to have_http_status(401)
      expect(json).to_not be_empty
    end
  end

  describe 'retrieves all games played' do
    context 'search with user_id' do
      before do
        create_list(:game, 2)
        get '/api/games', headers: auth.create_new_auth_token, params: { user_id: User.last.id, mode: 'duel' }
      end
      it 'returns all games played' do
        expect(json).not_to be_empty
        expect(json.size).to eq(1)
      end
      it 'returns status code 200' do
        expect(response).to have_http_status(200)
        expect(json).to_not be_empty
      end
    end

    context 'search with user_id and status' do
      before do
        create_list(:game, 2)
        Game.first.update!(status: 'inprogress')
        get '/api/games', headers: auth.create_new_auth_token, params: { status: 'inprogress' }
      end
      it 'returns all games played' do
        expect(json).not_to be_empty
        expect(json.size).to eq(1)
        expect(response).to have_http_status(200)
      end
    end

    context 'everything' do
      before do
        create_list(:game, 2)
        get '/api/games', headers: auth.create_new_auth_token
      end
      it 'returns all played matchs' do
        expect(json.size).to eq(2)
      end

      it 'returns status code 200' do
        expect(response).to have_http_status(200)
      end
    end

    context 'create' do
      describe 'a valid duel game' do
        it 'returns status code 201' do
          to = create(:user, status: 'online')
          create(:game)
          auth.update(status: 'online')
          expect do
            post '/api/games', headers: auth.create_new_auth_token, params: { mode: 'duel', opponent_id: to.id }
          end.to have_broadcasted_to("user_#{to.id}").exactly(:once).with(sender_id: auth.id, action: 'game_invitation', id: Game.maximum(:id).next)
          expect(response).to have_http_status(201)
          expect(json).not_to be_empty
          expect(Game.count).to eq(2)
        end
      end

      describe 'a duel with an already ingame player' do
        before do
          to = create(:user, status: 'ingame')
          auth.update(status: 'online')
          post '/api/games', headers: auth.create_new_auth_token, params: { mode: 'duel', opponent_id: to.id }
        end

        it 'returns status code 403' do
          expect(response).to have_http_status(403)
          expect(json).not_to be_empty
        end
      end

      it 'a duel game without opponent_id' do
        post '/api/games', headers: auth.create_new_auth_token, params: { mode: 'duel' }
        expect(response).to have_http_status(422)
        expect(json).not_to be_empty
      end

      it 'already in another duel game' do
        create(:game, player_right: auth, status: 'pending')
        to = create(:user, status: 'online')
        post '/api/games', headers: auth.create_new_auth_token, params: { mode: 'duel', opponent_id: to.id }
        expect(response).to have_http_status(403)
        expect(json).not_to be_empty
      end

      it 'already in another duel game' do
        from = create(:user, status: 'online')
        auth.update!(status: 'online')
        create(:game, player_left: auth, status: 'pending')
        post '/api/games', headers: from.create_new_auth_token, params: { mode: 'duel', opponent_id: auth.id }
        expect(response).to have_http_status(403)
        expect(json).not_to be_empty
      end
    end

    context 'delete' do
      describe 'cancel invitation' do
        before do
          game = create(:game, player_left: auth)
          delete "/api/games/#{game.id}", headers: auth.create_new_auth_token
        end
        it 'returns status code 204' do
          expect(response).to have_http_status(204)
        end
      end
      describe 'is not allowed after game started' do
        before do
          game = create(:game)
          game.update!(status: 'played')
          delete "/api/games/#{game.id}", headers: auth.create_new_auth_token
        end
        it 'returns status code 403' do
          expect(response).to have_http_status(403)
          expect(json).not_to be_empty
        end
      end
    end

    context 'WarTime' do
      let(:attributes) { { on_id: Guild.last.id, war_start: DateTime.now, war_end: DateTime.new(2022), prize: 1000, max_unanswered: 10 } }
      let(:auth_2) { create(:user) }
      let(:access_token_2) { auth_2.create_new_auth_token }
      let(:users) { create_list(:user, 2, status: 'online') }
      before {
        post api_guilds_url, headers: access_token, params: { name: "NoShroud", anagram: "NOS" }
        post api_guilds_url, headers: access_token_2, params: { name: "BANG", anagram: "ABCDE" }
        post "/api/guilds/#{Guild.first.id}/members/#{users[0].id}", headers: access_token
        post "/api/guilds/#{Guild.last.id}/members/#{users[1].id}", headers: access_token_2
        post api_wars_url, headers: access_token, params: attributes
        auth.update!(status: 'online')
        auth_2.update!(status: 'online')
      }
      it 'should not create a second match' do
        post times_api_war_url(War.first.id), headers: access_token, params: { day: Date.today.strftime('%A'), start_hour: 8, end_hour: 23, time_to_answer: 10, max_unanswered: 0 }
        post agreements_api_war_url(War.first.id), headers: access_token, params: { agree_terms: true }
        post agreements_api_war_url(War.first.id), headers: access_token_2, params: { agree_terms: true }
        perform_enqueued_jobs(only: WarOpenerJob)
        post '/api/games', headers: access_token, params: { mode: 'war', opponent_id: auth_2.id, war_time_id: WarTime.first.id }
        post '/api/games', headers: users[0].create_new_auth_token, params: { mode: 'war', opponent_id: users[1].id, war_time_id: WarTime.first.id}
        expect(json['errors']).to eq ["Your guild is already playing a war time match against this guild"]
      end
      it "should forfeit opponent at time_to_answer" do
        post times_api_war_url(War.first.id), headers: access_token, params: { day: Date.today.strftime('%A'), start_hour: 8, end_hour: 23, time_to_answer: 10, max_unanswered: 0 }
        post agreements_api_war_url(War.first.id), headers: access_token, params: { agree_terms: true }
        post agreements_api_war_url(War.first.id), headers: access_token_2, params: { agree_terms: true }
        perform_enqueued_jobs(only: WarOpenerJob)
        post '/api/games', headers: access_token, params: { mode: 'war', opponent_id: auth_2.id, war_time_id: WarTime.first.id }
        expect(WarTimeToAnswerJob).to have_been_enqueued
        perform_enqueued_jobs(only: WarTimeToAnswerJob)
        expect(Game.first.winner_id).to eq auth.id
      end
      it "should decrement max_unanswered at time_to_answer" do
        post times_api_war_url(War.first.id), headers: access_token, params: { day: Date.today.strftime('%A'), start_hour: 8, end_hour: 23, time_to_answer: 10, max_unanswered: 1 }
        post agreements_api_war_url(War.first.id), headers: access_token, params: { agree_terms: true }
        post agreements_api_war_url(War.first.id), headers: access_token_2, params: { agree_terms: true }
        perform_enqueued_jobs(only: WarOpenerJob)
        post '/api/games', headers: access_token, params: { mode: 'war', opponent_id: auth_2.id, war_time_id: WarTime.first.id }
        expect(WarTimeToAnswerJob).to have_been_enqueued
        perform_enqueued_jobs(only: WarTimeToAnswerJob)
        expect(Game.first.winner_id).to eq nil
        expect(WarTime.first.max_unanswered).to eq 0
      end
    end
    context 'Tournament' do
      include(TournamentHelper)
      let(:users) { create_list(:user, 2, status: 'online') }
      let(:token) { users[0].create_new_auth_token }
      let(:token_2) { users[1].create_new_auth_token }
      before {
        post api_tournaments_url, headers: access_token, params: { start_date: DateTime.now + 1 }
        post participants_api_tournament_url(Tournament.first.id), headers: token
        post participants_api_tournament_url(Tournament.first.id), headers: token_2
      }
      it "can't play twice against same opponent (one way)" do
        put api_tournament_url(Tournament.first.id), headers: access_token, params: { start_date: DateTime.now }
        post api_games_url, headers: token, params: { mode: 'tournament', opponent_id: users[1].id ,tournament_id: Tournament.first.id }
        Game.first.update!(status: 'played')
        TournamentParticipant.find_by_user_id(users[0].id).update!(opponents: [users[1].id])
        post api_games_url, headers: token, params: { mode: 'tournament', opponent_id: users[1].id ,tournament_id: Tournament.first.id }
        expect(Game.count).to eq 1
        expect(json['errors']).to eq ["You already challenged this player"]
        expect(status).to eq 403
      end
      it "can't play twice against same opponent (both ways)", test:true do
        put api_tournament_url(Tournament.first.id), headers: access_token, params: { start_date: DateTime.now }
        post api_games_url, headers: token, params: { mode: 'tournament', opponent_id: users[1].id ,tournament_id: Tournament.first.id }
        Game.first.update!(status: 'played')
        TournamentParticipant.find_by_user_id(users[0].id).update!(opponents: [users[1].id])
        TournamentParticipant.find_by_user_id(users[1].id).update!(opponents: [users[0].id])
        post api_games_url, headers: token_2, params: { mode: 'tournament', opponent_id: users[0].id ,tournament_id: Tournament.first.id }
        expect(Game.count).to eq 1
        expect(json['errors']).to eq ["You already challenged this player"]
        expect(status).to eq 403
      end
      it "can't play before tournament starts" do
        post api_games_url, headers: token, params: { mode: 'tournament', opponent_id: users[1].id ,tournament_id: Tournament.first.id }
        expect(Game.count).to eq 0
        expect(json['errors']).to eq ["Tournament has not started yet"]
        expect(status).to eq 403
      end
      it "can't play if opponent not participant" do
        put api_tournament_url(Tournament.first.id), headers: access_token, params: { start_date: DateTime.now }
        user = create(:user, status: 'online')
        post api_games_url, headers: token, params: { mode: 'tournament', opponent_id: user.id ,tournament_id: Tournament.first.id }
        expect(Game.count).to eq 0
        expect(json['errors']).to eq ["This player doesn't participate to the tournament"]
        expect(status).to eq 403
      end
    end
  end
end
