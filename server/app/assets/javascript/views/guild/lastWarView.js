export const LastWarView = Backbone.View.extend({
  el: $('#app'),
  initialize: function () {
		this.render()
  },
  render: function () {
		console.log('last war')
    this.$el.html('Last war')
  }
})