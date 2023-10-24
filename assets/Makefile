NODE = node
NPM = npm
NPM_REBUILD = $(NPM) --ignore-scripts false rebuild --build-from-source
SASS = ./node_modules/.bin/node-sass --indent-type tab --indent-width 1 --output-style expanded
JAVASCRIPTS = $(patsubst %, public/assets/%.js, html5 hwcrypto)
BROWSERIFY = ./node_modules/.bin/browserify
WATCHIFY = ./node_modules/.bin/watchify --verbose

BROWSERIFY_OPTS =
BROWSERIFY_OPTS += --no-detect-globals

love: stylesheets
love: javascripts

stylesheets:
	$(SASS) --output public/assets page.scss

autostylesheets: stylesheets
	$(MAKE) SASS="$(SASS) --watch" "$<"

javascripts: $(JAVASCRIPTS)

autojavascripts:
	@$(MAKE) --always-make -j $(words $(JAVASCRIPTS)) \
		BROWSERIFY="$(WATCHIFY)" $(JAVASCRIPTS)

public/assets:
	mkdir -p "$@"

public/assets/html5.js: public/assets
	@echo "Compiling $@…"
	@$(BROWSERIFY) $(BROWSERIFY_OPTS) --entry ./$(@F:%.js=%) --outfile "$@"

public/assets/hwcrypto.js: public/assets
	@echo "Compiling $@…"
	@$(BROWSERIFY) $(BROWSERIFY_OPTS) \
		--require ./$(@F:%.js=%):@kaasavkool/$(@F:%.js=%) \
		--outfile "$@"

shrinkwrap:
	$(NPM) shrinkwrap --dev

rebuild:
	$(NPM_REBUILD) node-sass --sass-binary-site=http://localhost:0

.PHONY: love
.PHONY: stylesheets autostylesheets
.PHONY: javascripts autojavascripts
.PHONY: shrinkwrap rebuild
.PHONY: $(JAVASCRIPTS)

# Precious stops Make from deleting files after exiting autocompiling.
.PRECIOUS: $(JAVASCRIPTS)
