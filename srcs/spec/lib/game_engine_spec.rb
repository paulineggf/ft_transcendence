require 'rails_helper'

RSpec.describe GameEngine do
  let(:left) { create(:user) }
  let(:right) { create(:user) }
  let(:game) { create(:game, player_left: left, player_right: right) }
  let(:ge) { GameEngine.new(game) }
  it 'constructor sets players side' do
    expect(ge.left.user_id).to eq(left.id)
    expect(ge.right.user_id).to eq(right.id)
  end

  it 'valid move set player position' do
    ge.move(left.id, 20)
    expect(ge.left.read_position).to eq(20)
  end

  it 'invalid move doesnt set player position' do
    ge.move(left.id, 20)
    ge.move(left.id, 0)
    expect(ge.left.read_position).to eq(20)
    ge.move(left.id, 256)
    expect(ge.left.read_position).to eq(20)
  end

  it 'left forfeit should' do
    ge.forfeit(left.id)
    game.reload
    expect(game.winner_id).to eq(right.id)
  end

  it 'right forfeit should' do
    ge.forfeit(right.id)
    game.reload
    expect(game.winner_id).to eq(left.id)
  end

  it 'asserts point is given to right' do
    ge.start
    ge.ball.x = 0
    ge.give_point
    expect(ge.right.score).to eq(1)
    expect(ge.ball.x).to eq(256)
  end

  it 'asserts point is given to left' do
    ge.start
    ge.ball.x = 512
    ge.give_point
    expect(ge.left.score).to eq(1)
    expect(ge.ball.x).to eq(256)
  end

  it 'assert tick broadcast' do
    ge.start
    expect { ge.tick }.to have_broadcasted_to("game_#{game.id}").exactly(:once)
  end
end