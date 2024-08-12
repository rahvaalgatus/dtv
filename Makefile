ENV = development
NODE = node
NODE_OPTS = --use-strict --require j6pack/register
NPM = npm
NPM_REBUILD = $(NPM) --ignore-scripts false rebuild --build-from-source
MOCHA = ./node_modules/.bin/_mocha
TEST = $$(find test -name "*_test.js")
SHANGE = vendor/shange -f "config/$(ENV).sqlite3"
APP_HOST = rahvaalgatus.ee
APP_PATH = $(error "Please set APP_PATH")
LIVERELOAD_PORT = 35733
TEXTS_URL = https://docs.google.com/spreadsheets/d/10al7Urlb1Gv16P8TY5Wu3cmu9n6iHiRnVHu7kRmHg2U/gviz/tq?tqx=out:json&tq&gid=0
JQ_OPTS = --tab

RSYNC_OPTS = \
	--compress \
	--recursive \
	--links \
	--itemize-changes \
	--omit-dir-times \
	--times \
	--delete \
	--prune-empty-dirs \
	--exclude ".*" \
	--exclude "/config/development.*" \
	--exclude "/config/staging.*" \
	--exclude "/config/production.*" \
	--exclude "/config/*.sqlite3" \
	--exclude "/assets/***" \
	--exclude "/test/***" \
	--exclude "/tmp/***" \
	--exclude "/node_modules/livereload/***" \
	--exclude "/node_modules/mocha/***" \
	--exclude "/node_modules/co-mocha/***" \
	--exclude "/node_modules/must/***" \
	--exclude "/node_modules/jsdom/***" \
	--exclude "/node_modules/sinon/***" \
	--exclude "/node_modules/sqlite3/***"

export ENV
export PORT
export LIVERELOAD_PORT

ifneq ($(filter test spec autotest autospec test/%, $(MAKECMDGOALS)),)
	ENV = test
endif

love:
	@$(MAKE) -C assets

web: PORT = 3030
web:
	@$(NODE) $(NODE_OPTS) ./bin/$@

livereload:
	@$(NODE) \
		./node_modules/.bin/livereload public --wait 50 --port $(LIVERELOAD_PORT)

test:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R dot $(TEST)

spec:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R spec $(TEST)

autotest:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R dot --watch $(TEST)

autospec:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R spec --watch $(TEST)

shrinkwrap:
	$(NPM) shrinkwrap --dev

rebuild:
	$(NPM_REBUILD) sqlite3

config/%.sqlite3:
	sqlite3 "$@" < db/schema.sql

db/create: config/$(ENV).sqlite3

db/status:
	@$(SHANGE) status

db/migrate:
	@$(SHANGE) migrate
	@$(SHANGE) schema > db/schema.sql

db/migration: NAME = $(error "Please set NAME.")
db/migration:
	@$(SHANGE) create "$(NAME)"

config/tsl: config/tsl/ee.xml
config/tsl: config/tsl/ee_test.xml

config/tsl/ee.xml:
	mkdir -p config/tsl
	wget "https://sr.riik.ee/tsl/estonian-tsl.xml" -O "$@"

config/tsl/ee_test.xml:
	mkdir -p config/tsl
	wget "https://open-eid.github.io/test-TL/EE_T.xml" -O "$@"

test/fixtures: test/fixtures/john_rsa.pub
test/fixtures: test/fixtures/eid_2007_rsa.pub
test/fixtures: test/fixtures/esteid_2011_rsa.pub
test/fixtures: test/fixtures/esteid_2015_rsa.pub
test/fixtures: test/fixtures/esteid_2018_ecdsa.pub
test/fixtures: test/fixtures/eid_2016_rsa.pub
test/fixtures: test/fixtures/eid_2021e_ecdsa.pub

test/fixtures/%_rsa.key:
	openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$@"

test/fixtures/%_rsa.pub: test/fixtures/%_rsa.key
	openssl rsa -pubout -in "$<" -out "$@"

test/fixtures/%_ecdsa.key:
	openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:prime256v1 -out "$@"

test/fixtures/%_ecdsa.pub: test/fixtures/%_ecdsa.key
	openssl ec -in "$<" -pubout -out "$@"

tmp:
	mkdir -p tmp

tmp/texts.json: tmp
	curl -H "X-DataSource-Auth: true" "$(TEXTS_URL)" | sed -e 1d > "$@"

lib/texts.json: tmp/texts.json
	jq --sort-keys $(JQ_OPTS) -f scripts/texts.jq "$<" > "$@"

translatables:
	@ag --nofilename -o '\bt\("([\w.]+)"|"eid_view\.[^"]+"' |\
		grep -v '^$$' | sort -u | cut -d\" -f2

deploy:
	@rsync $(RSYNC_OPTS) . "$(APP_HOST):$(or $(APP_PATH), $(error "APP_PATH"))/"

production: APP_PATH = /var/www/dtv
production: deploy

production/diff: RSYNC_OPTS += --dry-run
production/diff: production

.PHONY: love
.PHONY: web livereload
.PHONY: test spec autotest autospec
.PHONY: shrinkwrap rebuild
.PHONY: deploy production production/diff

.PRECIOUS: test/fixtures/%_rsa.key
.PRECIOUS: test/fixtures/%_ecdsa.key
