class CreateWarAddons < ActiveRecord::Migration[6.0]
  def change
    create_table :war_addons do |t|
      t.string :name
      t.references :war_term , foreign_key: true
      t.timestamps
    end
  end
end
