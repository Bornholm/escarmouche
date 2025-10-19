SHELL := /bin/bash

AMATL_VERSION := 0.27.1
YQ_VERSION := 4.47.2
jQ_VERSION := 1.8.1

LATEST_VERSION ?= $(shell git describe --tags --abbrev=0 2>/dev/null)
LANGUAGES := fr-FR es-ES en-EN

build: website wasm-lib barracks-app cmd

cmd: cmd-balancer

cmd-%:
	CGO_ENABLED=0 go build -o bin/$* ./cmd/$*

wasm-lib:
	mkdir -p dist/wasm
	cp -f "$(shell go env GOROOT)/lib/wasm/wasm_exec.js" ./dist/wasm/wasm_exec.js
	GOOS=js GOARCH=wasm go build -o dist/wasm/barracks.wasm ./pkg/barracks/wasm

barracks-app:
	rm -rf dist/barracks
	mkdir -p dist/barracks
	$(MAKE) wasm-lib
	npx parcel build --no-cache --public-url "./" --dist-dir dist/barracks  ./barracks/index.html

website: website-index $(foreach lang,$(LANGUAGES),website-$(lang))

website-index: amatl-bin
	mkdir -p dist/website/$*
	$(MAKE) -s data | tools/amatl-$(AMATL_VERSION)/bin/amatl \
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
	$(MAKE) -s LANGUAGE=$* data | tools/amatl-$(AMATL_VERSION)/bin/amatl \
		--log-level debug \
		render html \
		--link-replacements "file://$(PWD)::https://github.com/Bornholm/escarmouche/blob/$(LATEST_VERSION)" \
		--vars stdin:// \
		--html-layout amatl://website.html \
		--template-left-delimiter '{%' --template-right-delimiter '%}' \
		-o ./dist/website/$*/index.html \
		./misc/website/$*/index.md

data: yq-bin jq-bin
	@LATEST_VERSION=$(LATEST_VERSION) LANGUAGE=$(LANGUAGE) ./misc/script/generate-data.sh

amatl-bin: tools/amatl-$(AMATL_VERSION)/bin/amatl

tools/amatl-$(AMATL_VERSION)/bin/amatl:
	mkdir -p tools/amatl-$(AMATL_VERSION)/bin
	curl -kL --output tools/amatl-$(AMATL_VERSION)/amatl.tar.gz https://github.com/Bornholm/amatl/releases/download/v$(AMATL_VERSION)/amatl_$(AMATL_VERSION)_linux_amd64.tar.gz
	( cd tools/amatl-$(AMATL_VERSION) && tar -xzf amatl.tar.gz amatl )
	mv tools/amatl-$(AMATL_VERSION)/amatl tools/amatl-$(AMATL_VERSION)/bin/
	rm -f tools/amatl-$(AMATL_VERSION)/amatl.tar.gz
	mkdir -p tools/bin
	ln -s $(PWD)/tools/amatl-$(AMATL_VERSION)/bin/amatl tools/bin/amatl

watch: tools/modd/bin/modd
	tools/modd/bin/modd

tools/modd/bin/modd:
	mkdir -p tools/modd/bin
	GOBIN=$(PWD)/tools/modd/bin go install github.com/cortesi/modd/cmd/modd@latest
	mkdir -p tools/bin
	ln -s $(PWD)/tools/modd/bin/yq tools/bin/modd

yq-bin: tools/yq-$(YQ_VERSION)/bin/yq

tools/yq-$(YQ_VERSION)/bin/yq:
	mkdir -p tools/yq-$(YQ_VERSION)/bin
	wget -O tools/yq-$(YQ_VERSION)/bin/yq https://github.com/mikefarah/yq/releases/download/v$(YQ_VERSION)/yq_linux_amd64
	chmod +x tools/yq-$(YQ_VERSION)/bin/yq
	mkdir -p tools/bin
	ln -sf $(PWD)/tools/yq-$(YQ_VERSION)/bin/yq tools/bin/yq

jq-bin: tools/jq-$(JQ_VERSION)/bin/jq

tools/jq-$(JQ_VERSION)/bin/jq:
	mkdir -p tools/jq-$(JQ_VERSION)/bin
	wget -O tools/jq-$(JQ_VERSION)/bin/jq https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-amd64
	chmod +x tools/jq-$(JQ_VERSION)/bin/jq
	mkdir -p tools/bin
	ln -sf $(PWD)/tools/jq-$(YQ_VERSION)/bin/jq tools/bin/jq

