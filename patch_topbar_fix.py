import re

with open('src/components/TopBar.tsx', 'r') as f:
    content = f.read()

nav_item = """
    {
      id: 'multiplayer',
      label: 'Freunde-Lobby',
      mobileLabel: 'Freunde',
      icon: Users,
    },
    {
      id: 'clan',
      label: 'Mein Clan',
      mobileLabel: 'Clan',
      icon: Users,
    },
"""
content = re.sub(r'(\{\n\s*id: \'multiplayer\',\n\s*label: \'Freunde-Lobby\',\n\s*mobileLabel: \'Freunde\',\n\s*icon: Users,\n\s*\},)', nav_item.strip() + ',', content)

with open('src/components/TopBar.tsx', 'w') as f:
    f.write(content)
