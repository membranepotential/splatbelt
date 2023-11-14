#!/bin/sh
set -e

# install brev 
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/brevdev/brev-cli/main/bin/install-latest.sh)"

# skip brev onboarding
mkdir -p /home/node/.brev
echo '{"step":1,"hasRunBrevShell":true,"hasRunBrevOpen":true}' > /home/node/.brev/onboarding_step.json
chown -R node:node /home/node/.brev
