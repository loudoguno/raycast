#!/usr/bin/env bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Print Tabloid Tray 4
# @raycast.mode fullOutput

# Optional parameters:
# @raycast.icon 🖨️
# @raycast.argument1 { "type": "text", "placeholder": "/path/to/file.pdf" }
# @raycast.argument2 { "type": "text", "placeholder": "copies", "optional": true }

# Documentation:
# @raycast.description Print a PDF as 11x17 Ledger/Tabloid from Canon tray-4.
# @raycast.author loudog
# @raycast.authorURL https://raycast.com/loudog

set -euo pipefail

PRINTER_URI="${PRINTER_URI:-ipp://192.168.240.62/ipp/print}"

usage() {
  printf 'Usage: %s /path/to/file.pdf [copies]\n' "$(basename "$0")" >&2
  printf 'Prints a PDF as 11x17 Ledger/Tabloid from Canon tray-4.\n' >&2
}

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage
  exit 2
fi

PDF_PATH="$1"
COPIES="${2:-1}"

if [[ ! -f "$PDF_PATH" ]]; then
  printf 'PDF not found: %s\n' "$PDF_PATH" >&2
  exit 1
fi

if ! [[ "$COPIES" =~ ^[0-9]+$ ]]; then
  printf 'Copies must be a positive integer: %s\n' "$COPIES" >&2
  exit 2
fi

if [[ "$COPIES" -lt 1 ]]; then
  printf 'Copies must be at least 1.\n' >&2
  exit 2
fi

JOB_NAME="$(basename "$PDF_PATH" .pdf) - Ledger Tray 4"
TEST_FILE="$(mktemp "${TMPDIR:-/tmp}/print-ledger-tray4.XXXXXX.test")"
trap 'rm -f "$TEST_FILE"' EXIT

cat > "$TEST_FILE" <<EOF
{
  NAME "Print Ledger PDF from Tray 4"
  OPERATION Print-Job

  GROUP operation-attributes-tag
  ATTR charset attributes-charset utf-8
  ATTR language attributes-natural-language en
  ATTR uri printer-uri \$uri
  ATTR name requesting-user-name \$user
  ATTR mimeMediaType document-format application/pdf

  GROUP job-attributes-tag
  ATTR name job-name "$JOB_NAME"
  ATTR integer copies $COPIES
  ATTR keyword media na_ledger_11x17in
  ATTR collection media-col {
    MEMBER collection media-size {
      MEMBER integer x-dimension 27940
      MEMBER integer y-dimension 43180
    }
    MEMBER integer media-top-margin 500
    MEMBER integer media-bottom-margin 500
    MEMBER integer media-left-margin 500
    MEMBER integer media-right-margin 500
    MEMBER keyword media-source tray-4
    MEMBER keyword media-type stationery
  }
  ATTR keyword sides one-sided
  ATTR enum orientation-requested 4
  ATTR keyword print-scaling fit

  FILE \$filename

  STATUS successful-ok
  EXPECT job-id OF-TYPE integer
  DISPLAY job-id
  DISPLAY job-state
  DISPLAY job-state-reasons
}
EOF

ipptool -tv -f "$PDF_PATH" "$PRINTER_URI" "$TEST_FILE"
