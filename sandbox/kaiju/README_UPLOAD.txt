KAIJU RUN v0.85 — COMPLETE BUILD

Upload the CONTENTS of this folder to:

/sandbox/kaiju/

Your server should look like this:

/sandbox/kaiju/kaiju-run.html
/sandbox/kaiju/assets/
/sandbox/kaiju/scores/highscore.php
/sandbox/kaiju/scores/scores.json
/sandbox/kaiju/scores/.htaccess

Open the game:
http://iguanaman.com/sandbox/kaiju/kaiju-run.html

Test the high-score endpoint:
http://iguanaman.com/sandbox/kaiju/scores/highscore.php

Expected test response:
{"ok":true,"scores":[]}

Network Solutions setup:
1. Make sure this is uploaded inside the public web root for iguanaman.com.
2. Make sure PHP is enabled.
3. Set /scores/scores.json writable by PHP.
4. Try permissions 664 first.
5. If scores do not save, try 666 on scores.json only.
6. If highscore.php returns 500, temporarily remove /scores/.htaccess and test again.

This build includes every required game asset in /assets/.
