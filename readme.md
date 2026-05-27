LG-IPTV

A fast, lightweight IPTV player built for webOS TVs by LG.
Supports M3U playlists and Xtream API with a clean and simple interface.

Features
Fast and lightweight IPTV client for webOS
Supports M3U playlists and Xtream Codes API
Clean and remote-friendly UI
No ads, no bundled channels
Auto-update support when installed via Homebrew
Manual Dev Mode sideloading supported
Installation
Option 1 — Install via Homebrew (Recommended)

Add the repository:

hb add-repo sharktie/lg-iptv https://sharktie.github.io/lg-iptv/index.json

Install the app:

hb install sharktie/lg-iptv

Homebrew repo file (for reference):
index.json (raw)

Option 2 — Manual Installation (Dev Mode)
Download the latest .ipk file:
LG‑IPTV Latest Release
Enable Developer Mode on your LG TV (see below).
Install webOS Dev Manager on your computer:
webOS Dev Manager
Connect to your TV via Dev Manager.
Click Install App and select the .ipk file.
How to Enable Developer Mode on Your LG TV
Open the LG Content Store → install Developer Mode app.
Sign in with your LG Developer account:
LG Developer Site
Open the app → enable Developer Mode → TV will reboot.
After reboot, open Developer Mode again and note your TV’s IP address.
Open Dev Manager on your PC → add your TV using that IP.
You can now sideload .ipk apps.
Configuration
Launch LG-IPTV on your TV.
Enter your M3U URL or Xtream API credentials.
Your channels will load automatically.

(No IPTV service is included — you must provide your own playlist/service.)

Supported IPTV Formats
M3U / M3U8
Xtream Codes API
Repository

GitHub Repository

Community / Support

Join the Discord server for support, feedback, and updates:
[LG‑IPTV Discord](https://discord.gg/2UmPGtWcMX)
