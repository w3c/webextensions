.PHONY: clean update-charter-toc

update-charter-toc: charter.md
	doctoc --title "## Table of Contents" $<

clean:
	rm -f *~
