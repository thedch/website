# run this to start the dev server
dev:
	npm run dev

# run this before pushing to github
build:
	npm run build

# copy the resume to the public directory
resume:
	$(MAKE) -C resume
	cp resume/out/resume.pdf public/resume.pdf

.PHONY: dev build resume