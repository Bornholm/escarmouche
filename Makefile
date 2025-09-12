SHELL := /bin/bash

AMATL_VERSION := 0.24.1
GOPHERJS_VERSION := v1.19.0-beta2
GOPHERJS_GO_VERSION := 1.19.13

LATEST_VERSION ?= $(shell git describe --tags --abbrev=0)
LANGUAGES := fr-FR

build: website wasm-lib barracks-app

wasm-lib:
	mkdir -p dist/barracks
	cp -f "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" ./dist/barracks/wasm_exec.js
	GOOS=js GOARCH=wasm go build -o dist/barracks/barracks.wasm ./pkg/barracks/wasm

barracks-app:
	rm -rf dist/barracks
	mkdir -p dist/barracks
	$(MAKE) wasm-lib
	npx parcel build --public-url "./" --dist-dir dist/barracks  ./barracks/index.html

website: website-index $(foreach lang,$(LANGUAGES),website-$(lang))

website-index: amatl-bin
	mkdir -p dist/website
	echo '{"latestVersion":"$(LATEST_VERSION)", "language":""}' | tools/amatl-$(AMATL_VERSION)/bin/amatl \
		--log-level debug \
		render html \
		--link-replacements "file://$(PWD)::https://github.com/Bornholm/escarmouche/blob/$(LATEST_VERSION)" \
		--vars stdin:// \
		--html-layout amatl://website.html \
		--template-left-delimiter '{%' --template-right-delimiter '%}' \
		-o ./dist/website/index.html \
		./misc/website/index.md

website-%: amatl-bin
	mkdir -p dist/website/$*
	echo '{"latestVersion":"$(LATEST_VERSION)", "language":"$*"}' | tools/amatl-$(AMATL_VERSION)/bin/amatl \
		--log-level debug \
		render html \
		--link-replacements "file://$(PWD)::https://github.com/Bornholm/escarmouche/blob/$(LATEST_VERSION)" \
		--vars stdin:// \
		--html-layout amatl://website.html \
		--template-left-delimiter '{%' --template-right-delimiter '%}' \
		-o ./dist/website/$*/index.html \
		./misc/website/$*/index.md

amatl-bin: tools/amatl-$(AMATL_VERSION)/bin/amatl

tools/amatl-$(AMATL_VERSION)/bin/amatl:
	mkdir -p tools/amatl-$(AMATL_VERSION)/bin
	curl -kL --output tools/amatl-$(AMATL_VERSION)/amatl.tar.gz https://github.com/Bornholm/amatl/releases/download/v$(AMATL_VERSION)/amatl_$(AMATL_VERSION)_linux_amd64.tar.gz
	( cd tools/amatl-$(AMATL_VERSION) && tar -xzf amatl.tar.gz amatl )
	mv tools/amatl-$(AMATL_VERSION)/amatl tools/amatl-$(AMATL_VERSION)/bin/
	rm -f tools/amatl-$(AMATL_VERSION)/amatl.tar.gz

watch: tools/modd/bin/modd
	tools/modd/bin/modd

tools/modd/bin/modd:
	mkdir -p tools/modd/bin
	GOBIN=$(PWD)/tools/modd/bin go install github.com/cortesi/modd/cmd/modd@latest