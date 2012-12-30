## Adobe Edge Inspect - Snapshot Viewer

This project generates a user friendly way of viewing & managing the snapshots created by [Adobe Edge Inspect](http://html.adobe.com/edge/inspect/).

**DEMO LINK:** [http://edge.peterschmalfeldt.com](http://edge.peterschmalfeldt.com) - *Permissions Disabled to Delete Snapshots*

**FEATURES:**

* Responsive design adjusts to fit your device
* Filter Snapshots by Date, URL or Operating System
* View Snapshots using Lightbox
* Remove old Snapshot Groups that you no longer need

**REQUIREMENTS:**

1. [Adobe Edge Inspect](http://html.adobe.com/edge/inspect/) - You'll want the Pro account if you are going to test multiple devices at the same time
2. [Google Chrome Extension](https://chrome.google.com/webstore/detail/adobe-edge-inspect/ijoeapleklopieoejahbpdnhkjjgddem?hl=en) - You'll need this to connect to your mobile devices


## Setup Instructions

1. First you will need to configure **PATH_TO_SNAPSHOTS** in **snapshots.php** to point to where you have your snapshots folder.  Ideally you should just create a symbolic link named "snapshots" in this folder that points to where your Adobe Edge folder is installed.

	**You can do this via command line using:**

	``ln -s /Users/`whoami`/Documents/Edge\ Inspect /path/to/this/folder/snapshots``

	**TIP:**  You can figure out where your Adobe Edge Inspect folder is located by using the Google Chrome extension and clicking the icon that opens the folder.

2. Access this web application from your browser.  It will perform some checks to make sure you have everything setup correctly and offer suggestions if you did not.

3. I have noticed that some devices can contain special characters.  When Adobe Edge Inspect does a screenshot of these devices, it can cause issues with the file names.  To resolve this issue, I have created two files in the **helpers** folder that can be of use ( I personally use them on all computers setup with this application, as it greatly simplifies things ).
	* The first file, **clean.sh**, is something that renames the files in the Edge Inspect folder to remove any special characters. If you are using OSX, you will not need to change this file, if you are using something else, you will need to change line two to point to where the Edge Inspect folder is located.

	* The second file, **Edge Inspect.workflow**, is specific to OSX and is use to watch for changed in the Adobe Edge folder and automatically update the file names.  This is what I am using as I do not need to remember to run the shell script each time, and it just works ;)

## Screenshots

### Main Page
Shows all device Snapshots grouped by when they were taken. Easily navigate to previous snapshots with previous & next buttons.

![Main Page](http://farm9.staticflickr.com/8072/8318018251_81be592f5d_c.jpg "Main Page")

### Custom Filters
Easily locate what you are looking for by filtering your Snapshots by Date, URL or Operating System.

![Custom Filters](http://farm9.staticflickr.com/8497/8318018185_f463069fc1_c.jpg "Custom Filters")

### Snapshot Lightbox
View your Snapshots using Lightbox with immediate display of device details.

![Snapshot Lightbox](http://farm9.staticflickr.com/8071/8318018021_172526bf96_c.jpg "Snapshot Lightbox")

### Remove Old Snapshots
Use our viewer to easily remove old Snapshot Groups that you no longer need.

![Remove Old Snapshots](http://farm9.staticflickr.com/8223/8319075214_cf9a86da12_c.jpg "Remove Old Snapshots")