.PHONY: generate
generate:
	command -v tectonic >/dev/null || (echo "Installing tectonic..." && brew install tectonic)
	tectonic --outdir ../public resume.tex
