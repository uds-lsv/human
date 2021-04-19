# HUMAN
HUMAN is an annotation server that stands for...
* **Hierarchical**: Supports annotation of hierarchical data. This makes it easy to annotate instances (e.g. online comments) together with their context (e.g. the thread of comments a comment was posted in).
* **Universal**: Handles both textual data with and without context as well as PDFs and image annotation.
* **Modular**: Various question types (labeling questions, multiple-choice, yes-no, setting bounding boxes etc.) that are self-contained and can be arranged in any order needed. This also makes it easy to implement new custom question types and features.
* **ANnotator**: Comes with an easy to use GUI interface for your annotators and project manager.

# Demo
See our Demo on http://human.lsv.uni-saarland.de

# Installation and Setup

## Prerequisites
The only requirements are a working version of node and python 3.7. Using anaconda or miniconda for a python environment is highly recommended.
To make it easier to install, update and remove node, especially if you plan to maybe use it in other projects we suggest using the node version manager https://github.com/nvm-sh/nvm.

## Installation
First install the python environment.

With Conda:

```sh
conda env create
```

then activate the environment with 
 ```sh
 conda activate human
 ```

OR install from requirements.txt with pip or whatever you fancy.

Next install the node modules. This is used to run gulp tasks to handle Typescript and minify the webpage.

```sh
npm install
```

## Setup

Write your custom annotation protocol into protocol.json. Refer to the [wiki](https://github.com/uds-lsv/human/wiki) for documentation on how to do this and see our example protocols (under `/examples`) for inspiration.

Then customize the variables inside of settings.ts e.g.:

```json
"url": "127.0.0.1:5000",
...
```

Finally run ```setup.sh``` to finish the setup. This script will run the following tasks for you: 
1. Installing dependencies for gulp 
2. Parsing the annotation protocol. Be sure to read all warnings and resolve all errors before continuing!
3. Ask you to set up an admin account (necessary for data upload). You can set that up later as well. 
4. Set up the database for you

Whenever you change something in the settings or the protocol be sure to run this script again.

To run the server locally run 
```sh
flask start
```

When debugging and changing things client side run let gulp watch changes and do tasks automatically: ```npm start watch```


## Adding data
To add a file with data, start the server, log in with your admin account, and go to "Data Console". There you can upload the file.
Be sure that it is a tab separated file with the three columns "content", "context" and "meta".

When you want to display files you can use "Upload Folder" in "Data Console" and then upload a file with ```<folder-name>/<file-name>``` in the content fields for every file in the folder.

# Try our Examples!

Picture Annotation:

1. Copy and rename ```/example/protocol_example_picture.json``` to ```/protocol.json```
2. Run ```setup.sh```
3. Log in with your administrator account and upload the folder ```/example/picture```
4. Upload the file ```/example/data_example_picture.csv```
5. Go back to home and start annotating.

Text Annotation:

1. Copy and rename ```/example/protocol_example_text.json``` to ```/protocol.json```
2. Run ```setup.sh```
4. Log in with your administrator account and upload the file ```/example/data_example_text.csv```
5. Go back to home and start annotating.


# Full Documentation

Visit the [wiki](https://github.com/uds-lsv/human/wiki) for full documentation.

# Authors

https://github.com/RainbowRevenge

https://github.com/ruitedk6

https://github.com/GeetDsa

# Paper

https://arxiv.org/abs/2010.01080

# Licence
HUMAN is licensed under GPL-3.
