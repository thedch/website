# Makefile for LaTeX documents

# The main LaTeX file without the .tex extension
MAIN = resume

# Compiler
LATEX = xelatex

# Output directory
OUTDIR = out

# Compile the LaTeX document
all: $(OUTDIR) $(OUTDIR)/$(MAIN).pdf

# Make sure the output directory exists
$(OUTDIR):
	mkdir -p $(OUTDIR)

# format all tex files -- Makefile bash won't work here because of the **
format:
	latexindent -w **/*.tex

$(OUTDIR)/$(MAIN).pdf: $(MAIN).tex src/*.tex
	$(LATEX) -output-directory=$(OUTDIR) $(MAIN).tex  # First pass
	$(LATEX) -output-directory=$(OUTDIR) $(MAIN).tex  # Second pass to resolve references

# Clean up auxiliary files
clean:
	rm -f $(OUTDIR)/*.aux $(OUTDIR)/*.log $(OUTDIR)/*.out $(OUTDIR)/*.toc $(OUTDIR)/*.synctex.gz

# Clean up all output files
cleanall: clean
	rm -f $(OUTDIR)/$(MAIN).pdf

# Phony targets
.PHONY: all clean cleanall format