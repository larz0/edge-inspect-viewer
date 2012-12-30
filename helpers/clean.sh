#! /bin/bash
cd /Users/`whoami`/Documents/Edge\ Inspect/;
for i in *; do mv "$i" $(echo "$i" | sed 's/[^a-zA-Z0-9.-]/_/g'); done
