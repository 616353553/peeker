# Peeker
A chrome extension

## Before use
1. Download the code
2. Go to Extensions Page (chrome://extensions) and enable **developer mode**
2. Click **Load unpacked** button and select the folder you just downloaded from step 1. After that, you will see an **eye shaped** icon at the top-right corner of your browser, and that icon will be the extension icon
3. Make sure your broswer is signed in, in other words, do NOT use this extension as a guest user!!!
4. Enable Google Drive API by following this [instruction](https://developers.google.com/drive/api/v3/enable-drive-api)

## How to use
1. Click the the extension icon
2. Click **log in** button, a *google log in page* should pops up
3. After log in, click **Start Peeking** button and wait, a message should appear at the top of the view and telling you the folder id in which all of the captured html will be stored (the folder name will be *question_\<time-stamp>*)
4. Go to your Google Drive, and change the visibility of the folder as **ON** so that eveyone can see it
5. Double-click on a new-created webpage will trigger this extension, and the webpage will be saved to your google drive in the folder created at step 3, (this extension will not work on webpages opened before this extention kicked in)
