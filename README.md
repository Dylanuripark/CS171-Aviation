# CS171-Aviation

## Webpage
https://www.pranayvarada.com/projects/delayed-gratification/

## Screencast Overview
https://drive.google.com/file/d/1PL4_76wRmZ0SW6jP5GFXgjJckI_QbTvr/view?usp=share_link

## Repo Breakdown
### css
Contains the css style information for the webpage. styles.css is our code and fullpage.css is from a library
### data
Contains the aviation data as well as the Geojson data for the visualizations. Some of the data is duplicated and reformatted through R for ease of use.
### img
Contains the background image used in the landing page.
### js
Contains the javascript files for each visualization. Except for fullpage.js, which is a library, it is all our own code.
### index.html
Contains the html for the webpage structure and some styling. This is our own code.

## Libraries Used
We employed bootstrap to create the layout of the wepage and used fullpage.js to allowing for a page like scrolling experience.

For the visualizations we used d3 to connect the data with graphical elements.