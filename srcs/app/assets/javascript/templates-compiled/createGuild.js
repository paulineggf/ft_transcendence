(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['createGuild'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"manageGuildContainer\" id=\"createGuildContainer\">\n	<style>\n		.errorMessage\n		{\n			color: red;\n		}\n	</style>\n\n	<div class=\"manageGuildSideBar\"></div>\n	<div class=\"manageGuildContentContainer\">\n		<div class=\"manageGuildContent\" id=\"createGuildContent\">\n		<div id='#manageGuildErrorDiv'></div>\n		<div class=\"closeParams exitButton\" id=\"ManageGuildExitButton\" onclick=\"window.location='#profile';\">\n			<img src=\"./icons/esc.svg\" class=\"\">\n		</div>\n		<div class=\"manageGuildTitle\">\n			<div class=\"title\">\n				CREATE GUILD\n			</div>\n			<div class=\"manageGuildForm\">\n			<div class=\"subtitle\">GUILD NAME</div>\n			<label for=\"guildName\">\n			<input id=\"guildName\" class=\"manageGuildTextInput\" type=\"text\"></input>\n			</label>\n			<div id=\"nameError\" class=\"errorMessage\"></div>\n			<div class=\"subtitle\">ANAGRAM</div>\n			<label for=\"guildAnagram\">\n			<input id=\"guildAnagram\" class=\"manageGuildTextInput\" type=\"text\" minlength=\"3\" maxlength=\"5\"></input>\n			</label>\n			<div id=\"anagramError\" class=\"errorMessage\"></div>\n			<div id=\"errorField\" class=\"errorMessage\"></div>\n			<div><button class=\"createGuild save\">Save</button></div>\n		</div>\n		</div>\n	</div>\n</div>\n";
},"useData":true});
})();