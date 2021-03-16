# frozen_string_literal: true

class WarSerializer < ActiveModel::Serializer
  attributes :id, :from, :on, :war_start, :war_end, :prize, :from_score, :on_score, :max_unanswered
  attributes :terms_accepted, :ladder_effort, :tournament_effort
end