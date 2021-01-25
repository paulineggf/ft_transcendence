class CreateUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :ladders do |t|
      t.string :name
      t.text :desc
      t.timestamps
    end
    create_table :guilds do |t|
      t.string :name, :unique => true
      t.string :anagram, :limit => 5, :unique => true, null: false
      t.integer :score
      t.timestamps
    end
    create_table :users do |t|
      t.string :nickname, null: false, :unique => true
      t.string :avatar, :default => "default_avatar.png", null: false
      t.integer :status, :default => 0
      t.boolean :two_factor, :default => false
      t.references :guild, foreign_key: true
      t.references :ladder, :default => 0, foreign_key: true, null: false
      t.timestamps
    end
  end
end
