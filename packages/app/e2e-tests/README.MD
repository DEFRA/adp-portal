To run the tests locally, you need to be able to run chrome. The framework will take care of downloading and running chrome itself, but the
dependencies required to run chrome arent considered. If running from within WSL, the easiest way to ensure this is to install chrome in wsl.
Once installed, you can safely uninstall it as its dependencies will be left in place for the e2e tests to make use of.

To install chrome in WSL:

1. Make sure everything is up to date:
   ```bash
   sudo apt update && sudo apt -y upgrade && sudo apt -y autoremove
   ```
2. Download & install the latest version of google chrome:
   ```bash
   wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
   sudo apt -y install ./google-chrome-stable_current_amd64.deb
   rm ./google-chrome-stable_current_amd64.deb
   ```
3. (Optional) Uninstall chrome:
   ```bash
   sudo apt -y remove google-chrome-stable
   ```
