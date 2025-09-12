SHELL := /bin/bash
AMATL_VERSION := 0.24.1
LATEST_VERSION ?= $(shell git describe --tags --abbrev=0)
LANGUAGES := fr-FR

website: $(foreach lang,$(LANGUAGES),website-$(lang))

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