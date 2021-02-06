class AddUserOwnerToGuild < ActiveRecord::Migration[6.1]
  def change
    add_reference :guilds, :owner, foreign_key: { to_table: :users }
  end
end
