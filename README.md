# HUMAN

HUMAN is an annotation server that stands for...

-   **Hierarchical**: Supports annotation of hierarchical data. This makes it easy to annotate instances (e.g. online comments) together with their context (e.g. the thread of comments a comment was posted in).
-   **Universal**: Handles both textual data with and without context as well as PDFs and image annotation.
-   **Modular**: Various question types (labeling questions, multiple-choice, yes-no, setting bounding boxes etc.) that are self-contained and can be arranged in any order needed. This also makes it easy to implement new custom question types and features.
-   **ANnotator**: Comes with an easy to use GUI interface for your annotators and project manager.

# Demo

See our Demo on http://human.lsv.uni-saarland.de

# Installation and Setup

## Prerequisites

The only requirement is a working version of python 3.9.x. Using anaconda or [https://docs.conda.io/en/latest/miniconda.html](miniconda) for a python environment is highly recommended.

## Setup

### Python environment

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

```sh
pip install -r requirements.txt
```

### Setup script

Run `setup.sh` to finish the setup. This script will run the following tasks for you:

1. Ask you to set up an admin account (necessary for data upload).
2. Set up the database for you

### Annotation protocol

Write your custom annotation protocol into protocol.yml. Refer to the [wiki](https://github.com/uds-lsv/human/wiki) for documentation on how to do this and see our example protocols (under `/examples`) for inspiration.

To run the server locally for testing purposes run

```sh
flask start
```

Whenever you change any state names in protocol.yml, afterwards be sure to run

```sh
flask run reset-annotations
```

This will reset the annotations table in the database and is necessary to properly save annotations after a change in the protocol.

### Adding data

To add a file with data, start the server, log in with your admin account, and go to "Data Console". There you can upload the file.
Be sure that it is a tab separated file with the three columns "content", "context" and "meta".

When you want to display files you can use "Upload Folder" in "Data Console" and then upload a file with `<folder-name>/<file-name>` in the content fields for every file in the folder.

# Setup on a server

When running HUMAN in a production environment on a server we recommend using gunicorn (included in the environment). The script `start_server.sh` should take care of starting the server. First however, you should set a secure SECRET_KEY in config.py.

A Dockerfile to build an image and them run it in a container is also provided.

# Try our Examples!

WIP

<!-- Picture Annotation:

1. Copy and rename `/example/protocol_example_picture.json` to `/protocol.json`
2. Run `setup.sh`
3. Log in with your administrator account and upload the folder `/example/picture`
4. Upload the file `/example/data_example_picture.csv`
5. Go back to home and start annotating.

Text Annotation:

1. Copy and rename `/example/protocol_example_text.json` to `/protocol.json`
2. Run `setup.sh`
3. Log in with your administrator account and upload the file `/example/data_example_text.csv`
4. Go back to home and start annotating. -->

# Development

To make it easier to install, update and remove node, especially if you plan to maybe use it in other projects we recommend using the node version manager https://github.com/nvm-sh/nvm.

When debugging and working on client side code it is very convenient to let webpack watch file changes and transpile your code automatically: `npm run watch`

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
